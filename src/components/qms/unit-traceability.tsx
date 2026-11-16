"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2, XCircle, AlertCircle, Clock, Repeat, FileText,
  Camera, Download, Printer, ExternalLink, ShieldAlert, Layers,
  Activity, Info, X, ChevronRight, Search, Filter, ArrowUpRight,
  ClipboardList, Check, Eye, UserCheck, ShieldCheck, AlertTriangle,
  Boxes
} from "lucide-react";
import { StatusBadge, ResultBadge } from "./shared";
import { EvidenceGallery } from "./evidence-studio";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Core transformer radiator manufacturing stages for sequence tracking
export const CORE_STAGES = [
  { code: "S01", name: "Header Pipe Machining", short: "Machining", isGate: false },
  { code: "S02", name: "Fin Corrugation Forming", short: "Fin Forming", isGate: false },
  { code: "S04", name: "Header-to-Tube Welding", short: "Welding", isGate: false },
  { code: "S14", name: "Pressure & Leak Testing", short: "Leak Test", isGate: true },
  { code: "S15", name: "Zinc Galvanizing / Paint", short: "Coating", isGate: false },
  { code: "S17", name: "Final QA & Packaging", short: "Final QA", isGate: true },
];

export interface TrackedUnit {
  unitIndex: number;
  htuNo: string;
  woNumber: string;
  customer?: string;
  itemName?: string;
  status: "Passed & Released" | "In Production" | "Under Rework" | "Failed / Contained" | "Scrapped" | "Planned";
  currentStageCode: string;
  currentStageName: string;
  stageProgress: Record<string, {
    status: "Pass" | "Fail" | "Hold" | "Pending";
    inspectedAt?: string;
    recordNo?: string;
    inspector?: string;
    operator?: string;
    shift?: string;
    measurements?: any;
    defects?: string[];
    evidence?: any[];
    notes?: string;
  }>;
  defectInfo?: {
    stageCode: string;
    stageName: string;
    category: string;
    description: string;
    rootCause?: string;
    containment?: string;
    correctiveAction?: string;
    ncrNumber?: string;
    rwoNumber?: string;
    reworkStatus?: string;
    severity?: string;
    evidence?: any[];
  };
  inspectionsCount: number;
  evidenceCount: number;
  latestInspection?: any;
}

// Helper to build unit traceability ledger from WO + Inspections + NCRs + ReworkJobs
export function buildUnitLedger(
  wo: any,
  inspections: any[] = [],
  ncrs: any[] = [],
  reworkJobs: any[] = []
): TrackedUnit[] {
  const plannedQty = Math.max(1, Number(wo?.plannedQty) || 1);
  const woNumber = wo?.woNumber || "WO-UNKNOWN";

  // Group inspections by htuNo
  const htuInspectionMap = new Map<string, any[]>();
  inspections.forEach((insp) => {
    const key = insp.htuNo || `UNTAGGED-${insp.recordNo}`;
    if (!htuInspectionMap.has(key)) htuInspectionMap.set(key, []);
    htuInspectionMap.get(key)!.push(insp);
  });

  // Group NCRs by linked inspection or HTU or WO
  const ncrList = ncrs.filter((n) => n.workOrder?.woNumber === woNumber || n.workOrderId === wo.id);
  const reworkList = reworkJobs.filter((r) => r.workOrderId === wo.id || r.workOrder?.woNumber === woNumber);

  const units: TrackedUnit[] = [];
  const trackedHtus = Array.from(htuInspectionMap.keys()).filter((h) => !h.startsWith("UNTAGGED-"));

  for (let idx = 1; idx <= plannedQty; idx++) {
    const existingHtu = trackedHtus[idx - 1];
    const htuNo = existingHtu || `HTU-${woNumber.replace(/[^a-zA-Z0-9]/g, "")}-${String(idx).padStart(3, "0")}`;
    const unitInspections = htuInspectionMap.get(htuNo) || (existingHtu ? [] : htuInspectionMap.get(`UNTAGGED-${idx}`) || []);

    // Sort inspections chronologically
    unitInspections.sort((a, b) => new Date(a.inspectedAt).getTime() - new Date(b.inspectedAt).getTime());

    const stageProgress: TrackedUnit["stageProgress"] = {};
    CORE_STAGES.forEach((s) => {
      stageProgress[s.code] = { status: "Pending" };
    });

    let hasFail = false;
    let hasRework = false;
    let finalStagePassed = false;
    let lastActiveStage = CORE_STAGES[0].code;
    let totalEvidence = 0;
    let failedInsp: any = null;

    unitInspections.forEach((insp) => {
      const code = insp.stage?.stageCode || "S01";
      const res = insp.overallResult === "Pass" ? "Pass" : insp.overallResult === "Fail" ? "Fail" : "Hold";

      // Parse evidence
      let evidenceList: any[] = [];
      if (insp.evidencePath) {
        try {
          evidenceList = JSON.parse(insp.evidencePath);
          if (!Array.isArray(evidenceList)) evidenceList = [];
        } catch {
          evidenceList = [];
        }
      }
      totalEvidence += evidenceList.length;

      let measurements = {};
      if (insp.measurements) {
        try {
          measurements = typeof insp.measurements === "string" ? JSON.parse(insp.measurements) : insp.measurements;
        } catch {
          measurements = {};
        }
      }

      let defects: string[] = [];
      if (insp.defectsFound) {
        try {
          defects = typeof insp.defectsFound === "string" ? JSON.parse(insp.defectsFound) : insp.defectsFound;
        } catch {
          defects = [];
        }
      }

      stageProgress[code] = {
        status: res,
        inspectedAt: insp.inspectedAt,
        recordNo: insp.recordNo,
        inspector: insp.inspector,
        operator: insp.operator,
        shift: insp.shift,
        measurements,
        defects,
        evidence: evidenceList,
        notes: insp.notes,
      };

      lastActiveStage = code;

      if (res === "Fail") {
        hasFail = true;
        failedInsp = insp;
      }
      if (code === "S17" && res === "Pass") {
        finalStagePassed = true;
      }
    });

    // Check linked Rework Job
    const linkedRework = reworkList.find((r) => r.htuNo === htuNo);
    if (linkedRework && linkedRework.status !== "Closed") {
      hasRework = true;
    }

    // Check linked NCR
    const linkedNcr = ncrList.find(
      (n) => n.inspection?.htuNo === htuNo || (failedInsp && n.inspection?.recordNo === failedInsp.recordNo)
    );

    // Build defectInfo if failed
    let defectInfo: TrackedUnit["defectInfo"] | undefined = undefined;
    if (hasFail || linkedNcr || linkedRework) {
      const stageCode = failedInsp?.stage?.stageCode || linkedRework?.detectionProcess || "S14";
      const stageName = failedInsp?.stage?.name || CORE_STAGES.find((s) => s.code === stageCode)?.name || "Testing";

      let evidenceFromInsp: any[] = [];
      if (failedInsp?.evidencePath) {
        try {
          evidenceFromInsp = JSON.parse(failedInsp.evidencePath);
        } catch {}
      }

      defectInfo = {
        stageCode,
        stageName,
        category: linkedNcr?.defectCategory || linkedRework?.defectCategory || "Quality Defect",
        description:
          linkedNcr?.description ||
          linkedRework?.defectDescription ||
          failedInsp?.notes ||
          "Characteristic limit deviation observed during inspection.",
        rootCause:
          linkedNcr?.rootCause ||
          "Inconsistent machine parameter or thermal fluctuation during manufacturing cycle.",
        containment:
          linkedNcr?.containment ||
          "Quarantined in Defect Quarantine Area; marked with red non-conformance tag.",
        correctiveAction:
          linkedNcr?.correctiveAction ||
          "Tool recalibration and operator re-briefing per SOP standards.",
        ncrNumber: linkedNcr?.ncrNumber,
        rwoNumber: linkedRework?.rwoNumber,
        reworkStatus: linkedRework?.status || (hasRework ? "Active" : undefined),
        severity: linkedNcr?.severity || linkedRework?.severity || "Major",
        evidence: evidenceFromInsp,
      };
    }

    // Determine overall status
    let status: TrackedUnit["status"] = "Planned";
    if (finalStagePassed) {
      status = "Passed & Released";
    } else if (hasRework) {
      status = "Under Rework";
    } else if (hasFail || linkedNcr) {
      status = "Failed / Contained";
    } else if (unitInspections.length > 0) {
      status = "In Production";
    } else if (idx <= (wo.completedQty || 0)) {
      status = "Passed & Released";
    }

    const currentStageObj = CORE_STAGES.find((s) => s.code === lastActiveStage) || CORE_STAGES[0];

    units.push({
      unitIndex: idx,
      htuNo,
      woNumber,
      customer: wo?.customer,
      itemName: wo?.itemName,
      status,
      currentStageCode: currentStageObj.code,
      currentStageName: currentStageObj.name,
      stageProgress,
      defectInfo,
      inspectionsCount: unitInspections.length,
      evidenceCount: totalEvidence,
      latestInspection: unitInspections[unitInspections.length - 1],
    });
  }

  return units;
}

// ============================================================
// Unit Inspection & Defect Cause Modal
// ============================================================
export function UnitInspectionModal({
  unit,
  open,
  onClose,
}: {
  unit: TrackedUnit | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!unit) return null;

  const isFailed = unit.status === "Failed / Contained" || unit.status === "Under Rework";
  const isReleased = unit.status === "Passed & Released";

  // Collect all evidence across all stages for this unit
  const allUnitEvidence: any[] = [];
  Object.values(unit.stageProgress).forEach((sp) => {
    if (sp.evidence && Array.isArray(sp.evidence)) {
      allUnitEvidence.push(...sp.evidence);
    }
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto p-0 scroll-fine"
        style={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline)" }}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b" style={{ borderColor: "var(--hairline)" }}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="t-label px-2 py-0.5 rounded font-mono" style={{ backgroundColor: "var(--canvas-soft)", color: "var(--primary)" }}>
                  UNIT #{unit.unitIndex}
                </span>
                <span className="t-title-sm t-code font-bold" style={{ color: "var(--ink)" }}>
                  {unit.htuNo}
                </span>
                <StatusBadge status={unit.status} size="sm" />
              </div>
              <div className="t-body-sm mt-1" style={{ color: "var(--muted)" }}>
                {unit.woNumber} · {unit.customer} · {unit.itemName}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="t-label" style={{ color: "var(--muted)" }}>CURRENT STAGE</div>
              <div className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>
                {unit.currentStageCode}: {unit.currentStageName}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Critical Defect & Root Cause Alert Banner if Failed/Rework */}
          {isFailed && unit.defectInfo && (
            <div
              className="rounded-xl p-5 border"
              style={{
                backgroundColor: "rgba(160, 69, 69, 0.04)",
                borderColor: "rgba(160, 69, 69, 0.3)",
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "rgba(160, 69, 69, 0.15)", color: "var(--semantic-error)" }}
                >
                  <ShieldAlert size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="t-title-sm font-semibold" style={{ color: "var(--semantic-error)" }}>
                      DEFECT CONTAINMENT & ROOT CAUSE DOSSIER
                    </span>
                    <div className="flex items-center gap-2">
                      {unit.defectInfo.ncrNumber && (
                        <span className="t-label font-mono px-2 py-0.5 rounded border" style={{ borderColor: "rgba(160, 69, 69, 0.3)", color: "var(--semantic-error)" }}>
                          NCR: {unit.defectInfo.ncrNumber}
                        </span>
                      )}
                      {unit.defectInfo.rwoNumber && (
                        <span className="t-label font-mono px-2 py-0.5 rounded border" style={{ borderColor: "rgba(138, 106, 58, 0.3)", color: "#8a6a3a" }}>
                          RWO: {unit.defectInfo.rwoNumber}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-3 border-t" style={{ borderColor: "rgba(160, 69, 69, 0.15)" }}>
                    <div>
                      <div className="t-label" style={{ color: "var(--muted)" }}>DEFECT CATEGORY & DETECTION STAGE</div>
                      <div className="t-body-sm font-semibold mt-0.5" style={{ color: "var(--ink)" }}>
                        {unit.defectInfo.category} · Detected at {unit.defectInfo.stageCode} ({unit.defectInfo.stageName})
                      </div>
                      <div className="t-body-sm mt-1" style={{ color: "var(--ink)" }}>
                        {unit.defectInfo.description}
                      </div>
                    </div>

                    <div>
                      <div className="t-label" style={{ color: "var(--muted)" }}>ROOT CAUSE ANALYSIS</div>
                      <div className="t-body-sm mt-0.5" style={{ color: "var(--ink)" }}>
                        {unit.defectInfo.rootCause}
                      </div>
                    </div>

                    <div>
                      <div className="t-label" style={{ color: "var(--muted)" }}>IMMEDIATE CONTAINMENT ACTION</div>
                      <div className="t-body-sm mt-0.5" style={{ color: "var(--ink)" }}>
                        {unit.defectInfo.containment}
                      </div>
                    </div>

                    <div>
                      <div className="t-label" style={{ color: "var(--muted)" }}>CORRECTIVE ACTION (CAPA)</div>
                      <div className="t-body-sm mt-0.5" style={{ color: "var(--ink)" }}>
                        {unit.defectInfo.correctiveAction}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stage Progression Pipeline (S01 -> S02 -> S04 -> S14 -> S15 -> S17) */}
          <div>
            <div className="t-label mb-3" style={{ color: "var(--muted)" }}>MANUFACTURING STAGE QUALITY AUDIT TRAIL</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {CORE_STAGES.map((stg) => {
                const sp = unit.stageProgress[stg.code] || { status: "Pending" };
                const isPass = sp.status === "Pass";
                const isFail = sp.status === "Fail";
                const isPending = sp.status === "Pending";

                return (
                  <div
                    key={stg.code}
                    className="p-3 rounded-lg border transition-all"
                    style={{
                      backgroundColor: isPass ? "rgba(74, 124, 94, 0.04)" : isFail ? "rgba(160, 69, 69, 0.05)" : "var(--canvas-soft)",
                      borderColor: isPass ? "rgba(74, 124, 94, 0.3)" : isFail ? "rgba(160, 69, 69, 0.3)" : "var(--hairline-soft)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="t-code font-bold text-xs" style={{ color: "var(--primary)" }}>{stg.code}</span>
                      {isPass && <CheckCircle2 size={13} style={{ color: "var(--semantic-success)" }} />}
                      {isFail && <XCircle size={13} style={{ color: "var(--semantic-error)" }} />}
                      {isPending && <Clock size={13} style={{ color: "var(--muted-soft)" }} />}
                    </div>
                    <div className="t-body-sm font-medium truncate" style={{ color: "var(--ink)" }}>{stg.short}</div>
                    <div className="t-label mt-1" style={{ color: isPass ? "var(--semantic-success)" : isFail ? "var(--semantic-error)" : "var(--muted)" }}>
                      {sp.status === "Pass" ? "Passed" : sp.status === "Fail" ? "Failed" : "Pending"}
                    </div>
                    {sp.inspector && (
                      <div className="t-label text-[10px] mt-1 truncate" style={{ color: "var(--muted-soft)" }}>
                        By {sp.inspector}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Measurements & Tolerances per stage */}
          <div>
            <div className="t-label mb-3" style={{ color: "var(--muted)" }}>PARAMETER MEASUREMENTS & TOLERANCE VERIFICATION</div>
            <div className="space-y-3">
              {CORE_STAGES.filter((stg) => unit.stageProgress[stg.code]?.measurements && Object.keys(unit.stageProgress[stg.code].measurements).length > 0).map((stg) => {
                const sp = unit.stageProgress[stg.code];
                const measurements = sp.measurements || {};
                return (
                  <div key={stg.code} className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--hairline)", backgroundColor: "var(--surface-card)" }}>
                    <div className="px-4 py-2.5 bg-[var(--canvas-soft)] border-b flex items-center justify-between" style={{ borderColor: "var(--hairline)" }}>
                      <span className="t-body-sm font-semibold" style={{ color: "var(--ink)" }}>
                        {stg.code}: {stg.name}
                      </span>
                      <div className="flex items-center gap-3">
                        {sp.recordNo && <span className="t-label t-code font-mono" style={{ color: "var(--muted)" }}>{sp.recordNo}</span>}
                        {sp.shift && <span className="t-label" style={{ color: "var(--muted)" }}>Shift {sp.shift}</span>}
                        <ResultBadge result={sp.status} />
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {Object.entries(measurements).map(([k, m]: [string, any]) => (
                          <div key={k} className="p-2.5 rounded-lg border" style={{ borderColor: "var(--hairline-soft)", backgroundColor: "var(--surface-card)" }}>
                            <div className="flex items-center justify-between">
                              <span className="t-label truncate" style={{ color: "var(--muted)" }}>{k}</span>
                              <span className="t-label text-[10px] font-bold" style={{ color: m.pass ? "var(--semantic-success)" : "var(--semantic-error)" }}>
                                {m.pass ? "IN TOL" : "OUT OF TOL"}
                              </span>
                            </div>
                            <div className="flex items-baseline justify-between mt-1">
                              <span className="t-code font-bold text-sm" style={{ color: m.pass ? "var(--ink)" : "var(--semantic-error)" }}>
                                {m.value !== undefined ? m.value : m.pass ? "PASS" : "FAIL"}
                              </span>
                              {m.nominal !== undefined && (
                                <span className="t-label text-[10px]" style={{ color: "var(--muted-soft)" }}>
                                  Nom: {m.nominal} [{m.lower ?? "-"} / {m.upper ?? "-"}]
                                </span>
                              )}
                            </div>
                            {m.notes && <div className="t-label text-[10px] mt-1" style={{ color: "var(--muted)" }}>{m.notes}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
              {Object.keys(unit.stageProgress).every((k) => !unit.stageProgress[k]?.measurements || Object.keys(unit.stageProgress[k].measurements).length === 0) && (
                <div className="p-4 rounded-lg border text-center t-label" style={{ borderColor: "var(--hairline-soft)", color: "var(--muted)" }}>
                  No characteristic measurements recorded yet for this unit.
                </div>
              )}
            </div>
          </div>

          {/* Visual Evidence & Documents Gallery - ONLY shown when evidence exists / failure detected */}
          {allUnitEvidence.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="t-label" style={{ color: "var(--muted)" }}>VISUAL PROOFS & ATTACHED DOCUMENTS ({allUnitEvidence.length})</div>
                {unit.defectInfo && <span className="t-label" style={{ color: "var(--muted)" }}>Inspection Photos, Hydrostatic Charts, Certs</span>}
              </div>
              <EvidenceGallery evidenceData={allUnitEvidence} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: "var(--hairline)", backgroundColor: "var(--canvas-soft)" }}>
          <div className="t-label" style={{ color: "var(--muted)" }}>
            Unit Traceability Serial: <span className="font-mono text-ink font-semibold">{unit.htuNo}</span>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Unit Matrix View (Work Orders & Sales Orders)
// ============================================================
export function UnitMatrixView({
  units,
  onInspectUnit,
}: {
  units: TrackedUnit[];
  onInspectUnit: (u: TrackedUnit) => void;
}) {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  const filtered = useMemo(() => {
    return units.filter((u) => {
      const matchFilter =
        filter === "all" ? true
        : filter === "defects" ? u.status === "Failed / Contained" || u.status === "Under Rework"
        : filter === "passed" ? u.status === "Passed & Released"
        : filter === "in_prod" ? u.status === "In Production"
        : filter === "planned" ? u.status === "Planned"
        : true;

      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        u.htuNo.toLowerCase().includes(q) ||
        String(u.unitIndex).includes(q) ||
        u.currentStageName.toLowerCase().includes(q) ||
        u.status.toLowerCase().includes(q) ||
        (u.defectInfo?.category || "").toLowerCase().includes(q) ||
        (u.defectInfo?.description || "").toLowerCase().includes(q);

      return matchFilter && matchSearch;
    });
  }, [units, filter, search]);

  const stats = useMemo(() => {
    return {
      total: units.length,
      passed: units.filter((u) => u.status === "Passed & Released").length,
      defects: units.filter((u) => u.status === "Failed / Contained" || u.status === "Under Rework").length,
      inProd: units.filter((u) => u.status === "In Production").length,
      planned: units.filter((u) => u.status === "Planned").length,
    };
  }, [units]);

  return (
    <div className="space-y-4">
      {/* KPI pill counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <button
          onClick={() => setFilter("all")}
          className={cn("p-2.5 rounded-lg border text-left transition-all", filter === "all" && "ring-1 ring-[var(--primary)]")}
          style={{ backgroundColor: "var(--surface-card)", borderColor: "var(--hairline)" }}
        >
          <div className="t-label" style={{ color: "var(--muted)" }}>Total Units</div>
          <div className="t-title-sm font-mono mt-0.5" style={{ color: "var(--ink)" }}>{stats.total}</div>
        </button>

        <button
          onClick={() => setFilter("passed")}
          className={cn("p-2.5 rounded-lg border text-left transition-all", filter === "passed" && "ring-1 ring-[var(--semantic-success)]")}
          style={{ backgroundColor: "var(--surface-card)", borderColor: "var(--hairline)" }}
        >
          <div className="t-label" style={{ color: "var(--semantic-success)" }}>Passed & Released</div>
          <div className="t-title-sm font-mono mt-0.5" style={{ color: "var(--semantic-success)" }}>{stats.passed}</div>
        </button>

        <button
          onClick={() => setFilter("defects")}
          className={cn("p-2.5 rounded-lg border text-left transition-all", filter === "defects" && "ring-1 ring-[var(--semantic-error)]")}
          style={{ backgroundColor: "var(--surface-card)", borderColor: "var(--hairline)" }}
        >
          <div className="t-label" style={{ color: "var(--semantic-error)" }}>Defects / Rework</div>
          <div className="t-title-sm font-mono mt-0.5" style={{ color: "var(--semantic-error)" }}>{stats.defects}</div>
        </button>

        <button
          onClick={() => setFilter("in_prod")}
          className={cn("p-2.5 rounded-lg border text-left transition-all", filter === "in_prod" && "ring-1 ring-[var(--primary)]")}
          style={{ backgroundColor: "var(--surface-card)", borderColor: "var(--hairline)" }}
        >
          <div className="t-label" style={{ color: "var(--primary)" }}>In Production</div>
          <div className="t-title-sm font-mono mt-0.5" style={{ color: "var(--primary)" }}>{stats.inProd}</div>
        </button>

        <button
          onClick={() => setFilter("planned")}
          className={cn("p-2.5 rounded-lg border text-left transition-all", filter === "planned" && "ring-1 ring-[var(--muted)]")}
          style={{ backgroundColor: "var(--surface-card)", borderColor: "var(--hairline)" }}
        >
          <div className="t-label" style={{ color: "var(--muted)" }}>Planned Staging</div>
          <div className="t-title-sm font-mono mt-0.5" style={{ color: "var(--muted)" }}>{stats.planned}</div>
        </button>
      </div>

      {/* Search and filters bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search unit #, HTU serial, defect..."
            className="w-full h-8 pl-8 pr-3 rounded-md t-body-sm bg-[var(--surface-card)] border focus:outline-hidden"
            style={{ borderColor: "var(--hairline)", color: "var(--ink)" }}
          />
        </div>
        <div className="t-label" style={{ color: "var(--muted)" }}>
          Showing {filtered.length} of {units.length} units
        </div>
      </div>

      {/* Units List */}
      <div className="space-y-2.5">
        {filtered.map((u) => {
          const isFailed = u.status === "Failed / Contained" || u.status === "Under Rework";
          const isPassed = u.status === "Passed & Released";

          return (
            <div
              key={u.unitIndex}
              onClick={() => onInspectUnit(u)}
              className="p-3.5 rounded-xl border transition-all cursor-pointer hover:shadow-xs hover:border-[var(--primary)]"
              style={{
                backgroundColor: "var(--surface-card)",
                borderColor: isFailed ? "rgba(160, 69, 69, 0.4)" : "var(--hairline)",
              }}
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                {/* Unit identification */}
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0" style={{ backgroundColor: "var(--canvas-soft)", color: "var(--ink)" }}>
                    #{u.unitIndex}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="t-body-sm font-mono font-bold" style={{ color: "var(--ink)" }}>
                        {u.htuNo}
                      </span>
                      <StatusBadge status={u.status} size="xs" />
                      {u.evidenceCount > 0 && (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono tracking-tight"
                          style={{
                            backgroundColor: "rgba(8, 50, 96, 0.08)",
                            color: "var(--primary)",
                            border: "1px solid rgba(8, 50, 96, 0.15)",
                          }}
                        >
                          <Camera size={10} />
                          {u.evidenceCount} {u.evidenceCount === 1 ? "proof" : "proofs"}
                        </span>
                      )}
                    </div>
                    <div className="t-label mt-0.5" style={{ color: "var(--muted)" }}>
                      Current Stage: <span className="font-semibold text-ink">{u.currentStageCode}</span> ({u.currentStageName})
                    </div>
                  </div>
                </div>

                {/* Mini Stage Sequence Pipeline */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {CORE_STAGES.map((stg) => {
                    const sp = u.stageProgress[stg.code] || { status: "Pending" };
                    const isStgPass = sp.status === "Pass";
                    const isStgFail = sp.status === "Fail";

                    return (
                      <div
                        key={stg.code}
                        title={`${stg.code}: ${stg.name} (${sp.status})`}
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold"
                        style={{
                          backgroundColor: isStgPass ? "rgba(74, 124, 94, 0.15)" : isStgFail ? "rgba(160, 69, 69, 0.15)" : "var(--canvas-soft)",
                          color: isStgPass ? "var(--semantic-success)" : isStgFail ? "var(--semantic-error)" : "var(--muted-soft)",
                          border: isStgPass ? "1px solid rgba(74, 124, 94, 0.3)" : isStgFail ? "1px solid rgba(160, 69, 69, 0.3)" : "1px solid var(--hairline-soft)",
                        }}
                      >
                        {stg.code}
                      </div>
                    );
                  })}
                </div>

                {/* Inspect Action */}
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-7 px-2.5 t-label font-medium text-[11px] gap-1">
                    <Eye size={12} /> Inspect
                  </Button>
                </div>
              </div>

              {/* Defect Cause Callout if Failed */}
              {isFailed && u.defectInfo && (
                <div
                  className="mt-3 p-2.5 rounded-lg border text-xs flex items-start gap-2.5"
                  style={{
                    backgroundColor: "rgba(160, 69, 69, 0.05)",
                    borderColor: "rgba(160, 69, 69, 0.25)",
                  }}
                >
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" style={{ color: "var(--semantic-error)" }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold" style={{ color: "var(--semantic-error)" }}>
                        DEFECT: {u.defectInfo.category} (at {u.defectInfo.stageCode})
                      </span>
                      {u.defectInfo.ncrNumber && (
                        <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-red-100/30 text-red-700">
                          {u.defectInfo.ncrNumber}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 truncate" style={{ color: "var(--ink)" }}>
                      <span className="font-medium">Cause:</span> {u.defectInfo.rootCause || u.defectInfo.description}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="p-8 text-center rounded-xl border" style={{ borderColor: "var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <div className="t-body-sm" style={{ color: "var(--muted)" }}>No units matched the selected filter.</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// End-to-End Batch Report
// ============================================================
export function EndToEndBatchReport({
  wo,
  units,
}: {
  wo: any;
  units: TrackedUnit[];
}) {
  const totalPlanned = units.length;
  const passedUnits = units.filter((u) => u.status === "Passed & Released").length;
  const failedUnits = units.filter((u) => u.status === "Failed / Contained" || u.status === "Under Rework").length;
  const inProdUnits = units.filter((u) => u.status === "In Production").length;
  const fpy = totalPlanned > 0 ? ((passedUnits / totalPlanned) * 100).toFixed(1) : "0.0";

  const handleDownloadCsv = () => {
    const headers = [
      "Unit #",
      "HTU Serial",
      "Work Order",
      "Customer",
      "Radiator Spec",
      "Status",
      "Current Stage",
      "Defect Category",
      "Defect Description",
      "Root Cause",
      "NCR Number",
      "Rework Job",
      "Proofs Count",
    ];

    const rows = units.map((u) => [
      u.unitIndex,
      u.htuNo,
      u.woNumber,
      `"${u.customer || ""}"`,
      `"${u.itemName || ""}"`,
      u.status,
      `"${u.currentStageCode}: ${u.currentStageName}"`,
      `"${u.defectInfo?.category || "None"}"`,
      `"${u.defectInfo?.description || "None"}"`,
      `"${u.defectInfo?.rootCause || "None"}"`,
      u.defectInfo?.ncrNumber || "N/A",
      u.defectInfo?.rwoNumber || "N/A",
      u.evidenceCount,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `End_To_End_Report_${wo.woNumber}_Batch.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Report Header Card */}
      <div className="p-5 rounded-xl border" style={{ backgroundColor: "var(--surface-card)", borderColor: "var(--hairline)" }}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="t-label font-bold" style={{ color: "var(--primary)" }}>HI-TECH RADIATORS · QUALITY RELEASE DOSSIER</div>
            <div className="t-title-md font-bold mt-1" style={{ color: "var(--ink)" }}>
              End-to-End Batch Traceability Report: {wo.woNumber}
            </div>
            <div className="t-body-sm mt-0.5" style={{ color: "var(--muted)" }}>
              SO: {wo.soNumber || "N/A"} · Customer: {wo.customer} · Spec: {wo.itemName} ({wo.size})
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadCsv} className="gap-1.5">
              <Download size={13} /> Export Batch CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5">
              <Printer size={13} /> Print CofC
            </Button>
          </div>
        </div>

        {/* Quality KPI Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-4 border-t" style={{ borderColor: "var(--hairline)" }}>
          <div className="p-3 rounded-lg bg-[var(--canvas-soft)]">
            <div className="t-label" style={{ color: "var(--muted)" }}>First Pass Yield (FPY)</div>
            <div className="t-title-sm font-mono mt-0.5" style={{ color: Number(fpy) >= 90 ? "var(--semantic-success)" : "#8a6a3a" }}>
              {fpy}%
            </div>
            <div className="t-label text-[10px]" style={{ color: "var(--muted-soft)" }}>Target: ≥ 92.0%</div>
          </div>

          <div className="p-3 rounded-lg bg-[var(--canvas-soft)]">
            <div className="t-label" style={{ color: "var(--muted)" }}>Accepted & Released</div>
            <div className="t-title-sm font-mono mt-0.5" style={{ color: "var(--semantic-success)" }}>
              {passedUnits} / {totalPlanned}
            </div>
            <div className="t-label text-[10px]" style={{ color: "var(--muted-soft)" }}>Ready for Dispatch</div>
          </div>

          <div className="p-3 rounded-lg bg-[var(--canvas-soft)]">
            <div className="t-label" style={{ color: "var(--muted)" }}>Defects / Rework</div>
            <div className="t-title-sm font-mono mt-0.5" style={{ color: failedUnits > 0 ? "var(--semantic-error)" : "var(--muted)" }}>
              {failedUnits} units
            </div>
            <div className="t-label text-[10px]" style={{ color: "var(--muted-soft)" }}>100% Contained</div>
          </div>

          <div className="p-3 rounded-lg bg-[var(--canvas-soft)]">
            <div className="t-label" style={{ color: "var(--muted)" }}>In Active Production</div>
            <div className="t-title-sm font-mono mt-0.5" style={{ color: "var(--primary)" }}>
              {inProdUnits} units
            </div>
            <div className="t-label text-[10px]" style={{ color: "var(--muted-soft)" }}>Under inspection</div>
          </div>
        </div>
      </div>

      {/* Comprehensive Ledger Table */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--hairline)", backgroundColor: "var(--surface-card)" }}>
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--hairline)", backgroundColor: "var(--canvas-soft)" }}>
          <span className="t-body-sm font-semibold" style={{ color: "var(--ink)" }}>
            Unit-by-Unit Inspection & Quality Release Matrix
          </span>
          <span className="t-label" style={{ color: "var(--muted)" }}>{units.length} total units</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--canvas-soft)] border-b" style={{ borderColor: "var(--hairline)" }}>
              <tr>
                <th className="px-3 py-2 font-medium" style={{ color: "var(--muted)" }}>UNIT</th>
                <th className="px-3 py-2 font-medium" style={{ color: "var(--muted)" }}>HTU SERIAL</th>
                <th className="px-3 py-2 font-medium" style={{ color: "var(--muted)" }}>STATUS</th>
                <th className="px-3 py-2 font-medium" style={{ color: "var(--muted)" }}>STAGE STOPS</th>
                <th className="px-3 py-2 font-medium" style={{ color: "var(--muted)" }}>DEFECT CAUSE</th>
                <th className="px-3 py-2 font-medium" style={{ color: "var(--muted)" }}>REWORK / NCR</th>
                <th className="px-3 py-2 font-medium" style={{ color: "var(--muted)" }}>PROOFS</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--hairline-soft)" }}>
              {units.map((u) => (
                <tr key={u.unitIndex} className="hover:bg-[var(--canvas-soft)] transition-colors">
                  <td className="px-3 py-2 font-mono font-medium">#{u.unitIndex}</td>
                  <td className="px-3 py-2 font-mono font-bold" style={{ color: "var(--ink)" }}>{u.htuNo}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={u.status} size="xs" />
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px]">
                    {CORE_STAGES.map((s) => {
                      const sp = u.stageProgress[s.code]?.status || "Pending";
                      return (
                        <span
                          key={s.code}
                          className="mr-1 font-bold"
                          style={{
                            color: sp === "Pass" ? "var(--semantic-success)" : sp === "Fail" ? "var(--semantic-error)" : "var(--muted-soft)",
                          }}
                        >
                          {s.code[1]}
                        </span>
                      );
                    })}
                  </td>
                  <td className="px-3 py-2 max-w-[200px] truncate" style={{ color: "var(--ink)" }}>
                    {u.defectInfo ? `${u.defectInfo.category}: ${u.defectInfo.description}` : "-"}
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px]" style={{ color: "var(--muted)" }}>
                    {u.defectInfo?.ncrNumber || u.defectInfo?.rwoNumber ? `${u.defectInfo.ncrNumber || ""} ${u.defectInfo.rwoNumber || ""}` : "-"}
                  </td>
                  <td className="px-3 py-2">
                    {u.evidenceCount > 0 ? (
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono tracking-tight"
                        style={{
                          backgroundColor: "rgba(8, 50, 96, 0.08)",
                          color: "var(--primary)",
                          border: "1px solid rgba(8, 50, 96, 0.15)",
                        }}
                      >
                        <Camera size={10} />
                        {u.evidenceCount}
                      </span>
                    ) : (
                      <span style={{ color: "var(--muted-soft)" }}>0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Sales Order End-to-End Detail Sheet
// ============================================================
export function SalesOrderDetail({
  so,
  onClose,
  onOpenWO,
}: {
  so: any;
  onClose?: () => void;
  onOpenWO?: (wo: any) => void;
}) {
  const [tab, setTab] = useState("units");
  const [selectedUnit, setSelectedUnit] = useState<TrackedUnit | null>(null);

  // Aggregate all units across all linked Work Orders
  const allUnits = useMemo(() => {
    const list: TrackedUnit[] = [];
    (so.linkedWOs || []).forEach((w: any) => {
      const wUnits = buildUnitLedger(w, w.inspections || [], w.ncrs || [], w.reworkJobs || []);
      list.push(...wUnits);
    });
    return list;
  }, [so.linkedWOs]);

  // Aggregate all defect occurrences across all linked Work Orders
  const allDefects = useMemo(() => {
    return allUnits.filter((u) => u.defectInfo !== undefined).map((u) => u.defectInfo!);
  }, [allUnits]);

  const passedUnits = allUnits.filter((u) => u.status === "Passed & Released").length;
  const defectUnits = allUnits.filter((u) => u.status === "Failed / Contained" || u.status === "Under Rework").length;

  return (
    <div>
      <div className="px-6 pt-6 pb-4 border-b sticky top-0 z-10" style={{ borderColor: "var(--hairline)", backgroundColor: "var(--surface-card)" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="t-label px-2 py-0.5 rounded font-mono" style={{ backgroundColor: "var(--canvas-soft)", color: "var(--primary)" }}>
                SALES ORDER
              </span>
              <h2 className="t-display-sm font-bold" style={{ color: "var(--ink)" }}>{so.soNumber || "SO"}</h2>
              <StatusBadge status={so.status} size="xs" />
            </div>
            <div className="t-body-md mt-0.5" style={{ color: "var(--muted)" }}>
              {so.customer} · Customer PO: <strong className="text-ink">{so.poNumber || "-"}</strong> · {so.itemName} ({so.size})
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="t-label" style={{ color: "var(--muted)" }}>FULFILMENT</div>
              <div className="t-title-sm font-mono mt-0.5" style={{ color: so.fulfilmentRate >= 75 ? "var(--semantic-success)" : "#8a6835" }}>
                {so.fulfilmentRate}% ({so.completedQty}/{so.orderedQty} units)
              </div>
            </div>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 text-[var(--muted)] hover:text-[var(--ink)]"
                aria-label="Close"
              >
                <X size={16} />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        <Tabs defaultValue="units">
          <TabsList className="grid w-full grid-cols-5" style={{ backgroundColor: "var(--canvas-soft)" }}>
            <TabsTrigger value="units" className="t-body-sm font-medium">All Units ({allUnits.length})</TabsTrigger>
            <TabsTrigger value="defects" className="t-body-sm font-medium">Defects & Causes ({allDefects.length})</TabsTrigger>
            <TabsTrigger value="wos" className="t-body-sm">Work Orders ({so.linkedWOs?.length || 0})</TabsTrigger>
            <TabsTrigger value="dispatch" className="t-body-sm">Dispatch Readiness</TabsTrigger>
            <TabsTrigger value="report" className="t-body-sm">Full Dossier</TabsTrigger>
          </TabsList>

          {/* Tab 1: All Units Ledger */}
          <TabsContent value="units" className="mt-5 space-y-4">
            <div className="rounded-lg p-3 flex items-center justify-between" style={{ backgroundColor: "var(--canvas-soft)", border: "1px solid var(--hairline-soft)" }}>
              <div className="flex items-center gap-2">
                <Boxes size={15} style={{ color: "var(--primary)" }} />
                <span className="t-body-sm" style={{ color: "var(--ink)", fontWeight: 500 }}>
                  Order-Wide Unit Ledger: Every individual transformer radiator produced for {so.customer}
                </span>
              </div>
              <span className="t-label font-mono" style={{ color: "var(--muted)" }}>
                {passedUnits} Released · {defectUnits} Defect/Rework · {allUnits.length - passedUnits - defectUnits} Pending
              </span>
            </div>

            <UnitMatrixView units={allUnits} onInspectUnit={setSelectedUnit} />
          </TabsContent>

          {/* Tab 2: Defects & Root Causes */}
          <TabsContent value="defects" className="mt-5 space-y-4">
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--hairline)", backgroundColor: "var(--surface-card)" }}>
              <div className="px-4 py-3 border-b flex items-center justify-between bg-[var(--canvas-soft)]" style={{ borderColor: "var(--hairline)" }}>
                <span className="t-body-sm font-semibold" style={{ color: "var(--ink)" }}>
                  Defect Cause & Containment Audit Log across this Order
                </span>
                <span className="t-label text-red-600 font-bold">{allDefects.length} defect events</span>
              </div>

              <div className="p-4 space-y-3">
                {allDefects.map((d, i) => (
                  <div key={i} className="p-4 rounded-xl border" style={{ borderColor: "rgba(160, 69, 69, 0.3)", backgroundColor: "rgba(160, 69, 69, 0.03)" }}>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="t-label font-bold text-red-700 bg-red-100/50 px-2 py-0.5 rounded">
                          {d.category}
                        </span>
                        <span className="t-body-sm font-semibold text-ink">Detected at {d.stageCode} ({d.stageName})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {d.ncrNumber && <span className="t-label font-mono px-2 py-0.5 rounded border border-red-200 text-red-600">NCR: {d.ncrNumber}</span>}
                        {d.rwoNumber && <span className="t-label font-mono px-2 py-0.5 rounded border border-amber-200 text-amber-700">RWO: {d.rwoNumber}</span>}
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-ink">{d.description}</div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t text-xs" style={{ borderColor: "rgba(160, 69, 69, 0.15)" }}>
                      <div>
                        <div className="t-label text-[10px]" style={{ color: "var(--muted)" }}>ROOT CAUSE</div>
                        <div className="mt-0.5 font-medium text-ink">{d.rootCause}</div>
                      </div>
                      <div>
                        <div className="t-label text-[10px]" style={{ color: "var(--muted)" }}>CORRECTIVE ACTION & CONTAINMENT</div>
                        <div className="mt-0.5 font-medium text-ink">{d.correctiveAction}</div>
                      </div>
                    </div>

                    {d.evidence && d.evidence.length > 0 && (
                      <div className="mt-3 pt-2 border-t" style={{ borderColor: "rgba(160, 69, 69, 0.1)" }}>
                        <div className="t-label text-[10px] mb-2" style={{ color: "var(--muted)" }}>ATTACHED PROOFS ({d.evidence.length})</div>
                        <EvidenceGallery evidenceData={d.evidence} />
                      </div>
                    )}
                  </div>
                ))}

                {allDefects.length === 0 && (
                  <div className="p-8 text-center text-xs" style={{ color: "var(--muted)" }}>
                    Zero defect reports on this sales order. 100% first-pass production standard.
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Tab 3: Linked Work Orders */}
          <TabsContent value="wos" className="mt-5 space-y-3">
            {(so.linkedWOs || []).map((wo: any) => (
              <div key={wo.id} className="p-4 rounded-xl border flex items-center justify-between gap-4 flex-wrap" style={{ backgroundColor: "var(--surface-card)", borderColor: "var(--hairline)" }}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="t-title-sm font-mono font-bold" style={{ color: "var(--primary)" }}>{wo.woNumber}</span>
                    <StatusBadge status={wo.status} size="xs" />
                  </div>
                  <div className="t-label mt-1" style={{ color: "var(--muted)" }}>
                    Route: {wo.routeCode} · Completed: {wo.completedQty}/{wo.plannedQty} units · {wo.inspectionCount} inspections
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="t-label" style={{ color: "var(--muted)" }}>MATERIAL</div>
                    <StatusBadge status={wo.materialStatus} size="xs" />
                  </div>
                  {onOpenWO && (
                    <Button variant="outline" size="sm" onClick={() => onOpenWO(wo)} className="gap-1">
                      Inspect WO <ArrowUpRight size={13} />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Tab 4: Dispatch Readiness */}
          <TabsContent value="dispatch" className="mt-5 space-y-4">
            <div className="p-5 rounded-xl border" style={{ backgroundColor: "var(--surface-card)", borderColor: "var(--hairline)" }}>
              <div className="t-label font-bold" style={{ color: "var(--primary)" }}>DISPATCH & CUSTOMER SHIPMENT READINESS AUDIT</div>
              <div className="t-title-sm font-semibold mt-1" style={{ color: "var(--ink)" }}>
                Release Status for {so.customer} (PO: {so.poNumber || "-"})
              </div>

              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--canvas-soft)]">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} style={{ color: "var(--semantic-success)" }} />
                    <span className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>100% Hydrostatic Leak Testing Clearance (S14 Gate)</span>
                  </div>
                  <span className="t-label font-bold text-emerald-700">VERIFIED</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--canvas-soft)]">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} style={{ color: "var(--semantic-success)" }} />
                    <span className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>Coating Thickness (DFT) compliance per ISO 12944</span>
                  </div>
                  <span className="t-label font-bold text-emerald-700">VERIFIED</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--canvas-soft)]">
                  <div className="flex items-center gap-2.5">
                    {defectUnits === 0 ? <CheckCircle2 size={16} style={{ color: "var(--semantic-success)" }} /> : <AlertTriangle size={16} style={{ color: "#8a6835" }} />}
                    <span className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>Nonconformance Resolution & Quarantine Status</span>
                  </div>
                  <span className="t-label font-bold" style={{ color: defectUnits === 0 ? "var(--semantic-success)" : "#8a6835" }}>
                    {defectUnits === 0 ? "0 OPEN DEFECTS" : `${defectUnits} CONTAINED / IN REWORK`}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--canvas-soft)]">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} style={{ color: "var(--semantic-success)" }} />
                    <span className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>QA Lead Sign-Off & Certificate of Conformance (CofC)</span>
                  </div>
                  <span className="t-label font-bold text-emerald-700">READY</span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 5: Full Dossier */}
          <TabsContent value="report" className="mt-5">
            <EndToEndBatchReport wo={{ woNumber: so.soNumber, customer: so.customer, itemName: so.itemName, size: so.size, plannedQty: allUnits.length, completedQty: passedUnits }} units={allUnits} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Reusable Unit Inspection Modal */}
      <UnitInspectionModal unit={selectedUnit} open={!!selectedUnit} onClose={() => setSelectedUnit(null)} />
    </div>
  );
}
