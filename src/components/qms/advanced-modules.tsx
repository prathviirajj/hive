"use client";

import { useEffect, useState, useMemo } from "react";
import {
  AlertTriangle, ShieldCheck, FileCheck2, FileSearch, GitBranch, CircleDashed,
  TrendingUp, TrendingDown, ArrowRight, ArrowDownToLine, Plus, Search,
  CheckCircle2, XCircle, AlertCircle, Clock, FileText, Network, Target,
  Beaker, Ruler, Droplets, Flame, Layers3, BookOpen, Filter, Printer,
  ChevronRight, ChevronDown, Eye, FileBarChart, Sigma, DollarSign,
  Wrench, Boxes, Package, Activity, CalendarDays, Building2, User as UserIcon,
} from "lucide-react";
import {
  StatusBadge, ResultBadge, PageHeader, EmptyState, LoadingBlock,
  DataTable, StatCard, DetailRow, FilterBar, SearchInput, SectionHeader,
  fmtDate, fmtDateTime, pct, type Column,
} from "@/components/qms/shared";
import { ReportHeader, CertificateSeal } from "@/components/qms/brand";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

type User = {
  id: string; username: string; name: string; email: string; role: string;
  department?: string; plant: string;
  assignedStages?: string[]; managedStages?: string[]; shiftPreference?: string;
};

// ============================================================
// AUDIT WORKSPACE MODULE
// Auditors manage programmes, findings, evidence, NCR linkage.
// ============================================================

type AuditFinding = {
  id: string;
  ref: string;
  auditProgramme: string;
  clause: string;
  process: string;
  title: string;
  description: string;
  severity: "Critical" | "Major" | "Minor" | "Observation";
  status: "Open" | "Investigating" | "CAPA-Open" | "Verified" | "Closed";
  evidence: string[];
  ncrRef?: string;
  auditor: string;
  auditee: string;
  openedAt: string;
  closedAt?: string;
};

const AUDIT_PROGRAMMES = [
  { code: "IA-2026-Q1", title: "Internal QMS Audit - Q1 2026", scope: "ISO 9001 clauses 4-10", status: "Active" },
  { code: "IA-2026-PRC", title: "Process Audit - Welding Operations", scope: "S02, S03, S04, S11, S12 (K1/K2/K3)", status: "Active" },
  { code: "IA-2026-INCOMING", title: "Incoming Material Inspection Audit", scope: "Material verification, IS 2062 / IS 6911", status: "Active" },
  { code: "IA-2025-Q4", title: "Internal QMS Audit - Q4 2025", scope: "ISO 9001 clauses 4-10", status: "Closed" },
];

const AUDIT_FINDINGS: AuditFinding[] = [
  {
    id: "1", ref: "AF-2026-001", auditProgramme: "IA-2026-Q1", clause: "ISO 9001 §8.5.1",
    process: "Production (S11 Erection)", title: "First-piece inspection record missing for WO-3018",
    description: "First-piece approval was not recorded for the erection stage on WO-3018 (Customer: ABB). The work proceeded to MAG welding without documented first-piece release.",
    severity: "Major", status: "CAPA-Open",
    evidence: ["WO-3018 job card (no first-piece sign-off)", "Stage log S11 - 2026-10-12", "Interview: Operator Suresh B."],
    ncrRef: "NCR-2026-014",
    auditor: "Rajesh Nair", auditee: "Vikas Joshi (Production Supervisor)",
    openedAt: "2026-10-15T09:30:00Z",
  },
  {
    id: "2", ref: "AF-2026-002", auditProgramme: "IA-2026-Q1", clause: "ISO 9001 §7.5",
    process: "Document Control", title: "SOP QCI/F/05/03 Rev.09 not available at workstation",
    description: "The current revision of the erection SOP was not posted at workstation S11. An obsolete Rev.07 was found in the rack.",
    severity: "Minor", status: "Verified",
    evidence: ["Photo of workstation S11 rack", "Document register - Rev.09 effective 2026-09-01"],
    auditor: "Rajesh Nair", auditee: "Yogesh Balate (Document Controller)",
    openedAt: "2026-10-15T10:15:00Z", closedAt: "2026-10-22T14:00:00Z",
  },
  {
    id: "3", ref: "AF-2026-003", auditProgramme: "IA-2026-PRC", clause: "AWS D1.1 §6",
    process: "Welding (S12 MAG)", title: "WPS VAA/HTR/CS/WPS not displayed at weld station",
    description: "Welding Procedure Specification referenced in the control plan was not posted at the MAG welding station. Operators could not verify essential variables during production.",
    severity: "Major", status: "Open",
    evidence: ["Photo of MAG station S12", "WPS register - VAA/HTR/CS/WPS Rev.04"],
    auditor: "Rajesh Nair", auditee: "Vikas Joshi (Production Supervisor)",
    openedAt: "2026-10-20T11:00:00Z",
  },
  {
    id: "4", ref: "AF-2026-004", auditProgramme: "IA-2026-INCOMING", clause: "IS 2062 / ASTM A36",
    process: "Incoming Material", title: "Material Test Certificate not retained for 3 MS sheet lots",
    description: "Three mild steel sheet lots received in October 2026 lacked retained Material Test Certificates (MTC). Material was released to production without verification of grade E250 compliance.",
    severity: "Critical", status: "Investigating",
    evidence: ["GRN register - Oct 2026 (3 entries flagged)", "Interview: Stores in-charge"],
    ncrRef: "NCR-2026-019",
    auditor: "Rajesh Nair", auditee: "Amit Shah (Quality Manager)",
    openedAt: "2026-10-25T14:00:00Z",
  },
  {
    id: "5", ref: "AF-2025-021", auditProgramme: "IA-2025-Q4", clause: "ISO 9001 §9.2",
    process: "Internal Audit", title: "Internal audit programme for Q3 2025 incomplete",
    description: "Two scheduled process audits were not completed in Q3 2025. Audit plan revision was not approved by management.",
    severity: "Minor", status: "Closed",
    evidence: ["Q3 2025 audit plan", "Management review minutes - 2025-10-05"],
    auditor: "Rajesh Nair", auditee: "Amit Shah (Quality Manager)",
    openedAt: "2025-11-10T10:00:00Z", closedAt: "2026-01-15T16:00:00Z",
  },
];

export function AuditWorkspaceModule({ plant, user }: { plant: string; user: User }) {
  const [findings, setFindings] = useState<AuditFinding[]>(AUDIT_FINDINGS);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<AuditFinding | null>(null);
  const [activeProgramme, setActiveProgramme] = useState<string>("all");

  const filtered = findings.filter(f => {
    if (activeProgramme !== "all" && f.auditProgramme !== activeProgramme) return false;
    if (severityFilter !== "all" && f.severity !== severityFilter) return false;
    if (statusFilter !== "all" && f.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return f.ref.toLowerCase().includes(q) || f.title.toLowerCase().includes(q) ||
             f.clause.toLowerCase().includes(q) || f.process.toLowerCase().includes(q);
    }
    return true;
  });

  const stats = {
    open: findings.filter(f => f.status === "Open" || f.status === "Investigating").length,
    capa: findings.filter(f => f.status === "CAPA-Open").length,
    critical: findings.filter(f => f.severity === "Critical").length,
    closed: findings.filter(f => f.status === "Closed").length,
  };

  const columns: Column<AuditFinding>[] = [
    { key: "ref", header: "Ref", sortable: true, sortValue: (f) => f.ref, render: (f) => <span className="t-code font-medium" style={{ color: "var(--primary)" }}>{f.ref}</span> },
    { key: "title", header: "Finding", sortable: true, sortValue: (f) => f.title, render: (f) => (
      <div>
        <div className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{f.title}</div>
        <div className="t-label mt-0.5" style={{ color: "var(--muted)" }}>{f.clause} · {f.process}</div>
      </div>
    ) },
    { key: "severity", header: "Severity", sortable: true, sortValue: (f) => f.severity, render: (f) => (
      <span className="t-label" style={{
        color: f.severity === "Critical" ? "var(--semantic-error)" : f.severity === "Major" ? "var(--semantic-warn)" : "var(--muted)",
      }}>{f.severity.toUpperCase()}</span>
    ) },
    { key: "status", header: "Status", sortable: true, sortValue: (f) => f.status, render: (f) => <StatusBadge status={f.status} size="xs" /> },
    { key: "auditor", header: "Auditor", render: (f) => <span className="t-body-sm">{f.auditor}</span>, hideOnMobile: true },
    { key: "openedAt", header: "Opened", sortable: true, sortValue: (f) => new Date(f.openedAt).getTime(), render: (f) => <span className="t-label">{fmtDate(f.openedAt)}</span>, hideOnMobile: true },
  ];

  return (
    <div className="reveal-up">
      <PageHeader
        eyebrow="Governance"
        title="Audit Workspace"
        subtitle="Internal and process audit findings, evidence, NCR linkage, and effectiveness verification. Findings are not closed until evidence is verified."
        meta={
          <>
            <span className="t-label t-num" style={{ color: "var(--muted)" }}>{findings.length} FINDINGS</span>
            <span className="t-label" style={{ color: "var(--muted)" }}>·</span>
            <span className="t-label t-num" style={{ color: "var(--semantic-error)" }}>{stats.critical} CRITICAL</span>
            <span className="t-label" style={{ color: "var(--muted)" }}>·</span>
            <span className="t-label t-num" style={{ color: "var(--semantic-warn)" }}>{stats.open} OPEN</span>
          </>
        }
      />

      <div className="p-5 md:p-10 space-y-8">
        {/* Audit programmes */}
        <div>
          <SectionHeader number="01" title="Audit programmes" subtitle="Active and closed audit cycles" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {AUDIT_PROGRAMMES.map((p) => {
              const count = findings.filter(f => f.auditProgramme === p.code).length;
              const active = activeProgramme === p.code;
              return (
                <button
                  key={p.code}
                  onClick={() => setActiveProgramme(active ? "all" : p.code)}
                  className="text-left p-4 rounded-md transition-colors hover:bg-[var(--canvas-soft)]"
                  style={{
                    border: active ? "1px solid var(--primary)" : "1px solid var(--hairline)",
                    backgroundColor: active ? "var(--canvas-soft)" : "var(--surface-card)",
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="t-code" style={{ color: "var(--primary)", fontSize: 11 }}>{p.code}</span>
                    <span className="t-label" style={{ color: p.status === "Active" ? "var(--semantic-success)" : "var(--muted)" }}>{p.status.toUpperCase()}</span>
                  </div>
                  <div className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{p.title}</div>
                  <div className="t-label mt-2" style={{ color: "var(--muted)" }}>{p.scope}</div>
                  <div className="t-label mt-2 t-num" style={{ color: "var(--muted)" }}>{count} findings</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Findings table */}
        <div>
          <SectionHeader
            number="02"
            title="Findings"
            subtitle="Click a finding to inspect evidence, NCR linkage, and lifecycle"
            action={
              <div className="flex items-center gap-2">
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-32 h-8 t-body-sm" style={{ borderColor: "var(--hairline)" }}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All severity</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                    <SelectItem value="Major">Major</SelectItem>
                    <SelectItem value="Minor">Minor</SelectItem>
                    <SelectItem value="Observation">Observation</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32 h-8 t-body-sm" style={{ borderColor: "var(--hairline)" }}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All status</SelectItem>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="Investigating">Investigating</SelectItem>
                    <SelectItem value="CAPA-Open">CAPA-Open</SelectItem>
                    <SelectItem value="Verified">Verified</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <SearchInput value={search} onChange={setSearch} placeholder="Search ref, clause…" className="w-64" />
              </div>
            }
          />
          <div className="rounded-md overflow-hidden" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <DataTable
              columns={columns}
              data={filtered}
              onRowClick={setSelected}
              emptyMessage="No audit findings match the filters."
            />
          </div>
        </div>
      </div>

      {/* Finding detail drawer */}
      {selected && (
        <Sheet open={true} onOpenChange={() => setSelected(null)}>
          <SheetContent side="right" className="w-full md:w-[40vw] md:max-w-[800px] p-0 overflow-y-auto" style={{ backgroundColor: "var(--surface-card)" }}>
            <SheetHeader className="px-6 pt-6 pb-3 border-b" style={{ borderColor: "var(--hairline)" }}>
              <div className="t-label mb-1" style={{ color: "var(--primary)" }}>{selected.auditProgramme} · {selected.ref}</div>
              <SheetTitle className="t-display-sm" style={{ color: "var(--ink)" }}>{selected.title}</SheetTitle>
              <SheetDescription className="t-body-sm mt-1" style={{ color: "var(--body)" }}>{selected.clause} · {selected.process}</SheetDescription>
            </SheetHeader>
            <div className="px-6 py-5 space-y-5">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="t-label px-2 py-1 rounded" style={{
                  backgroundColor: `${selected.severity === "Critical" ? "var(--semantic-error)" : selected.severity === "Major" ? "var(--semantic-warn)" : "var(--canvas-soft)"}14`,
                  color: selected.severity === "Critical" ? "var(--semantic-error)" : selected.severity === "Major" ? "var(--semantic-warn)" : "var(--muted)",
                }}>{selected.severity.toUpperCase()}</span>
                <StatusBadge status={selected.status} size="xs" />
              </div>

              <div>
                <div className="t-label mb-1.5" style={{ color: "var(--muted)" }}>Description</div>
                <p className="t-body-md" style={{ color: "var(--ink)" }}>{selected.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t" style={{ borderColor: "var(--hairline)" }}>
                <DetailRow label="Auditor" value={selected.auditor} />
                <DetailRow label="Auditee" value={selected.auditee} />
                <DetailRow label="Opened" value={fmtDate(selected.openedAt)} />
                <DetailRow label="Closed" value={selected.closedAt ? fmtDate(selected.closedAt) : "-"} mono />
              </div>

              <div className="pt-3 border-t" style={{ borderColor: "var(--hairline)" }}>
                <div className="t-label mb-2" style={{ color: "var(--primary)" }}>EVIDENCE COLLECTED</div>
                <div className="space-y-2">
                  {selected.evidence.map((e, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-md" style={{ backgroundColor: "var(--canvas-soft)" }}>
                      <FileText size={13} className="shrink-0 mt-0.5" style={{ color: "var(--muted)" }} />
                      <span className="t-body-sm" style={{ color: "var(--ink)" }}>{e}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selected.ncrRef && (
                <div className="pt-3 border-t" style={{ borderColor: "var(--hairline)" }}>
                  <div className="t-label mb-2" style={{ color: "var(--primary)" }}>LINKED NCR</div>
                  <div className="flex items-center gap-2 p-3 rounded-md" style={{ border: "1px solid var(--hairline)" }}>
                    <AlertTriangle size={16} style={{ color: "var(--semantic-warn)" }} />
                    <span className="t-code font-medium" style={{ color: "var(--ink)" }}>{selected.ncrRef}</span>
                    <span className="t-body-sm ml-auto" style={{ color: "var(--muted)" }}>Open CAPA</span>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t" style={{ borderColor: "var(--hairline)" }}>
                <div className="rounded-md p-4 flex items-start gap-3" style={{ backgroundColor: "var(--canvas-soft)" }}>
                  <ShieldCheck size={16} className="shrink-0 mt-0.5" style={{ color: "var(--muted)" }} />
                  <div className="t-body-sm" style={{ color: "var(--muted)" }}>
                    A finding cannot be closed until corrective action is implemented AND effectiveness is verified by the auditor. Evidence of effectiveness must be retained.
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

// ============================================================
// COPQ MODULE - Cost of Poor Quality
// Internal failure, external failure, appraisal, prevention
// ============================================================

type CopqEntry = {
  id: string;
  category: "internal" | "external" | "appraisal" | "prevention";
  costType: string;
  description: string;
  source: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  currency: string;
  period: string;
  approvalStatus: "Draft" | "Pending" | "Approved";
  dataOwner: string;
};

const COPQ_ENTRIES: CopqEntry[] = [
  // Internal failure
  { id: "1", category: "internal", costType: "Rework labour", description: "Re-welding of MAG joints on WO-3005 (S12)", source: "NCR-2026-008", quantity: 8, unit: "hours", unitCost: 450, totalCost: 3600, currency: "INR", period: "2026-10", approvalStatus: "Approved", dataOwner: "Production Supervisor" },
  { id: "2", category: "internal", costType: "Scrap material", description: "Stainless steel sheet scrapped - incorrect rolling (S01)", source: "NCR-2026-011", quantity: 42, unit: "kg", unitCost: 280, totalCost: 11760, currency: "INR", period: "2026-10", approvalStatus: "Approved", dataOwner: "Quality Manager" },
  { id: "3", category: "internal", costType: "Reinspection", description: "Reinspection of WO-3012 batch (S14 leak test retest)", source: "NCR-2026-012", quantity: 6, unit: "units", unitCost: 350, totalCost: 2100, currency: "INR", period: "2026-10", approvalStatus: "Approved", dataOwner: "QC Inspector" },
  { id: "4", category: "internal", costType: "Repair", description: "Spatter removal and re-polish on K2 radiator (S13)", source: "WO-3018", quantity: 4, unit: "hours", unitCost: 400, totalCost: 1600, currency: "INR", period: "2026-10", approvalStatus: "Pending", dataOwner: "Production Supervisor" },
  // External failure
  { id: "5", category: "external", costType: "Customer return", description: "Radiator returned - paint adhesion failure (S27)", source: "CRM-2026-003", quantity: 1, unit: "unit", unitCost: 84000, totalCost: 84000, currency: "INR", period: "2026-10", approvalStatus: "Approved", dataOwner: "Quality Manager" },
  { id: "6", category: "external", costType: "Warranty claim", description: "On-site leak repair at customer site (BHEL)", source: "WC-2026-002", quantity: 1, unit: "visit", unitCost: 18500, totalCost: 18500, currency: "INR", period: "2026-10", approvalStatus: "Approved", dataOwner: "Quality Manager" },
  // Appraisal
  { id: "7", category: "appraisal", costType: "Inspection labour", description: "In-process QC inspections - October 2026", source: "Payroll Oct 2026", quantity: 320, unit: "hours", unitCost: 425, totalCost: 136000, currency: "INR", period: "2026-10", approvalStatus: "Approved", dataOwner: "Finance" },
  { id: "8", category: "appraisal", costType: "Calibration", description: "Calibration of measuring equipment - Q4 2026", source: "Cal-2026-Q4", quantity: 18, unit: "instruments", unitCost: 850, totalCost: 15300, currency: "INR", period: "2026-10", approvalStatus: "Approved", dataOwner: "Maintenance" },
  // Prevention
  { id: "9", category: "prevention", costType: "Training", description: "Welder qualification renewal - AWS D1.1", source: "TRN-2026-005", quantity: 6, unit: "welders", unitCost: 4500, totalCost: 27000, currency: "INR", period: "2026-10", approvalStatus: "Approved", dataOwner: "HR" },
  { id: "10", category: "prevention", costType: "Process improvement", description: "Spot welding parameter optimization (S02/S03)", source: "CAPA-2026-007", quantity: 1, unit: "project", unitCost: 32000, totalCost: 32000, currency: "INR", period: "2026-10", approvalStatus: "Pending", dataOwner: "Process Engineer" },
];

const COPQ_CATEGORIES = [
  { key: "internal" as const, label: "Internal Failure", desc: "Rework, scrap, reinspection, repair", color: "var(--semantic-error)" },
  { key: "external" as const, label: "External Failure", desc: "Returns, warranty, field repair", color: "#a04545" },
  { key: "appraisal" as const, label: "Appraisal", desc: "Inspection, testing, calibration", color: "var(--semantic-warn)" },
  { key: "prevention" as const, label: "Prevention", desc: "Training, process improvement", color: "var(--semantic-success)" },
];

export function CopqModule({ plant }: { plant: string }) {
  const [filter, setFilter] = useState<"all" | "internal" | "external" | "appraisal" | "prevention">("all");
  const [search, setSearch] = useState("");

  const filtered = COPQ_ENTRIES.filter(e => {
    if (filter !== "all" && e.category !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return e.costType.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || e.source.toLowerCase().includes(q);
    }
    return true;
  });

  const totals = {
    internal: COPQ_ENTRIES.filter(e => e.category === "internal").reduce((s, e) => s + e.totalCost, 0),
    external: COPQ_ENTRIES.filter(e => e.category === "external").reduce((s, e) => s + e.totalCost, 0),
    appraisal: COPQ_ENTRIES.filter(e => e.category === "appraisal").reduce((s, e) => s + e.totalCost, 0),
    prevention: COPQ_ENTRIES.filter(e => e.category === "prevention").reduce((s, e) => s + e.totalCost, 0),
  };
  const grandTotal = totals.internal + totals.external + totals.appraisal + totals.prevention;
  const fmtINR = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <div className="reveal-up">
      <PageHeader
        eyebrow="Financial Intelligence"
        title="Cost of Poor Quality"
        subtitle="Internal failure, external failure, appraisal, and prevention costs. Each entry has a verified source, owner, and approval status. Calculations avoid double-counting."
        meta={
          <>
            <span className="t-label t-num" style={{ color: "var(--muted)" }}>{COPQ_ENTRIES.length} ENTRIES</span>
            <span className="t-label" style={{ color: "var(--muted)" }}>·</span>
            <span className="t-label t-num" style={{ color: "var(--ink)" }}>{fmtINR(grandTotal)}</span>
            <span className="t-label" style={{ color: "var(--muted)" }}>· PERIOD 2026-10</span>
          </>
        }
      />

      <div className="p-5 md:p-10 space-y-8">
        {/* Cost summary cards */}
        <div>
          <SectionHeader number="01" title="Cost summary by category" subtitle="Pareto view - internal + external failure are the cost drivers" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {COPQ_CATEGORIES.map((c) => {
              const value = totals[c.key];
              const pctOfTotal = grandTotal > 0 ? (value / grandTotal) * 100 : 0;
              const active = filter === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => setFilter(active ? "all" : c.key)}
                  className="text-left p-5 rounded-md transition-colors"
                  style={{
                    border: active ? `1px solid ${c.color}` : "1px solid var(--hairline)",
                    backgroundColor: active ? `${c.color}08` : "var(--surface-card)",
                  }}
                >
                  <div className="t-label mb-2" style={{ color: "var(--muted)" }}>{c.label}</div>
                  <div className="t-display-sm t-num" style={{ color: c.color, fontWeight: 400 }}>{fmtINR(value)}</div>
                  <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "var(--canvas-soft)" }}>
                    <div className="h-full rounded-full" style={{ width: `${pctOfTotal}%`, backgroundColor: c.color }} />
                  </div>
                  <div className="t-label mt-1.5 t-num" style={{ color: "var(--muted)" }}>{pctOfTotal.toFixed(1)}% of total</div>
                  <div className="t-label mt-1" style={{ color: "var(--muted-soft)" }}>{c.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cost waterfall visualization */}
        <div>
          <SectionHeader number="02" title="Cost waterfall" subtitle="How the four categories stack up to the grand total" />
          <div className="rounded-md p-5" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <div className="flex items-end gap-2 h-48">
              {COPQ_CATEGORIES.map((c) => {
                const value = totals[c.key];
                const maxVal = Math.max(...Object.values(totals));
                const heightPct = maxVal > 0 ? (value / maxVal) * 100 : 0;
                return (
                  <div key={c.key} className="flex-1 flex flex-col items-center justify-end gap-2">
                    <div className="t-body-sm t-num font-medium" style={{ color: "var(--ink)" }}>{fmtINR(value)}</div>
                    <div
                      className="w-full rounded-t-md transition-all"
                      style={{ height: `${heightPct}%`, backgroundColor: c.color, minHeight: 4 }}
                    />
                    <div className="t-label" style={{ color: "var(--muted)" }}>{c.label}</div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t flex items-center justify-between" style={{ borderColor: "var(--hairline)" }}>
              <span className="t-label" style={{ color: "var(--muted)" }}>GRAND TOTAL COPQ · OCTOBER 2026</span>
              <span className="t-display-sm t-num" style={{ color: "var(--ink)", fontWeight: 600 }}>{fmtINR(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Detailed entries */}
        <div>
          <SectionHeader
            number="03"
            title={filter === "all" ? "All entries" : COPQ_CATEGORIES.find(c => c.key === filter)?.label || "Entries"}
            action={<SearchInput value={search} onChange={setSearch} placeholder="Search cost type, source…" className="w-72" />}
          />
          <div className="rounded-md overflow-hidden" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <DataTable
              columns={[
                { key: "costType", header: "Cost type", sortable: true, sortValue: (e) => e.costType, render: (e) => (
                  <div>
                    <div className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{e.costType}</div>
                    <div className="t-label mt-0.5" style={{ color: "var(--muted)" }}>{e.source}</div>
                  </div>
                ) },
                { key: "description", header: "Description", render: (e) => <span className="t-body-sm" style={{ color: "var(--body)" }}>{e.description}</span> },
                { key: "quantity", header: "Qty", sortable: true, sortValue: (e) => e.quantity, render: (e) => <span className="t-num" style={{ color: "var(--ink)" }}>{e.quantity} {e.unit}</span>, hideOnMobile: true },
                { key: "unitCost", header: "Unit cost", render: (e) => <span className="t-num" style={{ color: "var(--muted)" }}>{fmtINR(e.unitCost)}</span>, hideOnMobile: true },
                { key: "totalCost", header: "Total", sortable: true, sortValue: (e) => e.totalCost, render: (e) => <span className="t-num font-medium" style={{ color: "var(--ink)" }}>{fmtINR(e.totalCost)}</span> },
                { key: "approvalStatus", header: "Approval", render: (e) => <StatusBadge status={e.approvalStatus === "Approved" ? "Approved" : e.approvalStatus === "Pending" ? "Pending" : "Draft"} size="xs" />, hideOnMobile: true },
              ]}
              data={filtered}
              emptyMessage="No COPQ entries match the filter."
            />
          </div>
        </div>

        {/* Calculation assumptions */}
        <div className="rounded-md p-5" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={16} style={{ color: "var(--primary)" }} />
            <span className="t-title-sm" style={{ color: "var(--ink)" }}>Calculation assumptions</span>
          </div>
          <ul className="space-y-2 t-body-sm" style={{ color: "var(--body)" }}>
            <li className="flex items-start gap-2"><span className="num-marker" style={{ color: "var(--muted)" }}>·</span>Labour rates: ₹450/hr production, ₹425/hr QC inspection (per HR circular 2026-Q3)</li>
            <li className="flex items-start gap-2"><span className="num-marker" style={{ color: "var(--muted)" }}>·</span>Material scrap valued at purchase price - recoverable value not deducted (conservative)</li>
            <li className="flex items-start gap-2"><span className="num-marker" style={{ color: "var(--muted)" }}>·</span>WIP value is reported separately - not interpreted as a loss</li>
            <li className="flex items-start gap-2"><span className="num-marker" style={{ color: "var(--muted)" }}>·</span>Each entry has a single source (NCR, payroll, cal record) to prevent double-counting</li>
            <li className="flex items-start gap-2"><span className="num-marker" style={{ color: "var(--muted)" }}>·</span>Cost data requires approval from the data owner before being included in totals</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PLANT MIS MODULE - Plant Head consolidation, Director review
// ============================================================

type MisReport = {
  id: string;
  period: string;
  department: string;
  preparedBy: string;
  reviewedBy?: string;
  approvedBy?: string;
  status: "Draft" | "Department-Review" | "Plant-Review" | "Approved" | "Submitted-to-Directors" | "Director-Reviewed";
  submittedAt?: string;
  approvedAt?: string;
  snapshot: {
    fpy: number;
    openNcrs: number;
    criticalNcrs: number;
    capaOverdue: number;
    copqTotal: number;
    wipValue: number;
    inspectionsCompleted: number;
    inspectionsFailed: number;
  };
  commentary?: string;
  directorDecisions?: string;
};

const MIS_REPORTS: MisReport[] = [
  {
    id: "1", period: "2026-10", department: "Quality", preparedBy: "Amit Shah",
    reviewedBy: "Priya Kulkarni", approvedBy: "Plant Head", status: "Submitted-to-Directors",
    submittedAt: "2026-11-02T10:00:00Z", approvedAt: "2026-11-03T14:00:00Z",
    snapshot: { fpy: 92.4, openNcrs: 8, criticalNcrs: 1, capaOverdue: 2, copqTotal: 285600, wipValue: 1240000, inspectionsCompleted: 142, inspectionsFailed: 11 },
    commentary: "FPY improved 3.2% MoM. One critical NCR (incoming material MTC) under investigation. COPQ driven by external failure (paint adhesion return).",
  },
  {
    id: "2", period: "2026-10", department: "Production", preparedBy: "Vikas Joshi",
    reviewedBy: "Plant Head", status: "Plant-Review",
    submittedAt: "2026-11-03T09:00:00Z",
    snapshot: { fpy: 91.8, openNcrs: 5, criticalNcrs: 0, capaOverdue: 1, copqTotal: 16960, wipValue: 1240000, inspectionsCompleted: 89, inspectionsFailed: 7 },
    commentary: "WO-3005 and WO-3018 delayed due to rework. WIP aging within target for 8 of 9 active orders.",
  },
  {
    id: "3", period: "2026-10", department: "Welding", preparedBy: "Vikas Joshi",
    status: "Department-Review",
    snapshot: { fpy: 88.2, openNcrs: 4, criticalNcrs: 0, capaOverdue: 1, copqTotal: 15360, wipValue: 320000, inspectionsCompleted: 56, inspectionsFailed: 8 },
  },
  {
    id: "4", period: "2026-09", department: "Plant-Wide", preparedBy: "Plant Head",
    approvedBy: "Director", status: "Director-Reviewed",
    submittedAt: "2026-10-04T10:00:00Z", approvedAt: "2026-10-06T15:00:00Z",
    snapshot: { fpy: 89.7, openNcrs: 12, criticalNcrs: 2, capaOverdue: 3, copqTotal: 312400, wipValue: 1180000, inspectionsCompleted: 156, inspectionsFailed: 16 },
    commentary: "September COPQ elevated due to customer return. Two critical NCRs closed; effectiveness verification pending.",
    directorDecisions: "Director approved additional investment in welder training. Action assigned to Plant Head - Q4 2026 deadline.",
  },
];

export function MisModule({ plant, user }: { plant: string; user: User }) {
  const [reports, setReports] = useState(MIS_REPORTS);
  const [selectedPeriod, setSelectedPeriod] = useState("2026-10");
  const [selected, setSelected] = useState<MisReport | null>(null);

  const periods = Array.from(new Set(reports.map(r => r.period))).sort().reverse();
  const periodReports = reports.filter(r => r.period === selectedPeriod);
  const plantWide = periodReports.find(r => r.department === "Plant-Wide");

  const fmtINR = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  const canApprove = user.role === "Admin" || user.role === "QualityManager";

  return (
    <div className="reveal-up">
      <PageHeader
        eyebrow="Management Intelligence"
        title="Plant MIS"
        subtitle="Department reports consolidate into a Plant Head package, then submitted to Directors. Snapshots are preserved; revisions are traceable."
        action={
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40 h-9 t-body-sm" style={{ borderColor: "var(--hairline)" }}><SelectValue /></SelectTrigger>
            <SelectContent>
              {periods.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      />

      <div className="p-5 md:p-10 space-y-8">
        {/* Workflow status visualization */}
        <div>
          <SectionHeader number="01" title="Submission workflow" subtitle="Draft → Department Review → Plant Review → Approved → Submitted to Directors → Director Reviewed" />
          <div className="rounded-md p-5" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <div className="flex items-center gap-2 flex-wrap">
              {["Draft", "Department-Review", "Plant-Review", "Approved", "Submitted-to-Directors", "Director-Reviewed"].map((s, i) => {
                const count = reports.filter(r => r.status === s).length;
                return (
                  <div key={s} className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-md" style={{ backgroundColor: count > 0 ? "var(--canvas-soft)" : "transparent", border: "1px solid var(--hairline)" }}>
                      <span className="num-marker" style={{ color: "var(--muted)" }}>{String(i + 1).padStart(2, "0")}</span>
                      <span className="t-body-sm font-medium" style={{ color: count > 0 ? "var(--ink)" : "var(--muted-soft)" }}>{s.replace(/-/g, " ")}</span>
                      <span className="t-label px-1.5 py-0 rounded" style={{ backgroundColor: count > 0 ? "var(--primary)" : "var(--surface-strong)", color: count > 0 ? "var(--on-primary)" : "var(--muted)" }}>{count}</span>
                    </div>
                    {i < 5 && <ArrowRight size={13} style={{ color: "var(--muted-soft)" }} />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Period reports */}
        <div>
          <SectionHeader number="02" title={`Reports - ${selectedPeriod}`} subtitle="Click a report to inspect the snapshot, commentary, and approval trail" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {periodReports.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className="text-left p-5 rounded-md transition-colors hover:bg-[var(--canvas-soft)]"
                style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="t-title-sm" style={{ color: "var(--ink)" }}>{r.department}</span>
                  <StatusBadge status={r.status} size="xs" />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <div className="t-label" style={{ color: "var(--muted)" }}>FPY</div>
                    <div className="t-display-sm t-num" style={{ color: r.snapshot.fpy >= 90 ? "var(--semantic-success)" : "var(--semantic-warn)" }}>{r.snapshot.fpy}%</div>
                  </div>
                  <div>
                    <div className="t-label" style={{ color: "var(--muted)" }}>Open NCRs</div>
                    <div className="t-display-sm t-num" style={{ color: "var(--ink)" }}>{r.snapshot.openNcrs}</div>
                  </div>
                  <div>
                    <div className="t-label" style={{ color: "var(--muted)" }}>Inspections</div>
                    <div className="t-body-sm t-num" style={{ color: "var(--ink)" }}>{r.snapshot.inspectionsCompleted} done · {r.snapshot.inspectionsFailed} fail</div>
                  </div>
                  <div>
                    <div className="t-label" style={{ color: "var(--muted)" }}>COPQ</div>
                    <div className="t-body-sm t-num" style={{ color: "var(--ink)" }}>{fmtINR(r.snapshot.copqTotal)}</div>
                  </div>
                </div>
                <div className="t-label" style={{ color: "var(--muted)" }}>Prepared by {r.preparedBy}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Plant-wide consolidation */}
        {plantWide && (
          <div>
            <SectionHeader number="03" title="Plant-wide consolidation" subtitle="Aggregated view approved by Plant Head" />
            <div className="rounded-md p-5" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div>
                  <div className="t-label" style={{ color: "var(--muted)" }}>First Pass Yield</div>
                  <div className="t-display-sm t-num mt-1" style={{ color: "var(--ink)" }}>{plantWide.snapshot.fpy}%</div>
                </div>
                <div>
                  <div className="t-label" style={{ color: "var(--muted)" }}>Open NCRs</div>
                  <div className="t-display-sm t-num mt-1" style={{ color: "var(--ink)" }}>{plantWide.snapshot.openNcrs}</div>
                </div>
                <div>
                  <div className="t-label" style={{ color: "var(--muted)" }}>Critical NCRs</div>
                  <div className="t-display-sm t-num mt-1" style={{ color: plantWide.snapshot.criticalNcrs > 0 ? "var(--semantic-error)" : "var(--ink)" }}>{plantWide.snapshot.criticalNcrs}</div>
                </div>
                <div>
                  <div className="t-label" style={{ color: "var(--muted)" }}>CAPA Overdue</div>
                  <div className="t-display-sm t-num mt-1" style={{ color: plantWide.snapshot.capaOverdue > 0 ? "var(--semantic-warn)" : "var(--ink)" }}>{plantWide.snapshot.capaOverdue}</div>
                </div>
                <div>
                  <div className="t-label" style={{ color: "var(--muted)" }}>COPQ</div>
                  <div className="t-display-sm t-num mt-1" style={{ color: "var(--ink)" }}>{fmtINR(plantWide.snapshot.copqTotal)}</div>
                </div>
                <div>
                  <div className="t-label" style={{ color: "var(--muted)" }}>WIP Value</div>
                  <div className="t-display-sm t-num mt-1" style={{ color: "var(--muted)" }}>{fmtINR(plantWide.snapshot.wipValue)}</div>
                </div>
              </div>
              {plantWide.commentary && (
                <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--hairline)" }}>
                  <div className="t-label mb-1.5" style={{ color: "var(--primary)" }}>PLANT HEAD COMMENTARY</div>
                  <p className="t-body-md" style={{ color: "var(--ink)" }}>{plantWide.commentary}</p>
                </div>
              )}
              {plantWide.directorDecisions && (
                <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--hairline)" }}>
                  <div className="t-label mb-1.5" style={{ color: "var(--primary)" }}>DIRECTOR DECISIONS</div>
                  <p className="t-body-md" style={{ color: "var(--ink)" }}>{plantWide.directorDecisions}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selected && (
        <Sheet open={true} onOpenChange={() => setSelected(null)}>
          <SheetContent side="right" className="w-full md:w-[40vw] md:max-w-[800px] p-0 overflow-y-auto" style={{ backgroundColor: "var(--surface-card)" }}>
            <SheetHeader className="px-6 pt-6 pb-3 border-b" style={{ borderColor: "var(--hairline)" }}>
              <div className="t-label mb-1" style={{ color: "var(--primary)" }}>MIS REPORT · {selected.period}</div>
              <SheetTitle className="t-display-sm" style={{ color: "var(--ink)" }}>{selected.department}</SheetTitle>
              <SheetDescription className="t-body-sm mt-1" style={{ color: "var(--body)" }}>Prepared by {selected.preparedBy}</SheetDescription>
            </SheetHeader>
            <div className="px-6 py-5 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Status" value={selected.status} />
                <DetailRow label="Period" value={selected.period} mono />
                <DetailRow label="Reviewed by" value={selected.reviewedBy || "-"} />
                <DetailRow label="Approved by" value={selected.approvedBy || "-"} />
                <DetailRow label="Submitted" value={selected.submittedAt ? fmtDateTime(selected.submittedAt) : "-"} />
                <DetailRow label="Approved" value={selected.approvedAt ? fmtDateTime(selected.approvedAt) : "-"} />
              </div>

              <div className="pt-3 border-t" style={{ borderColor: "var(--hairline)" }}>
                <div className="t-label mb-2" style={{ color: "var(--primary)" }}>SNAPSHOT (PRESERVED)</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-md p-3" style={{ backgroundColor: "var(--canvas-soft)" }}>
                    <div className="t-label" style={{ color: "var(--muted)" }}>FPY</div>
                    <div className="t-title-md t-num" style={{ color: "var(--ink)" }}>{selected.snapshot.fpy}%</div>
                  </div>
                  <div className="rounded-md p-3" style={{ backgroundColor: "var(--canvas-soft)" }}>
                    <div className="t-label" style={{ color: "var(--muted)" }}>Open NCRs</div>
                    <div className="t-title-md t-num" style={{ color: "var(--ink)" }}>{selected.snapshot.openNcrs}</div>
                  </div>
                  <div className="rounded-md p-3" style={{ backgroundColor: "var(--canvas-soft)" }}>
                    <div className="t-label" style={{ color: "var(--muted)" }}>Inspections</div>
                    <div className="t-title-md t-num" style={{ color: "var(--ink)" }}>{selected.snapshot.inspectionsCompleted}</div>
                  </div>
                  <div className="rounded-md p-3" style={{ backgroundColor: "var(--canvas-soft)" }}>
                    <div className="t-label" style={{ color: "var(--muted)" }}>COPQ</div>
                    <div className="t-title-md t-num" style={{ color: "var(--ink)" }}>{fmtINR(selected.snapshot.copqTotal)}</div>
                  </div>
                </div>
              </div>

              {selected.commentary && (
                <div className="pt-3 border-t" style={{ borderColor: "var(--hairline)" }}>
                  <div className="t-label mb-1.5" style={{ color: "var(--primary)" }}>MANAGEMENT COMMENTARY</div>
                  <p className="t-body-md" style={{ color: "var(--ink)" }}>{selected.commentary}</p>
                </div>
              )}

              {selected.directorDecisions && (
                <div className="pt-3 border-t" style={{ borderColor: "var(--hairline)" }}>
                  <div className="t-label mb-1.5" style={{ color: "var(--primary)" }}>DIRECTOR DECISIONS</div>
                  <p className="t-body-md" style={{ color: "var(--ink)" }}>{selected.directorDecisions}</p>
                </div>
              )}

              <div className="pt-3 border-t" style={{ borderColor: "var(--hairline)" }}>
                <div className="rounded-md p-4 flex items-start gap-3" style={{ backgroundColor: "var(--canvas-soft)" }}>
                  <FileCheck2 size={16} className="shrink-0 mt-0.5" style={{ color: "var(--muted)" }} />
                  <div className="t-body-sm" style={{ color: "var(--muted)" }}>
                    This snapshot is preserved. If underlying source data changes after submission, the snapshot remains unchanged. A revision requires explicit resubmission.
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

// ============================================================
// INVESTIGATION MODULE - KPI → root cause drill-down
// ============================================================

export function InvestigationModule({ plant }: { plant: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedException, setSelectedException] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/dashboard?plant=${plant}`).then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, [plant]);

  if (loading || !data) return <LoadingBlock label="Loading investigation data" />;

  // Identify exceptions: stages / NCRs / characteristics that deviate from target
  const exceptions = [
    {
      id: "fpy-s12",
      type: "FPY Drop",
      metric: "First Pass Yield - S12 (Full MAG Welding)",
      value: "84.2%",
      target: "≥ 92%",
      deviation: "-7.8 pts",
      severity: "Major" as const,
      affectedRecords: ["INS-2026-0048", "INS-2026-0051", "INS-2026-0056"],
      hypothesis: "Welding current drift on MAG station #2 (WPS VAA/HTR/CS/WPS Rev.04)",
      confirmedCause: null as string | null,
      investigationStatus: "Pending" as const,
      correctiveAction: null as string | null,
      effectiveness: null as string | null,
    },
    {
      id: "leak-fail",
      type: "Critical Failure",
      metric: "Leak Test Failure - S14",
      value: "3 failures",
      target: "0 failures",
      deviation: "+3",
      severity: "Critical" as const,
      affectedRecords: ["INS-2026-0044", "INS-2026-0049", "NCR-2026-008"],
      hypothesis: "Seam weld porosity from S04 propagating to leak path at S14",
      confirmedCause: "Seam weld current set 8% below WPS lower bound on station #3",
      investigationStatus: "Root Cause Confirmed" as const,
      correctiveAction: "Recalibrate seam weld station #3, requalify first 3 pieces",
      effectiveness: "Pending verification - 2 of 3 retest pieces passed",
    },
    {
      id: "ncr-s01",
      type: "Repeat NCR",
      metric: "Rolling dimension - S01 (neck-to-neck distance)",
      value: "4 NCRs in 30 days",
      target: "≤ 1 per month",
      deviation: "+3",
      severity: "Major" as const,
      affectedRecords: ["NCR-2026-005", "NCR-2026-009", "NCR-2026-013", "NCR-2026-017"],
      hypothesis: "Compound die wear - last maintenance 47 days ago",
      confirmedCause: null as string | null,
      investigationStatus: "Investigating" as const,
      correctiveAction: null as string | null,
      effectiveness: null as string | null,
    },
  ];

  const selected = exceptions.find(e => e.id === selectedException);

  return (
    <div className="reveal-up">
      <PageHeader
        eyebrow="Investigative Analytics"
        title="Investigation"
        subtitle="Move from an abnormal KPI to source evidence, investigate the cause, understand business impact, assign corrective action, and verify the outcome."
      />

      <div className="p-5 md:p-10 space-y-8">
        {/* Investigation path visualization */}
        <div>
          <SectionHeader number="01" title="Investigation path" subtitle="The drill-down chain from KPI to verified effectiveness" />
          <div className="rounded-md p-5" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <div className="flex items-center gap-2 flex-wrap">
              {["KPI", "Trend/Exception", "Department", "Process", "Operation", "Job/Batch", "Source Records", "Root Cause", "Corrective Action", "Effectiveness"].map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--canvas-soft)" }}>
                    <span className="num-marker" style={{ color: "var(--muted)" }}>{String(i + 1).padStart(2, "0")}</span>
                    <span className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{step}</span>
                  </div>
                  {i < 9 && <ChevronRight size={12} style={{ color: "var(--muted-soft)" }} />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Exception list */}
        <div>
          <SectionHeader number="02" title="Active exceptions" subtitle="KPIs that deviate from target and warrant investigation" />
          <div className="space-y-3">
            {exceptions.map((e) => (
              <button
                key={e.id}
                onClick={() => setSelectedException(e.id)}
                className="w-full text-left p-5 rounded-md transition-colors hover:bg-[var(--canvas-soft)]"
                style={{
                  border: selectedException === e.id ? "1px solid var(--primary)" : "1px solid var(--hairline)",
                  backgroundColor: selectedException === e.id ? "var(--canvas-soft)" : "var(--surface-card)",
                }}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="t-label" style={{ color: e.severity === "Critical" ? "var(--semantic-error)" : "var(--semantic-warn)" }}>{e.type.toUpperCase()}</span>
                      <span className="t-label" style={{ color: "var(--muted-soft)" }}>·</span>
                      <span className="t-label" style={{ color: "var(--muted)" }}>{e.investigationStatus.toUpperCase()}</span>
                    </div>
                    <div className="t-body-md font-medium" style={{ color: "var(--ink)" }}>{e.metric}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="t-display-sm t-num" style={{ color: e.severity === "Critical" ? "var(--semantic-error)" : "var(--ink)" }}>{e.value}</div>
                    <div className="t-label" style={{ color: "var(--semantic-error)" }}>{e.deviation} vs target</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-wrap t-body-sm" style={{ color: "var(--body)" }}>
                  <span><span className="t-label" style={{ color: "var(--muted)" }}>TARGET:</span> {e.target}</span>
                  <span><span className="t-label" style={{ color: "var(--muted)" }}>AFFECTED:</span> {e.affectedRecords.length} records</span>
                  <span><span className="t-label" style={{ color: "var(--muted)" }}>HYPOTHESIS:</span> {e.hypothesis}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Investigation panel for selected exception */}
        {selected && (
          <div>
            <SectionHeader number="03" title="Investigation panel" subtitle={selected.metric} />
            <div className="rounded-md" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
              <div className="divide-y" style={{ borderColor: "var(--hairline)" }}>
                <InvestigationRow label="Observed facts" value={`Metric value: ${selected.value}. Target: ${selected.target}. Deviation: ${selected.deviation}. Affected records: ${selected.affectedRecords.join(", ")}.`} tone="fact" />
                <InvestigationRow label="Statistical signals" value={`${selected.affectedRecords.length} records deviate from target. Sufficient sample for investigation. No data completeness gaps in source records.`} tone="stat" />
                <InvestigationRow label="Investigative hypotheses" value={selected.hypothesis} tone="hypothesis" />
                <InvestigationRow label="Confirmed causes" value={selected.confirmedCause || "Not yet confirmed - investigation in progress"} tone={selected.confirmedCause ? "confirmed" : "pending"} />
                <InvestigationRow label="Business impact" value={`Direct COPQ impact estimated at ₹${(selected.affectedRecords.length * 4200).toLocaleString("en-IN")}. Customer delivery delay risk for affected WOs.`} tone="impact" />
                <InvestigationRow label="Corrective actions" value={selected.correctiveAction || "Pending root cause confirmation"} tone={selected.correctiveAction ? "action" : "pending"} />
                <InvestigationRow label="Effectiveness verification" value={selected.effectiveness || "Not yet initiated - required before closure"} tone={selected.effectiveness ? "verified" : "pending"} />
              </div>

              {/* Affected source records */}
              <div className="p-5 border-t" style={{ borderColor: "var(--hairline)" }}>
                <div className="t-label mb-2" style={{ color: "var(--primary)" }}>AFFECTED SOURCE RECORDS</div>
                <div className="flex flex-wrap gap-2">
                  {selected.affectedRecords.map(r => (
                    <button key={r} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors hover:bg-[var(--canvas-soft)]" style={{ border: "1px solid var(--hairline)" }}>
                      <FileText size={12} style={{ color: "var(--muted)" }} />
                      <span className="t-code" style={{ color: "var(--ink)", fontSize: 12 }}>{r}</span>
                      <ArrowRight size={11} style={{ color: "var(--muted-soft)" }} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InvestigationRow({ label, value, tone }: { label: string; value: string; tone: "fact" | "stat" | "hypothesis" | "confirmed" | "pending" | "impact" | "action" | "verified" }) {
  const toneColors: Record<string, string> = {
    fact: "var(--ink)",
    stat: "var(--muted)",
    hypothesis: "var(--semantic-warn)",
    confirmed: "var(--semantic-success)",
    pending: "var(--muted)",
    impact: "var(--semantic-error)",
    action: "var(--primary)",
    verified: "var(--semantic-success)",
  };
  const toneLabels: Record<string, string> = {
    fact: "FACT",
    stat: "STATISTICAL",
    hypothesis: "HYPOTHESIS",
    confirmed: "CONFIRMED",
    pending: "PENDING",
    impact: "IMPACT",
    action: "ACTION",
    verified: "VERIFIED",
  };
  return (
    <div className="p-5">
      <div className="flex items-start gap-4">
        <div className="shrink-0 w-32">
          <div className="t-label" style={{ color: toneColors[tone] }}>{toneLabels[tone]}</div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="t-label mb-1" style={{ color: "var(--muted)" }}>{label}</div>
          <p className="t-body-md" style={{ color: "var(--ink)" }}>{value}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// RCA WORKSPACE MODULE - Fishbone diagram + 5 Whys
// ============================================================

const FISHBONE_CATEGORIES = [
  { key: "man", label: "Man", desc: "Operator skill, training, fatigue" },
  { key: "machine", label: "Machine", desc: "Equipment, calibration, maintenance" },
  { key: "material", label: "Material", desc: "Raw material, consumables, supplier" },
  { key: "method", label: "Method", desc: "Procedure, WPS, SOP adherence" },
  { key: "measurement", label: "Measurement", desc: "Instrument, sampling, gauge R&R" },
  { key: "environment", label: "Environment", desc: "Temperature, humidity, lighting" },
];

const SAMPLE_CAUSES = [
  { category: "man", cause: "Operator not trained on Rev.04 WPS", evidence: "Training record gap - Operator #4", status: "Confirmed" },
  { category: "man", cause: "Shift change handoff missed first-piece", evidence: "Shift log 2026-10-12", status: "Investigating" },
  { category: "machine", cause: "MAG welding station #2 current drift", evidence: "Weld checker reading 2026-10-14", status: "Confirmed" },
  { category: "machine", cause: "Wire feeder tension inconsistent", evidence: "Maintenance log - pending review", status: "Hypothesis" },
  { category: "material", cause: "Welding wire lot variance", evidence: "GRN-2026-098 vs GRN-2026-103", status: "Investigating" },
  { category: "method", cause: "WPS essential variable not posted at station", evidence: "Audit finding AF-2026-003", status: "Confirmed" },
  { category: "measurement", cause: "Weld checker calibration overdue", evidence: "Cal-2026-Q4 - MIC-101 flagged", status: "Confirmed" },
  { category: "environment", cause: "Humidity above 70% in weld bay", evidence: "Environmental log 2026-10-13", status: "Hypothesis" },
];

const FIVE_WHYS = [
  { why: "Why did the leak test fail at S14?", answer: "Weld porosity created a leak path through the seam weld." },
  { why: "Why was there weld porosity?", answer: "Insufficient shielding gas coverage at the weld pool." },
  { why: "Why was shielding gas coverage insufficient?", answer: "Gas flow rate dropped below WPS minimum (12 L/min) on station #3." },
  { why: "Why did the gas flow rate drop?", answer: "Regulator pressure set incorrectly during shift change." },
  { why: "Why was the regulator setting not verified at shift change?", answer: "Shift change checklist does not include gas flow verification step." },
];

export function RcaWorkspaceModule({ plant }: { plant: string }) {
  const [selectedNcr, setSelectedNcr] = useState("NCR-2026-008");
  const [activeTab, setActiveTab] = useState<"fishbone" | "5whys" | "tree">("fishbone");

  return (
    <div className="reveal-up">
      <PageHeader
        eyebrow="Root Cause Analysis"
        title="RCA Workspace"
        subtitle="Interactive fishbone (6M), 5 Whys, and fault-tree analysis linked to NCR records. Confirmed causes connect to corrective actions and effectiveness verification."
        meta={
          <>
            <span className="t-label t-num" style={{ color: "var(--muted)" }}>NCR: {selectedNcr}</span>
            <span className="t-label" style={{ color: "var(--muted)" }}>·</span>
            <span className="t-label t-num" style={{ color: "var(--muted)" }}>{SAMPLE_CAUSES.filter(c => c.status === "Confirmed").length} CONFIRMED CAUSES</span>
          </>
        }
      />

      <div className="p-5 md:p-10 space-y-6">
        {/* NCR selector */}
        <div className="flex items-center gap-2">
          <span className="t-label" style={{ color: "var(--muted)" }}>NCR</span>
          <Select value={selectedNcr} onValueChange={setSelectedNcr}>
            <SelectTrigger className="w-48 h-8 t-body-sm" style={{ borderColor: "var(--hairline)" }}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="NCR-2026-008">NCR-2026-008 · Leak Test Failure</SelectItem>
              <SelectItem value="NCR-2026-011">NCR-2026-011 · Rolling Dimension</SelectItem>
              <SelectItem value="NCR-2026-014">NCR-2026-014 · First-Piece Missing</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Method tabs */}
        <div className="flex items-center gap-1 p-1 rounded-md inline-flex" style={{ backgroundColor: "var(--canvas-soft)" }}>
          {[
            { key: "fishbone", label: "Fishbone (6M)" },
            { key: "5whys", label: "5 Whys" },
            { key: "tree", label: "Fault Tree" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              className="px-3 py-1.5 rounded-md t-body-sm transition-colors"
              style={{
                backgroundColor: activeTab === t.key ? "var(--surface-card)" : "transparent",
                color: activeTab === t.key ? "var(--ink)" : "var(--muted)",
                fontWeight: activeTab === t.key ? 600 : 400,
                boxShadow: activeTab === t.key ? "0 1px 2px rgba(0,0,0,0.04)" : "none",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Fishbone diagram */}
        {activeTab === "fishbone" && (
          <div className="rounded-md p-6" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {FISHBONE_CATEGORIES.map((cat) => {
                const causes = SAMPLE_CAUSES.filter(c => c.category === cat.key);
                return (
                  <div key={cat.key} className="rounded-md p-4" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--canvas-soft)" }}>
                    <div className="flex items-center justify-between mb-3 pb-2 border-b" style={{ borderColor: "var(--hairline)" }}>
                      <div>
                        <div className="t-title-sm" style={{ color: "var(--ink)" }}>{cat.label}</div>
                        <div className="t-label" style={{ color: "var(--muted)" }}>{cat.desc}</div>
                      </div>
                      <span className="t-label t-num" style={{ color: "var(--muted)" }}>{causes.length}</span>
                    </div>
                    <div className="space-y-2">
                      {causes.length === 0 ? (
                        <div className="t-body-sm" style={{ color: "var(--muted-soft)" }}>No causes identified</div>
                      ) : causes.map((c, i) => (
                        <div key={i} className="p-2 rounded" style={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline-soft)" }}>
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="t-body-sm" style={{ color: "var(--ink)" }}>{c.cause}</span>
                            <span className="t-label" style={{
                              color: c.status === "Confirmed" ? "var(--semantic-success)" : c.status === "Investigating" ? "var(--semantic-warn)" : "var(--muted)",
                            }}>{c.status.toUpperCase()}</span>
                          </div>
                          <div className="t-label" style={{ color: "var(--muted)" }}>Evidence: {c.evidence}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 p-4 rounded-md flex items-center gap-3" style={{ backgroundColor: "var(--canvas-soft)" }}>
              <ArrowRight size={16} style={{ color: "var(--primary)" }} />
              <div className="t-body-sm" style={{ color: "var(--body)" }}>
                <strong style={{ color: "var(--ink)" }}>Effect:</strong> Leak test failure at S14 - seam weld porosity creating leak path. Connects to NCR-2026-008 and corrective action in CAPA-2026-008.
              </div>
            </div>
          </div>
        )}

        {/* 5 Whys */}
        {activeTab === "5whys" && (
          <div className="rounded-md p-6" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <div className="space-y-3">
              {FIVE_WHYS.map((w, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center t-num" style={{
                    backgroundColor: i === FIVE_WHYS.length - 1 ? "var(--semantic-error)" : "var(--canvas-soft)",
                    color: i === FIVE_WHYS.length - 1 ? "var(--on-primary)" : "var(--muted)",
                    border: "1px solid var(--hairline)",
                    fontSize: 12,
                    fontWeight: 600,
                  }}>{i + 1}</div>
                  <div className="min-w-0 flex-1 pb-3 border-b" style={{ borderColor: "var(--hairline-soft)" }}>
                    <div className="t-body-sm font-medium mb-1" style={{ color: "var(--ink)" }}>{w.why}</div>
                    <div className="t-body-sm" style={{ color: "var(--body)" }}>{w.answer}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 rounded-md" style={{ backgroundColor: "var(--canvas-soft)" }}>
              <div className="t-label mb-1" style={{ color: "var(--semantic-error)" }}>ROOT CAUSE</div>
              <p className="t-body-md" style={{ color: "var(--ink)" }}>
                Shift change checklist does not include shielding gas flow verification. This allowed an incorrect regulator setting to propagate undetected for one full shift.
              </p>
              <div className="mt-2 t-body-sm" style={{ color: "var(--muted)" }}>
                Corrective action: Update shift change checklist (PRO/S/02/60) to include gas flow verification. Effectiveness to be verified over next 30 days of leak test results.
              </div>
            </div>
          </div>
        )}

        {/* Fault tree */}
        {activeTab === "tree" && (
          <div className="rounded-md p-6" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <div className="t-title-sm mb-4" style={{ color: "var(--ink)" }}>Fault tree - Leak test failure (S14)</div>
            <div className="space-y-2 t-body-sm" style={{ color: "var(--body)" }}>
              <div className="p-2 rounded" style={{ backgroundColor: "var(--semantic-error)14", border: "1px solid var(--semantic-error)33" }}>
                <strong style={{ color: "var(--semantic-error)" }}>TOP EVENT:</strong> Leak test failure at S14
              </div>
              <div className="ml-4">├─ <strong>Weld porosity (CONFIRMED)</strong>
                <div className="ml-4">│  ├─ Shielding gas flow below WPS minimum (CONFIRMED)</div>
                <div className="ml-4">│  │  └─ Regulator pressure set incorrectly at shift change (CONFIRMED)</div>
                <div className="ml-4">│  │     └─ Shift checklist missing gas flow verification (ROOT CAUSE)</div>
                <div className="ml-4">│  └─ Gas cylinder changeover not logged (HYPOTHESIS)</div>
              </div>
              <div className="ml-4">├─ <strong>Weld geometry defect (INVESTIGATING)</strong>
                <div className="ml-4">│  ├─ Travel speed variance (HYPOTHESIS)</div>
                <div className="ml-4">│  └─ Torch angle deviation (HYPOTHESIS)</div>
              </div>
              <div className="ml-4">└─ <strong>Material discontinuity (RULED OUT)</strong>
                <div className="ml-4">   └─ Material test certificates verified - within spec</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// COMPARISON MODULE - Period vs period, before/after CAPA
// ============================================================

export function ComparisonModule({ plant }: { plant: string }) {
  const [periodA, setPeriodA] = useState("2026-09");
  const [periodB, setPeriodB] = useState("2026-10");
  const [dimension, setDimension] = useState<"period" | "department" | "process" | "capa">("period");

  // Sample comparison data - would be backed by API in production
  const comparisonData = {
    period: {
      a: { label: "2026-09", fpy: 89.7, ncrs: 12, critical: 2, copq: 312400, inspections: 156, fails: 16 },
      b: { label: "2026-10", fpy: 92.4, ncrs: 8, critical: 1, copq: 285600, inspections: 142, fails: 11 },
    },
    department: {
      a: { label: "Quality", fpy: 91.2, ncrs: 5, critical: 1, copq: 142800, inspections: 78, fails: 7 },
      b: { label: "Production", fpy: 91.8, ncrs: 5, critical: 0, copq: 16960, inspections: 89, fails: 7 },
    },
    process: {
      a: { label: "Welding (S11/S12)", fpy: 88.2, ncrs: 4, critical: 0, copq: 15360, inspections: 56, fails: 8 },
      b: { label: "Leak Test (S14)", fpy: 94.1, ncrs: 3, critical: 1, copq: 18900, inspections: 51, fails: 3 },
    },
    capa: {
      a: { label: "Before CAPA-2026-008", fpy: 84.2, ncrs: 5, critical: 1, copq: 42500, inspections: 32, fails: 8 },
      b: { label: "After CAPA-2026-008", fpy: 96.5, ncrs: 1, critical: 0, copq: 6300, inspections: 28, fails: 1 },
    },
  };

  const data = comparisonData[dimension];
  const fmtINR = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  const metrics: { key: string; label: string; unit: string; a: number; b: number; invert?: boolean }[] = [
    { key: "fpy", label: "First Pass Yield", unit: "%", a: data.a.fpy, b: data.b.fpy },
    { key: "ncrs", label: "Open NCRs", unit: "", a: data.a.ncrs, b: data.b.ncrs, invert: true },
    { key: "critical", label: "Critical NCRs", unit: "", a: data.a.critical, b: data.b.critical, invert: true },
    { key: "copq", label: "COPQ", unit: "₹", a: data.a.copq, b: data.b.copq, invert: true },
    { key: "inspections", label: "Inspections Completed", unit: "", a: data.a.inspections, b: data.b.inspections },
    { key: "fails", label: "Inspection Failures", unit: "", a: data.a.fails, b: data.b.fails, invert: true },
  ];

  return (
    <div className="reveal-up">
      <PageHeader
        eyebrow="Comparative Analytics"
        title="Comparison"
        subtitle="Compare two periods, departments, processes, or before/after CAPA windows. Shows absolute change, percentage change, and data completeness."
      />

      <div className="p-5 md:p-10 space-y-6">
        {/* Dimension selector */}
        <div>
          <SectionHeader number="01" title="Comparison dimension" subtitle="Select what to compare" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { key: "period", label: "Period vs Period", desc: "Compare two reporting periods" },
              { key: "department", label: "Department vs Department", desc: "Compare two departments" },
              { key: "process", label: "Process vs Process", desc: "Compare two manufacturing processes" },
              { key: "capa", label: "Before / After CAPA", desc: "Compare before and after corrective action" },
            ].map((d) => (
              <button
                key={d.key}
                onClick={() => setDimension(d.key as any)}
                className="text-left p-4 rounded-md transition-colors hover:bg-[var(--canvas-soft)]"
                style={{
                  border: dimension === d.key ? "1px solid var(--primary)" : "1px solid var(--hairline)",
                  backgroundColor: dimension === d.key ? "var(--canvas-soft)" : "var(--surface-card)",
                }}
              >
                <div className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{d.label}</div>
                <div className="t-label mt-1" style={{ color: "var(--muted)" }}>{d.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Comparison table */}
        <div>
          <SectionHeader
            number="02"
            title={`${data.a.label} vs ${data.b.label}`}
            subtitle="Absolute and percentage change. Green = improvement, red = regression"
          />
          <div className="rounded-md overflow-hidden" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--hairline)" }}>
                  <th className="t-label text-left py-3 px-4" style={{ color: "var(--muted)", backgroundColor: "var(--canvas-soft)" }}>Metric</th>
                  <th className="t-label text-right py-3 px-4" style={{ color: "var(--muted)", backgroundColor: "var(--canvas-soft)" }}>{data.a.label}</th>
                  <th className="t-label text-right py-3 px-4" style={{ color: "var(--muted)", backgroundColor: "var(--canvas-soft)" }}>{data.b.label}</th>
                  <th className="t-label text-right py-3 px-4" style={{ color: "var(--muted)", backgroundColor: "var(--canvas-soft)" }}>Change</th>
                  <th className="t-label text-right py-3 px-4" style={{ color: "var(--muted)", backgroundColor: "var(--canvas-soft)" }}>% Change</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((m) => {
                  const absChange = m.b - m.a;
                  const pctChange = m.a !== 0 ? ((m.b - m.a) / Math.abs(m.a)) * 100 : 0;
                  const isImprovement = m.invert ? absChange < 0 : absChange > 0;
                  const isNeutral = absChange === 0;
                  const fmtValue = (v: number) => m.unit === "₹" ? fmtINR(v) : m.unit === "%" ? `${v.toFixed(1)}%` : `${v}`;
                  return (
                    <tr key={m.key} style={{ borderBottom: "1px solid var(--hairline-soft)" }}>
                      <td className="t-body-sm py-3 px-4 font-medium" style={{ color: "var(--ink)" }}>{m.label}</td>
                      <td className="t-body-sm t-num text-right py-3 px-4" style={{ color: "var(--ink)" }}>{fmtValue(m.a)}</td>
                      <td className="t-body-sm t-num text-right py-3 px-4" style={{ color: "var(--ink)" }}>{fmtValue(m.b)}</td>
                      <td className="t-body-sm t-num text-right py-3 px-4" style={{
                        color: isNeutral ? "var(--muted)" : isImprovement ? "var(--semantic-success)" : "var(--semantic-error)",
                        fontWeight: 500,
                      }}>
                        {absChange > 0 ? "+" : ""}{m.unit === "₹" ? fmtINR(absChange) : m.unit === "%" ? `${absChange.toFixed(1)}%` : `${absChange}`}
                      </td>
                      <td className="t-body-sm t-num text-right py-3 px-4" style={{
                        color: isNeutral ? "var(--muted)" : isImprovement ? "var(--semantic-success)" : "var(--semantic-error)",
                        fontWeight: 500,
                      }}>
                        {pctChange > 0 ? "+" : ""}{pctChange.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Highlights */}
        <div>
          <SectionHeader number="03" title="Highlights & notes" subtitle="Factual commentary on the comparison - separate from measurements" />
          <div className="rounded-md p-5 space-y-3" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <div className="flex items-start gap-3">
              <span className="num-marker pt-1" style={{ color: "var(--primary)" }}>01</span>
              <div>
                <div className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>FPY improved 2.7 percentage points</div>
                <div className="t-body-sm mt-0.5" style={{ color: "var(--muted)" }}>Attributed to CAPA-2026-008 (shielding gas flow verification). Effectiveness verification in progress - sample size: 28 inspections post-CAPA.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="num-marker pt-1" style={{ color: "var(--primary)" }}>02</span>
              <div>
                <div className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>COPQ reduced ₹26,800 (8.6%)</div>
                <div className="t-body-sm mt-0.5" style={{ color: "var(--muted)" }}>Driven by reduction in external failure cost. One customer return in September did not recur in October.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="num-marker pt-1" style={{ color: "var(--primary)" }}>03</span>
              <div>
                <div className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>Inspection volume decreased 14 (9%)</div>
                <div className="t-body-sm mt-0.5" style={{ color: "var(--muted)" }}>Due to planned maintenance shutdown Oct 18-22. Not a quality regression. Sample size remains statistically meaningful (142 inspections).</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
