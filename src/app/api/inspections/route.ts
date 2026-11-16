import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/inspections?wo=...&stage=...&result=...&limit=50&plant=K2
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const woId = searchParams.get("wo");
  const stageId = searchParams.get("stage");
  const result = searchParams.get("result");
  const limit = Number(searchParams.get("limit") || 50);
  const plant = searchParams.get("plant") || "K2";

  const where: any = {};
  if (woId) where.workOrderId = woId;
  if (stageId) where.stageId = stageId;
  if (result && result !== "all") where.overallResult = result;
  if (!woId && plant && plant !== "all") where.workOrder = { routeCode: plant };

  const records = await db.inspectionRecord.findMany({
    where,
    orderBy: { inspectedAt: "desc" },
    take: limit,
    include: {
      stage: { select: { name: true, stageCode: true, documentRef: true } },
      workOrder: { select: { woNumber: true, customer: true, itemName: true, size: true } },
    },
  });

  return NextResponse.json({ records });
}

// POST /api/inspections - submit new inspection
export async function POST(req: NextRequest) {
  const body = await req.json();
  const seq = await db.inspectionRecord.count();
  const recordNo = `INS-${new Date().getFullYear()}-${String(seq + 1).padStart(4, "0")}`;

  const measurements = body.measurements || {};
  let allPass = true;
  let ctqFail = false;
  for (const k of Object.keys(measurements)) {
    if (!measurements[k].pass) allPass = false;
    if (!measurements[k].pass && measurements[k].ctq) ctqFail = true;
  }
  const overallResult = ctqFail ? "Fail" : allPass ? "Pass" : body.overallResult || "Pending";

  // Determine disposition: if the inspector chose Rework or Scrap, the result
  // is a Fail regardless of individual characteristic pass/fail.
  const disposition = body.disposition || null; // "Rework" | "Scrap" | null
  const finalResult = disposition ? "Fail" : overallResult;

  const rec = await db.inspectionRecord.create({
    data: {
      recordNo,
      workOrderId: body.workOrderId,
      stageId: body.stageId,
      htuNo: body.htuNo || null,
      shift: body.shift || "A",
      inspector: body.inspector || "QA",
      operator: body.operator || null,
      overallResult: finalResult,
      ctqResult: ctqFail ? "Fail" : "Pass",
      measurements: JSON.stringify(measurements),
      defectsFound: finalResult !== "Pass" ? JSON.stringify(body.defectsFound || []) : null,
      notes: body.notes || null,
    },
    include: { stage: true, workOrder: true },
  });

  // If fail, auto-create NCR + linked Rework Job Order
  let rwoNumber: string | null = null;
  if (finalResult === "Fail") {
    const ncrSeq = await db.nonconformance.count();
    const wo = await db.workOrder.findUnique({ where: { id: body.workOrderId } });

    // Determine defect category from failed characteristics
    const failedChars = Object.entries(measurements)
      .filter(([_, m]: [string, any]) => !m.pass)
      .map(([_, m]: [string, any]) => m.name || "Unknown");
    const defectCategory = body.defectCategory || (failedChars.length > 0 ? failedChars[0] : "Inspection Failure");

    await db.nonconformance.create({
      data: {
        ncrNumber: `NCR-${new Date().getFullYear()}-${String(ncrSeq + 1).padStart(3, "0")}`,
        workOrderId: body.workOrderId,
        inspectionId: rec.id,
        stageName: rec.stage?.name || "",
        htuno: body.htuNo || null,
        defectCategory,
        severity: ctqFail ? "Critical" : "Major",
        status: "Open",
        description: `Auto-generated from inspection ${recordNo}. CTQ failure detected at ${rec.stage?.name}. Failed: ${failedChars.join(", ")}`,
        containment: disposition === "Scrap"
          ? "Product flagged for scrap pending QA authorization."
          : "Job placed on hold pending QA review and rework authorization.",
      },
    });

    // Create a linked Rework Job Order so the defect is traceable from
    // inspection → rework → verification → closure.
    if (disposition === "Rework" || disposition === "Scrap") {
      const rwoSeq = await db.reworkJobOrder.count();
      rwoNumber = `RW-K2-${new Date().getFullYear()}-${String(rwoSeq + 1).padStart(6, "0")}`;
      await db.reworkJobOrder.create({
        data: {
          rwoNumber,
          workOrderId: body.workOrderId,
          htuNo: body.htuNo || null,
          originatingProcess: rec.stage?.name || "Unknown",
          detectionProcess: rec.stage?.name || "Unknown",
          defectCategory,
          defectDescription: `Raised from inspection ${recordNo}. Failed characteristics: ${failedChars.join(", ")}`,
          defectQuantity: 1,
          severity: ctqFail ? "Critical" : "Major",
          status: disposition === "Scrap" ? "Scrapped" : "Reported",
          disposition: disposition === "Scrap" ? "Scrap" : "Rework",
          currentLocation: "Inspection Area - pending tag",
          // Link back to the originating inspection via the notes field
          // (a dedicated inspectionId FK can be added to the schema later)
        },
      });
      // Record the creation event in the rework timeline
      await db.reworkEvent.create({
        data: {
          rwoId: (await db.reworkJobOrder.findUnique({ where: { rwoNumber } }))!.id,
          eventType: "CREATED",
          toStatus: disposition === "Scrap" ? "Scrapped" : "Reported",
          toLocation: "Inspection Area",
          notes: `Auto-created from inspection ${recordNo} by ${body.inspector || "QA"}`,
        },
      });
    }

    // Mark work order on hold
    if (wo && wo.status !== "On Hold") {
      await db.workOrder.update({ where: { id: body.workOrderId }, data: { status: "On Hold" } });
    }
  }

  return NextResponse.json({ record: rec, rwoNumber });
}
