// Shared QMS types and helpers

export type ModuleKey =
  | "dashboard"
  | "process"
  | "workorders"
  | "inspection"
  | "ncr"
  | "fmea"
  | "documents"
  | "traceability"
  | "analytics";

export interface ModuleDef {
  key: ModuleKey;
  label: string;
  short: string;
  icon: string; // lucide icon name
  description: string;
}

export const MODULES: ModuleDef[] = [
  { key: "dashboard",    label: "Control Tower",         short: "Tower",     icon: "LayoutDashboard", description: "Live quality, risk and operations overview." },
  { key: "process",      label: "Process Designer",      short: "Process",   icon: "Workflow",        description: "Manufacturing routes, stages, characteristics and quality gates." },
  { key: "workorders",   label: "Work Orders",           short: "WOs",       icon: "ClipboardList",   description: "Sales-order driven production plan with material status and routing." },
  { key: "inspection",   label: "Digital Inspection",    short: "Inspect",   icon: "ClipboardCheck",  description: "Stage-wise inspection forms with CTQ acceptance criteria and auto-NCR." },
  { key: "ncr",          label: "Nonconformance & CAPA", short: "NCR",       icon: "AlertTriangle",   description: "Containment, root cause, corrective action and effectiveness verification." },
  { key: "fmea",         label: "FMEA & Risk",           short: "FMEA",      icon: "ShieldAlert",     description: "Failure modes linked to controls and inspections. RPN prioritisation." },
  { key: "documents",    label: "Document Control",      short: "Docs",      icon: "FileText",        description: "QCI/F and PRO/F controlled forms with revision status and review dates." },
  { key: "traceability", label: "Traceability",          short: "Trace",     icon: "Network",         description: "Material → Work Order → Process → Inspection → Release genealogy." },
  { key: "analytics",    label: "Quality Analytics",     short: "Analytics", icon: "BarChart3",       description: "FPY trends, Pareto of defects, stage yields and route summary." },
];

export function statusColor(status: string): string {
  const s = status.toLowerCase();
  if (["pass", "accepted", "completed", "released", "closed", "active", "ok", "calibrated"].includes(s)) return "#0e3030";
  if (["fail", "rejected", "critical", "on hold", "obsolete", "overdue", "not available"].includes(s)) return "#b91c1c";
  if (["hold", "pending", "investigating", "under review", "draft", "due soon", "partial", "in review"].includes(s)) return "#c2410c";
  if (["in progress", "contained", "capa-open", "effectiveness-check", "action-verified", "open"].includes(s)) return "#1b1938";
  return "#73706d";
}

export function statusBg(status: string): string {
  const c = statusColor(status);
  return `${c}14`;
}

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(d: string | Date | null | undefined): string {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) + " · " + date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function pct(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`;
}
