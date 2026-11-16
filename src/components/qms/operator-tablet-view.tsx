"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  ScanLine, CheckCircle2, XCircle, AlertTriangle, ArrowRight,
  Lock, ShieldAlert, Thermometer, Ruler, Zap, Loader2, RefreshCw,
} from "lucide-react";

// =========================================================================
// VIEW A: Operator Shop-Floor Tablet View (S01 Rolling & Forming)
// =========================================================================
// Design rules:
// - Tablet-first: large touch targets (min 56px height)
// - Zero-choice navigation: barcode scan auto-routes to correct screen
// - Poka-Yoke: submit disabled until all CTQ fields populated; out-of-bounds
//   numbers rejected instantly via client-side pre-validation
// - CTQ failure turns entire UI red with quarantine instruction
// - Server-authoritative: client sends raw measurements only, backend
//   evaluates tolerances. But we pre-validate on client for instant feedback.
// =========================================================================

// ─── Types ────────────────────────────────────────────────────────────────

interface SpecCharacteristic {
  charCode: string;
  charName: string;
  dataType: "NUMERIC_BOUNDED" | "BOOLEAN_PASS" | "TEXT_OBSERVATION";
  engineeringUnit?: string;
  nominalValue?: number;
  lowerSpecLimit?: number | null;
  upperSpecLimit?: number | null;
  inclusiveLower: boolean;
  inclusiveUpper: boolean;
  isCTQ: boolean;
  method?: string;
  displayOrder: number;
}

interface MeasurementEntry {
  numericValue?: number;
  booleanObservation?: boolean;
  textObservation?: string;
  captureSource: "MANUAL_INPUT" | "BLE_INSTRUMENT" | "PLC_TAG";
}

type ScanState = "WAITING" | "SCANNING" | "SCANNED" | "NOT_FOUND";
type SubmitState = "IDLE" | "SUBMITTING" | "PASS" | "FAIL" | "INDETERMINATE";

// ─── S01 Rolling & Forming Characteristics (from QCI/F/02/01 Rev.05) ─────

const S01_CHARACTERISTICS: SpecCharacteristic[] = [
  {
    charCode: "SHEET_THICKNESS",
    charName: "Sheet Thickness",
    dataType: "NUMERIC_BOUNDED",
    engineeringUnit: "mm",
    nominalValue: 1.20,
    lowerSpecLimit: null, // "As per Drg./Tol. ±0.03 mm" - use nominal ± tol
    upperSpecLimit: null,
    inclusiveLower: true,
    inclusiveUpper: true,
    isCTQ: false,
    method: "Micrometer",
    displayOrder: 1,
  },
  {
    charCode: "SHEET_WIDTH",
    charName: "Sheet Width",
    dataType: "NUMERIC_BOUNDED",
    engineeringUnit: "mm",
    nominalValue: 520,
    lowerSpecLimit: 519,
    upperSpecLimit: 521,
    inclusiveLower: true,
    inclusiveUpper: true,
    isCTQ: false,
    method: "Measuring tape",
    displayOrder: 2,
  },
  {
    charCode: "NECK_TO_NECK_DIST",
    charName: "Neck-to-Neck Distance",
    dataType: "NUMERIC_BOUNDED",
    engineeringUnit: "mm",
    nominalValue: 250,
    lowerSpecLimit: 249,
    upperSpecLimit: 251,
    inclusiveLower: true,
    inclusiveUpper: true,
    isCTQ: true,
    method: "Measuring Tape",
    displayOrder: 3,
  },
  {
    charCode: "LENGTH_BOW",
    charName: "Length-wise Bow",
    dataType: "NUMERIC_MAX",
    engineeringUnit: "mm",
    upperSpecLimit: 5,
    lowerSpecLimit: null,
    inclusiveLower: true,
    inclusiveUpper: true,
    isCTQ: false,
    method: "Line dori & tape",
    displayOrder: 4,
  },
  {
    charCode: "WIDTH_BOW",
    charName: "Width-wise Bow",
    dataType: "NUMERIC_MAX",
    engineeringUnit: "mm",
    upperSpecLimit: 3,
    lowerSpecLimit: null,
    inclusiveLower: true,
    inclusiveUpper: true,
    isCTQ: false,
    method: "Line dori & filler gauge",
    displayOrder: 5,
  },
  {
    charCode: "ROLLING_MATCH",
    charName: "Forming & Rolling Matching",
    dataType: "NUMERIC_MAX",
    engineeringUnit: "mm",
    upperSpecLimit: 2.0,
    lowerSpecLimit: null,
    inclusiveLower: true,
    inclusiveUpper: true,
    isCTQ: false,
    method: "Measuring tape",
    displayOrder: 6,
  },
  {
    charCode: "SHEET_WEAVINESS",
    charName: "Sheet Weaviness",
    dataType: "BOOLEAN_PASS",
    isCTQ: false,
    method: "Visual",
    inclusiveLower: true,
    inclusiveUpper: true,
    displayOrder: 7,
  },
  {
    charCode: "DIE_DEPTH",
    charName: "Die Depth",
    dataType: "NUMERIC_BOUNDED",
    engineeringUnit: "mm",
    nominalValue: 4.25,
    lowerSpecLimit: 3.5,
    upperSpecLimit: 5.0,
    inclusiveLower: true,
    inclusiveUpper: true,
    isCTQ: false,
    method: "Depth Micrometer",
    displayOrder: 8,
  },
  {
    charCode: "ROLLING_DEPTH",
    charName: "Rolling Depth",
    dataType: "NUMERIC_BOUNDED",
    engineeringUnit: "mm",
    nominalValue: 4.5,
    lowerSpecLimit: 4.0,
    upperSpecLimit: 5.0,
    inclusiveLower: true,
    inclusiveUpper: true,
    isCTQ: false,
    method: "Depth Micrometer",
    displayOrder: 9,
  },
  {
    charCode: "CUT_FIN_DIM",
    charName: "Cut Fin Dimension (X & Y)",
    dataType: "NUMERIC_BOUNDED",
    engineeringUnit: "mm",
    nominalValue: 520,
    lowerSpecLimit: 515,
    upperSpecLimit: 525,
    inclusiveLower: true,
    inclusiveUpper: true,
    isCTQ: false,
    method: "Measuring tape",
    displayOrder: 10,
  },
];

// ─── Client-side pre-evaluation (instant Poka-Yoke feedback) ──────────────

function preEvaluate(char: SpecCharacteristic, value: number | boolean | undefined): "PASS" | "FAIL" | "INDETERMINATE" {
  if (value === undefined || value === null) return "INDETERMINATE";

  if (char.dataType === "BOOLEAN_PASS") {
    return value === true ? "PASS" : "FAIL";
  }

  if (char.dataType === "NUMERIC_BOUNDED" || char.dataType === "NUMERIC_MIN" || char.dataType === "NUMERIC_MAX") {
    const v = value as number;
    if (isNaN(v)) return "INDETERMINATE";

    let lowerOK = true;
    if (char.lowerSpecLimit !== null && char.lowerSpecLimit !== undefined) {
      lowerOK = char.inclusiveLower ? v >= char.lowerSpecLimit : v > char.lowerSpecLimit;
    }

    let upperOK = true;
    if (char.upperSpecLimit !== null && char.upperSpecLimit !== undefined) {
      upperOK = char.inclusiveUpper ? v <= char.upperSpecLimit : v < char.upperSpecLimit;
    }

    return lowerOK && upperOK ? "PASS" : "FAIL";
  }

  return "PASS";
}

// ─── Component ────────────────────────────────────────────────────────────

export function OperatorTabletView() {
  const [scanState, setScanState] = useState<ScanState>("WAITING");
  const [scannedBarcode, setScannedBarcode] = useState<string>("");
  const [workOrderNo, setWorkOrderNo] = useState<string>("");
  const [htuSerialNo, setHtuSerialNo] = useState<string>("");
  const [measurements, setMeasurements] = useState<Record<string, MeasurementEntry>>({});
  const [submitState, setSubmitState] = useState<SubmitState>("IDLE");
  const [submitResult, setSubmitResult] = useState<any>(null);
  const [ctqFailureFlash, setCtqFailureFlash] = useState(false);

  // Simulate barcode scan
  const simulateScan = useCallback(() => {
    setScanState("SCANNING");
    setTimeout(() => {
      // Simulate a real barcode: HTU-K2-001|WO-3005
      const barcode = "HTU-K2-001|WO-3005";
      const [htu, wo] = barcode.split("|");
      setScannedBarcode(barcode);
      setHtuSerialNo(htu);
      setWorkOrderNo(wo);
      setScanState("SCANNED");
      setMeasurements({});
      setSubmitState("IDLE");
      setSubmitResult(null);
      setCtqFailureFlash(false);
    }, 800);
  }, []);

  // ── Pre-evaluate all characteristics for Poka-Yoke ──
  const evaluations = useMemo(() => {
    const evals: Record<string, "PASS" | "FAIL" | "INDETERMINATE"> = {};
    let allPopulated = true;
    let anyFail = false;
    let anyCTQFail = false;
    let anyIndeterminate = false;

    for (const char of S01_CHARACTERISTICS) {
      const m = measurements[char.charCode];
      const value = char.dataType === "BOOLEAN_PASS"
        ? m?.booleanObservation
        : m?.numericValue;

      const status = preEvaluate(char, value);
      evals[char.charCode] = status;

      if (status === "INDETERMINATE") {
        allPopulated = false;
        anyIndeterminate = true;
      }
      if (status === "FAIL") {
        anyFail = true;
        if (char.isCTQ) anyCTQFail = true;
      }
    }

    return { evals, allPopulated, anyFail, anyCTQFail, anyIndeterminate };
  }, [measurements]);

  // ── Submit handler - sends raw measurements to server ──
  const handleSubmit = async () => {
    if (!evaluations.allPopulated) return;

    setSubmitState("SUBMITTING");

    // Build payload with raw measurements only - NO pass/fail booleans
    const payload = {
      workOrderNo,
      htuSerialNo,
      stageCode: "S01",
      docId: "QCI-F-02-01",
      inspectionType: "IN_PROCESS",
      shiftCode: "A",
      operatorName: "Ravi Kamble",
      measurements: S01_CHARACTERISTICS.map(char => {
        const m = measurements[char.charCode];
        return {
          charCode: char.charCode,
          numericValue: m?.numericValue,
          booleanObservation: m?.booleanObservation,
          textObservation: m?.textObservation,
          captureSource: "MANUAL_INPUT",
        };
      }),
    };

    try {
      const res = await fetch("/api/v2/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.overallEvaluation === "FAIL") {
        setSubmitState("FAIL");
        setCtqFailureFlash(true);
        setSubmitResult(data);
      } else if (data.overallEvaluation === "PASS") {
        setSubmitState("PASS");
        setSubmitResult(data);
      } else {
        setSubmitState("INDETERMINATE");
        setSubmitResult(data);
      }
    } catch {
      setSubmitState("INDETERMINATE");
    }
  };

  const resetForm = () => {
    setScanState("WAITING");
    setScannedBarcode("");
    setWorkOrderNo("");
    setHtuSerialNo("");
    setMeasurements({});
    setSubmitState("IDLE");
    setSubmitResult(null);
    setCtqFailureFlash(false);
  };

  // ── Determine if submit button should be enabled ──
  const canSubmit = evaluations.allPopulated && submitState === "IDLE" && scanState === "SCANNED";

  // ── CTQ failure overlay ──
  if (ctqFailureFlash && submitResult) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{ backgroundColor: "#fef2f2" }}>
        <div className="max-w-2xl w-full">
          <div className="rounded-lg p-8 text-center" style={{ border: "2px solid #dc2626", backgroundColor: "#ffffff" }}>
            <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: "#dc2626" }}>
              <ShieldAlert size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#dc2626" }}>CTQ FAILURE - QUARANTINE REQUIRED</h1>
            <p className="text-lg mb-6" style={{ color: "#7f1d1d" }}>
              Inspection {submitResult.inspectionNumber} has failed a Critical-to-Quality characteristic.
            </p>

            <div className="rounded-lg p-4 mb-6 text-left" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
              <div className="text-sm font-semibold mb-2" style={{ color: "#dc2626" }}>QUARANTINE INSTRUCTION</div>
              <p className="text-sm" style={{ color: "#7f1d1d" }}>
                {submitResult.autoCreatedNcr?.quarantineInstruction || `Move ${htuSerialNo} to Red Hold Bay immediately.`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-left">
              <div className="rounded-lg p-3" style={{ backgroundColor: "#f9fafb" }}>
                <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#6b7280" }}>NCR Number</div>
                <div className="text-lg font-mono font-bold" style={{ color: "#dc2626" }}>{submitResult.autoCreatedNcr?.ncrNumber || "-"}</div>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: "#f9fafb" }}>
                <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#6b7280" }}>Severity</div>
                <div className="text-lg font-bold" style={{ color: "#dc2626" }}>{submitResult.autoCreatedNcr?.severity || "CRITICAL"}</div>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: "#f9fafb" }}>
                <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#6b7280" }}>HTU State</div>
                <div className="text-lg font-bold" style={{ color: "#dc2626" }}>{submitResult.htuNewState}</div>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: "#f9fafb" }}>
                <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#6b7280" }}>Work Order</div>
                <div className="text-lg font-bold" style={{ color: "#dc2626" }}>{workOrderNo} → ON HOLD</div>
              </div>
            </div>

            {/* Failed characteristics */}
            <div className="text-left mb-6">
              <div className="text-sm font-semibold mb-2" style={{ color: "#dc2626" }}>FAILED CTQ CHARACTERISTICS</div>
              {submitResult.evaluatedCharacteristics
                ?.filter((c: any) => c.isCTQ && c.evaluationStatus === "FAIL")
                .map((c: any) => (
                  <div key={c.charCode} className="rounded-lg p-3 mb-2" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
                    <div className="font-semibold text-sm" style={{ color: "#7f1d1d" }}>{c.charName}</div>
                    <div className="text-sm mt-1" style={{ color: "#991b1b" }}>
                      Measured: {c.submittedValue} {c.appliedLsl !== null ? `| Spec: ${c.appliedLsl}–${c.appliedUsl}` : ""}
                    </div>
                    <div className="text-xs mt-1" style={{ color: "#7f1d1d" }}>{c.failureReason}</div>
                  </div>
                ))}
            </div>

            <button
              onClick={resetForm}
              className="w-full h-16 rounded-lg text-lg font-semibold transition-colors"
              style={{ backgroundColor: "#dc2626", color: "#ffffff" }}
            >
              Acknowledge & Scan Next Unit
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Pass result ──
  if (submitState === "PASS" && submitResult) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{ backgroundColor: "#f0fdf4" }}>
        <div className="max-w-md w-full">
          <div className="rounded-lg p-8 text-center" style={{ border: "2px solid #159640", backgroundColor: "#ffffff" }}>
            <CheckCircle2 size={64} className="mx-auto mb-4" style={{ color: "#159640" }} />
            <h1 className="text-2xl font-bold mb-2" style={{ color: "#159640" }}>Inspection PASSED</h1>
            <p className="text-sm mb-6" style={{ color: "#166534" }}>
              {submitResult.inspectionNumber} - All characteristics within specification.
            </p>
            <div className="text-sm font-mono mb-6" style={{ color: "#6b7280" }}>
              Hash: {submitResult.recordHash?.slice(0, 16)}...
            </div>
            <button
              onClick={resetForm}
              className="w-full h-14 rounded-lg text-base font-semibold transition-colors"
              style={{ backgroundColor: "#159640", color: "#ffffff" }}
            >
              Scan Next Unit
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main tablet view ───
  return (
    <div
      className={cn("min-h-screen transition-colors duration-300")}
      style={{
        backgroundColor: scanState === "SCANNED"
          ? evaluations.anyCTQFail ? "#fef2f2" : evaluations.anyFail ? "#fffbeb" : "#ffffff"
          : "#f9fafb",
      }}
    >
      {/* Header bar */}
      <div className="sticky top-0 z-10 border-b" style={{ borderColor: "#e5e7eb", backgroundColor: "#083260" }}>
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="text-white">
              <div className="text-xs uppercase tracking-wider opacity-70">Stage</div>
              <div className="text-xl font-semibold">S01 - Rolling & Forming</div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-white">
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider opacity-70">Operator</div>
              <div className="text-sm font-medium">Ravi Kamble · Shift A</div>
            </div>
            <div className="w-px h-8" style={{ backgroundColor: "rgba(255,255,255,0.2)" }} />
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider opacity-70">SOP</div>
              <div className="text-sm font-mono">QCI/F/02/01 Rev.05</div>
            </div>
          </div>
        </div>
      </div>

      {/* Barcode scan section */}
      {scanState !== "SCANNED" && (
        <div className="flex flex-col items-center justify-center py-24 px-6">
          <div className="max-w-md w-full text-center">
            <ScanLine
              size={64}
              className="mx-auto mb-6"
              style={{ color: scanState === "SCANNING" ? "#083260" : "#9ca3af" }}
            />
            <h2 className="text-2xl font-semibold mb-2" style={{ color: "#111827" }}>
              {scanState === "SCANNING" ? "Scanning..." : "Scan HTU Barcode"}
            </h2>
            <p className="text-sm mb-8" style={{ color: "#6b7280" }}>
              {scanState === "SCANNING"
                ? "Hold the scanner steady over the laser-etched code."
                : "Point the barcode scanner at the HTU serial number to begin inspection."}
            </p>
            {scanState === "SCANNING" && (
              <Loader2 size={32} className="mx-auto animate-spin" style={{ color: "#083260" }} />
            )}
            {scanState === "WAITING" && (
              <button
                onClick={simulateScan}
                className="h-16 px-8 rounded-lg text-lg font-semibold transition-colors"
                style={{ backgroundColor: "#083260", color: "#ffffff" }}
              >
                Simulate Scan
              </button>
            )}
          </div>
        </div>
      )}

      {/* Inspection checklist */}
      {scanState === "SCANNED" && (
        <div className="max-w-4xl mx-auto p-6">
          {/* Scanned info bar */}
          <div className="rounded-lg p-4 mb-6 flex items-center justify-between" style={{ backgroundColor: "#f0f9ff", border: "1px solid #bae6fd" }}>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#083260" }}>
                <ScanLine size={20} className="text-white" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider" style={{ color: "#0369a1" }}>HTU Serial</div>
                <div className="text-lg font-mono font-bold" style={{ color: "#0c4a6e" }}>{htuSerialNo}</div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div>
                <div className="text-xs uppercase tracking-wider" style={{ color: "#0369a1" }}>Work Order</div>
                <div className="text-sm font-mono font-bold" style={{ color: "#0c4a6e" }}>{workOrderNo}</div>
              </div>
              <button
                onClick={resetForm}
                className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm transition-colors"
                style={{ border: "1px solid #bae6fd", color: "#0369a1" }}
              >
                <RefreshCw size={14} /> Rescan
              </button>
            </div>
          </div>

          {/* Characteristics */}
          <div className="space-y-3">
            {S01_CHARACTERISTICS.map(char => {
              const m = measurements[char.charCode];
              const evalStatus = evaluations.evals[char.charCode];
              const isPopulated = evalStatus !== "INDETERMINATE";

              return (
                <div
                  key={char.charCode}
                  className={cn("rounded-lg p-4 transition-colors")}
                  style={{
                    border: `2px solid ${
                      evalStatus === "FAIL" ? "#dc2626" :
                      evalStatus === "PASS" ? "#159640" :
                      "#e5e7eb"
                    }`,
                    backgroundColor: evalStatus === "FAIL" ? "#fef2f2" : evalStatus === "PASS" ? "#f0fdf4" : "#ffffff",
                  }}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    {/* Left: label + spec */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono" style={{ color: "#6b7280" }}>{char.displayOrder}</span>
                        <h3 className="text-base font-semibold" style={{ color: "#111827" }}>{char.charName}</h3>
                        {char.isCTQ && (
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded"
                            style={{ backgroundColor: "#083260", color: "#ffffff" }}
                          >
                            CTQ
                          </span>
                        )}
                      </div>
                      <div className="text-sm flex items-center gap-3" style={{ color: "#6b7280" }}>
                        {char.lowerSpecLimit !== null && char.lowerSpecLimit !== undefined && (
                          <span>LSL: {char.inclusiveLower ? "≥" : ">"} {char.lowerSpecLimit} {char.engineeringUnit}</span>
                        )}
                        {char.upperSpecLimit !== null && char.upperSpecLimit !== undefined && (
                          <span>USL: {char.inclusiveUpper ? "≤" : "<"} {char.upperSpecLimit} {char.engineeringUnit}</span>
                        )}
                        {char.method && <span>· {char.method}</span>}
                      </div>
                    </div>
                    {/* Right: status indicator */}
                    <div className="shrink-0">
                      {evalStatus === "PASS" && (
                        <div className="flex items-center gap-1.5" style={{ color: "#159640" }}>
                          <CheckCircle2 size={24} />
                          <span className="text-sm font-semibold">PASS</span>
                        </div>
                      )}
                      {evalStatus === "FAIL" && (
                        <div className="flex items-center gap-1.5" style={{ color: "#dc2626" }}>
                          <XCircle size={24} />
                          <span className="text-sm font-semibold">FAIL</span>
                        </div>
                      )}
                      {evalStatus === "INDETERMINATE" && isPopulated === false && (
                        <div className="flex items-center gap-1.5" style={{ color: "#d97706" }}>
                          <AlertTriangle size={20} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Input field */}
                  <div className="flex items-center gap-3">
                    {char.dataType === "NUMERIC_BOUNDED" || char.dataType === "NUMERIC_MIN" || char.dataType === "NUMERIC_MAX" ? (
                      <>
                        <input
                          type="number"
                          step="0.01"
                          inputMode="decimal"
                          placeholder="Enter measured value"
                          value={m?.numericValue ?? ""}
                          onChange={(e) => {
                            const val = e.target.value === "" ? undefined : parseFloat(e.target.value);
                            setMeasurements(prev => ({
                              ...prev,
                              [char.charCode]: { ...prev[char.charCode], numericValue: val, captureSource: "MANUAL_INPUT" },
                            }));
                          }}
                          className="flex-1 h-14 px-4 rounded-lg text-lg font-mono outline-none transition-colors"
                          style={{
                            border: `2px solid ${evalStatus === "FAIL" ? "#dc2626" : evalStatus === "PASS" ? "#159640" : "#d1d5db"}`,
                            backgroundColor: "#f9fafb",
                            color: "#111827",
                          }}
                        />
                        {char.engineeringUnit && (
                          <span className="text-sm font-semibold" style={{ color: "#6b7280" }}>{char.engineeringUnit}</span>
                        )}
                      </>
                    ) : char.dataType === "BOOLEAN_PASS" ? (
                      <div className="flex gap-3 flex-1">
                        <button
                          onClick={() => setMeasurements(prev => ({
                            ...prev,
                            [char.charCode]: { booleanObservation: true, captureSource: "MANUAL_INPUT" },
                          }))}
                          className="flex-1 h-14 rounded-lg text-base font-semibold transition-colors flex items-center justify-center gap-2"
                          style={{
                            backgroundColor: m?.booleanObservation === true ? "#159640" : "#f3f4f6",
                            color: m?.booleanObservation === true ? "#ffffff" : "#6b7280",
                            border: `2px solid ${m?.booleanObservation === true ? "#159640" : "#d1d5db"}`,
                          }}
                        >
                          <CheckCircle2 size={20} /> OK
                        </button>
                        <button
                          onClick={() => setMeasurements(prev => ({
                            ...prev,
                            [char.charCode]: { booleanObservation: false, textObservation: "", captureSource: "MANUAL_INPUT" },
                          }))}
                          className="flex-1 h-14 rounded-lg text-base font-semibold transition-colors flex items-center justify-center gap-2"
                          style={{
                            backgroundColor: m?.booleanObservation === false ? "#dc2626" : "#f3f4f6",
                            color: m?.booleanObservation === false ? "#ffffff" : "#6b7280",
                            border: `2px solid ${m?.booleanObservation === false ? "#dc2626" : "#d1d5db"}`,
                          }}
                        >
                          <XCircle size={20} /> Not OK
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {/* Instant failure message */}
                  {evalStatus === "FAIL" && m?.numericValue !== undefined && (
                    <div className="mt-2 text-sm" style={{ color: "#dc2626" }}>
                      ⚠ Out of specification: {m.numericValue} {char.engineeringUnit} is outside the acceptance range.
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Submit bar */}
          <div className="sticky bottom-0 mt-6 -mx-6 px-6 py-4 border-t" style={{ borderColor: "#e5e7eb", backgroundColor: "#ffffff" }}>
            <div className="flex items-center justify-between gap-4">
              {/* Summary */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#159640" }} />
                  <span className="text-sm" style={{ color: "#374151" }}>
                    {Object.values(evaluations.evals).filter(s => s === "PASS").length} Pass
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#dc2626" }} />
                  <span className="text-sm" style={{ color: "#374151" }}>
                    {Object.values(evaluations.evals).filter(s => s === "FAIL").length} Fail
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#d97706" }} />
                  <span className="text-sm" style={{ color: "#374151" }}>
                    {Object.values(evaluations.evals).filter(s => s === "INDETERMINATE").length} Pending
                  </span>
                </div>
              </div>

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || submitState === "SUBMITTING"}
                className={cn("h-16 px-12 rounded-lg text-lg font-bold transition-all flex items-center gap-3")}
                style={{
                  backgroundColor: canSubmit
                    ? evaluations.anyCTQFail ? "#dc2626" : evaluations.anyFail ? "#d97706" : "#159640"
                    : "#e5e7eb",
                  color: canSubmit ? "#ffffff" : "#9ca3af",
                  cursor: canSubmit ? "pointer" : "not-allowed",
                }}
              >
                {submitState === "SUBMITTING" ? (
                  <>
                    <Loader2 size={24} className="animate-spin" /> Evaluating...
                  </>
                ) : evaluations.anyCTQFail ? (
                  <>
                    <Lock size={24} /> Submit CTQ Failure
                  </>
                ) : evaluations.anyFail ? (
                  <>
                    <AlertTriangle size={24} /> Submit with Failures
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={24} /> Submit Inspection
                  </>
                )}
              </button>
            </div>

            {/* Poka-Yoke message */}
            {!canSubmit && submitState === "IDLE" && (
              <div className="text-center mt-2 text-sm" style={{ color: "#6b7280" }}>
                {scanState !== "SCANNED"
                  ? "Scan a barcode to begin."
                  : !evaluations.allPopulated
                    ? "All characteristics must be measured before submission."
                    : ""}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
