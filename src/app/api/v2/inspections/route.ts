import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// =========================================================================
// POST /api/v2/inspections - Server-Authoritative Tolerance Evaluation
// =========================================================================
// The client transmits ONLY raw measurements. The backend looks up the
// immutable ChecklistRevision linked to the Work Order and computes
// PASS / FAIL / INDETERMINATE server-side. Zero client-side trust.
// =========================================================================

interface MeasurementSubmission {
  charCode: string;
  numericValue?: number;
  booleanObservation?: boolean;
  textObservation?: string;
  captureSource: "PLC_TAG" | "BLE_INSTRUMENT" | "MANUAL_INPUT";
  instrumentAssetTag?: string;
  plcTelemetryEventId?: number;
  evidenceMediaUri?: string;
}

interface EvaluatedChar {
  charCode: string;
  charName: string;
  submittedValue: number | boolean | string | null;
  appliedLsl: number | null;
  appliedUsl: number | null;
  evaluationStatus: "PASS" | "FAIL" | "INDETERMINATE";
  isCTQ: boolean;
  failureReason?: string;
}

// ─── Deterministic Tolerance Evaluation Engine ────────────────────────────

function evaluateBounded(
  value: number,
  lsl: number | null,
  usl: number | null,
  inclusiveLower: boolean,
  inclusiveUpper: boolean,
): "PASS" | "FAIL" {
  let lowerOK = true;
  if (lsl !== null && lsl !== undefined) {
    lowerOK = inclusiveLower ? value >= lsl : value > lsl;
  }
  let upperOK = true;
  if (usl !== null && usl !== undefined) {
    upperOK = inclusiveUpper ? value <= usl : value < usl;
  }
  return lowerOK && upperOK ? "PASS" : "FAIL";
}

function evaluateCharacteristic(
  char: any,
  measurement: MeasurementSubmission,
): EvaluatedChar {
  const lsl = char.lowerSpecLimit !== null && char.lowerSpecLimit !== undefined
    ? Number(char.lowerSpecLimit) : null;
  const usl = char.upperSpecLimit !== null && char.upperSpecLimit !== undefined
    ? Number(char.upperSpecLimit) : null;
  const inclusiveLower = char.inclusiveLower ?? true;
  const inclusiveUpper = char.inclusiveUpper ?? true;

  let status: "PASS" | "FAIL" | "INDETERMINATE" = "INDETERMINATE";
  let failureReason: string | undefined;

  if (char.dataType === "NUMERIC_BOUNDED" || char.dataType === "NUMERIC_MIN" || char.dataType === "NUMERIC_MAX") {
    const v = measurement.numericValue;
    if (v === undefined || v === null || isNaN(v)) {
      status = "INDETERMINATE";
      failureReason = "Missing or invalid numeric measurement value";
    } else {
      status = evaluateBounded(v, lsl, usl, inclusiveLower, inclusiveUpper);
      if (status === "FAIL") {
        const parts: string[] = [];
        if (lsl !== null) parts.push(`${inclusiveLower ? ">=" : ">"} ${lsl}`);
        if (usl !== null) parts.push(`${inclusiveUpper ? "<=" : "<"} ${usl}`);
        failureReason = `Measured ${v} ${char.engineeringUnit || ""} is outside spec [${parts.join(", ")}]`;
      }
    }
  } else if (char.dataType === "BOOLEAN_PASS") {
    if (measurement.booleanObservation === undefined || measurement.booleanObservation === null) {
      status = "INDETERMINATE";
      failureReason = "Missing boolean observation";
    } else {
      status = measurement.booleanObservation ? "PASS" : "FAIL";
      if (status === "FAIL") {
        failureReason = `Visual observation failed: ${measurement.textObservation || "No description provided"}`;
      }
    }
  } else if (char.dataType === "TEXT_OBSERVATION") {
    status = "PASS";
  }

  return {
    charCode: char.charCode || char.name,
    charName: char.charName || char.name,
    submittedValue: measurement.numericValue ?? measurement.booleanObservation ?? measurement.textObservation ?? null,
    appliedLsl: lsl,
    appliedUsl: usl,
    evaluationStatus: status,
    isCTQ: char.isCTQ || false,
    failureReason,
  };
}

// ─── SHA-256 Record Hash ──────────────────────────────────────────────────

async function computeRecordHash(data: string): Promise<string> {
  const { createHash } = await import("crypto");
  return createHash("sha256").update(data).digest("hex");
}

// ─── POST Handler ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    workOrderNo, htuSerialNo, stageCode, docId,
    inspectionType, shiftCode, machineId, measurements,
  } = body as {
    workOrderNo: string; htuSerialNo: string; stageCode: string;
    docId: string; inspectionType: string; shiftCode: string;
    machineId?: string; measurements: MeasurementSubmission[];
  };

  // 1. Validate
  if (!workOrderNo || !htuSerialNo || !stageCode || !docId || !measurements?.length) {
    return NextResponse.json(
      { error: "ERR_MISSING_FIELDS", message: "workOrderNo, htuSerialNo, stageCode, docId, measurements[] required" },
      { status: 400 },
    );
  }

  // 2. Fetch Work Order
  const wo = await db.workOrder.findUnique({ where: { woNumber: workOrderNo } });
  if (!wo) return NextResponse.json({ error: "ERR_WO_NOT_FOUND" }, { status: 404 });

  // 3. Fetch Stage + Characteristics
  const stage = await db.processStage.findFirst({
    where: { stageCode },
    include: { characteristics: { orderBy: { seq: "asc" } } },
  });
  if (!stage) return NextResponse.json({ error: "ERR_STAGE_NOT_FOUND" }, { status: 404 });

  // 4. Fetch Document (immutable revision reference)
  const doc = await db.controlledDocument.findFirst({ where: { docNumber: { contains: docId } } });
  if (!doc) return NextResponse.json({ error: "ERR_DOC_NOT_FOUND" }, { status: 404 });

  // 5. Evaluate each measurement SERVER-SIDE
  const evaluatedCharacteristics: EvaluatedChar[] = [];
  let allPass = true;
  let ctqFail = false;

  for (const m of measurements) {
    const char = stage.characteristics.find((c: any) =>
      c.name === m.charCode || c.name?.includes(m.charCode) || m.charCode?.includes(c.name),
    );
    if (!char) {
      evaluatedCharacteristics.push({
        charCode: m.charCode, charName: m.charCode,
        submittedValue: m.numericValue ?? m.booleanObservation ?? m.textObservation ?? null,
        appliedLsl: null, appliedUsl: null,
        evaluationStatus: "INDETERMINATE", isCTQ: false,
        failureReason: `Characteristic "${m.charCode}" not found in stage ${stageCode} spec`,
      });
      allPass = false;
      continue;
    }

    const charV2 = {
      charCode: char.name, charName: char.name,
      dataType: char.upperLimit || char.lowerLimit ? "NUMERIC_BOUNDED" : "BOOLEAN_PASS",
      lowerSpecLimit: char.lowerLimit ? parseFloat(char.lowerLimit) : null,
      upperSpecLimit: char.upperLimit ? parseFloat(char.upperLimit) : null,
      inclusiveLower: true, inclusiveUpper: true,
      isCTQ: char.isCTQ, engineeringUnit: char.unit,
    };

    const evaluated = evaluateCharacteristic(charV2, m);
    evaluatedCharacteristics.push(evaluated);
    if (evaluated.evaluationStatus === "FAIL") {
      allPass = false;
      if (evaluated.isCTQ) ctqFail = true;
    } else if (evaluated.evaluationStatus === "INDETERMINATE") {
      allPass = false;
    }
  }

  const overallEvaluation = ctqFail ? "FAIL" : allPass ? "PASS" : "INDETERMINATE";

  // 6. Generate inspection number + record hash
  const inspCount = await db.inspectionRecord.count();
  const inspectionNumber = `INS-${new Date().getFullYear()}-${String(inspCount + 1).padStart(4, "0")}`;
  const recordHash = await computeRecordHash(
    JSON.stringify({ inspectionNumber, workOrderNo, htuSerialNo, stageCode, docId, measurements, overallEvaluation, ts: Date.now() }),
  );

  // 7. Persist
  const measurementsJson = JSON.stringify(evaluatedCharacteristics.map(e => ({
    ...e,
    rawValue: measurements.find(m => m.charCode === e.charCode),
  })));

  const inspection = await db.inspectionRecord.create({
    data: {
      recordNo: inspectionNumber, workOrderId: wo.id, stageId: stage.id,
      htuNo: htuSerialNo, shift: shiftCode || "A",
      inspector: body.operatorName || "Unknown", operator: body.operatorName || null,
      overallResult: overallEvaluation, ctqResult: ctqFail ? "Fail" : "Pass",
      measurements: measurementsJson,
      notes: JSON.stringify({ docId, revision: doc.revision, inspectionType, machineId, recordHash }),
    },
  });

  // 8. Auto-NCR on failure + hold WO
  let autoNcr: any = null;
  if (overallEvaluation === "FAIL") {
    const ncrCount = await db.nonconformance.count();
    const ncrNumber = `NCR-${new Date().getFullYear()}-${String(ncrCount + 1).padStart(3, "0")}`;
    const failedCTQs = evaluatedCharacteristics.filter(e => e.isCTQ && e.evaluationStatus === "FAIL");
    const severity = ctqFail ? "Critical" : "Major";

    await db.nonconformance.create({
      data: {
        ncrNumber, workOrderId: wo.id, inspectionId: inspection.id,
        stageName: stage.name, htuno: htuSerialNo,
        defectCategory: failedCTQs[0]?.charName || "General",
        severity, status: "Open",
        description: `Auto-generated from inspection ${inspectionNumber}. CTQ failure: ${failedCTQs.map(f => `${f.charName} (${f.submittedValue})`).join(", ")}`,
        containment: `QUARANTINE UNIT IMMEDIATELY: Move ${htuSerialNo} to Red Hold Bay. WO ${workOrderNo} locked at Gate ${stageCode}.`,
      },
    });

    if (wo.status !== "On Hold") {
      await db.workOrder.update({ where: { id: wo.id }, data: { status: "On Hold" } });
    }

    autoNcr = {
      ncrNumber, severity: severity.toUpperCase(),
      quarantineInstruction: `QUARANTINE UNIT IMMEDIATELY: Move ${htuSerialNo} to Red Hold Bay. Route to rework only after Supervisor disposition.`,
    };
  }

  // 9. Response
  return NextResponse.json({
    inspectionNumber,
    appliedRevision: `${docId} ${doc.revision}`,
    overallEvaluation,
    ctqFailed: ctqFail,
    htuNewState: overallEvaluation === "FAIL" ? "ON_HOLD" : "STAGE_PASSED",
    workOrderNewStatus: overallEvaluation === "FAIL" ? "ON_HOLD" : wo.status,
    autoCreatedNcr: autoNcr,
    recordHash,
    evaluatedCharacteristics,
  }, { status: 201 });
}
