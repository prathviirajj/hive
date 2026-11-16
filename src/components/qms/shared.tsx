"use client";

import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2, XCircle, AlertCircle, Clock, MinusCircle,
  ChevronUp, ChevronDown, Search, X,
} from "lucide-react";

// ============================================================
// Status Badge - Swiss minimal: dot + text, no fill
// ============================================================
export function StatusBadge({ status, size = "sm" }: { status: string; size?: "sm" | "xs" }) {
  const s = status.toLowerCase();
  const cfg =
    s === "pass" || s === "accepted" || s === "completed" || s === "released" || s === "closed" || s === "active" || s === "ok" || s === "calibrated" || s === "verified"
      ? { color: "#4a7c5e", icon: <CheckCircle2 size={size === "xs" ? 9 : 10} /> }
    : s === "fail" || s === "rejected" || s === "critical" || s === "obsolete" || s === "overdue" || s === "not available" || s === "on hold"
      ? { color: "#a04545", icon: <XCircle size={size === "xs" ? 9 : 10} /> }
    : s === "hold" || s === "pending" || s === "investigating" || s === "under review" || s === "draft" || s === "due soon" || s === "partial" || s === "in review" || s === "contained" || s === "capa-open" || s === "effectiveness-check"
      ? { color: "#8a6a3a", icon: <AlertCircle size={size === "xs" ? 9 : 10} /> }
    : s === "in progress" || s === "open" || s === "action-verified"
      ? { color: "#1c3d5a", icon: <Clock size={size === "xs" ? 9 : 10} /> }
    : { color: "#71717a", icon: <MinusCircle size={size === "xs" ? 9 : 10} /> };

  return (
    <span
      className={cn("inline-flex items-center gap-1.5 whitespace-nowrap", size === "xs" ? "py-0" : "py-0.5")}
      style={{ color: cfg.color, fontSize: size === "xs" ? 11 : 12, fontWeight: 500, letterSpacing: "-0.005em" }}
    >
      {cfg.icon}
      {status}
    </span>
  );
}

export function ResultBadge({ result }: { result: string }) {
  const r = result.toLowerCase();
  const cfg =
    r === "pass" ? { color: "#4a7c5e", icon: <CheckCircle2 size={11} /> }
    : r === "fail" ? { color: "#a04545", icon: <XCircle size={11} /> }
    : r === "hold" ? { color: "#8a6a3a", icon: <AlertCircle size={11} /> }
    : { color: "#71717a", icon: <Clock size={11} /> };
  return (
    <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: cfg.color, fontSize: 12, fontWeight: 500 }}>
      {cfg.icon}{result}
    </span>
  );
}

// ============================================================
// Card - Swiss: white on white, hairline only, no shadow
// ============================================================
export function Card2({ children, className, onClick, style }: { children: ReactNode; className?: string; onClick?: () => void; style?: React.CSSProperties }) {
  return (
    <div
      onClick={onClick}
      className={cn("rounded-md", onClick && "cursor-pointer transition-colors")}
      style={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline)", ...style }}
    >
      {children}
    </div>
  );
}

// ============================================================
// Page Header - Swiss editorial, generous whitespace, eyebrow + title + meta
// ============================================================

// HelpTrigger provides the "?" popup for contextual help.
// Only one "?" icon is shown per title — no duplicate short tooltip.
import { HelpTrigger } from "@/components/qms/contextual-help";
// useState already imported at top of file

export function PageHeader({ eyebrow, title, subtitle, action, meta, info, helpId }: { eyebrow?: string; title: string; subtitle?: string; action?: ReactNode; meta?: ReactNode; info?: string; helpId?: string }) {
  const fallbackContent = !helpId && info ? {
    id: `hdr.${title.toLowerCase().replace(/\s+/g, "-")}`,
    title: `${title} Overview`,
    short: info,
    detail: subtitle || info,
    why: "Standardizes quality compliance, shopfloor execution, and verifiable traceability across all radiator production lines.",
  } : undefined;

  return (
    <div className="px-5 md:px-10 pt-8 md:pt-12 pb-6 border-b" style={{ borderColor: "var(--hairline)" }}>
      <div className="max-w-5xl">
        {eyebrow && (
          <div className="t-label mb-3" style={{ color: "var(--primary)" }}>{eyebrow}</div>
        )}
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="min-w-0 flex-1">
            <h1 className="t-display-md inline-flex items-center" style={{ color: "var(--ink)" }}>
              {title}
              {/* Single informative, visual help trigger — no duplicate short tooltips */}
              {(helpId || fallbackContent) && (
                <HelpTrigger contentId={helpId} inlineContent={fallbackContent} size={16} />
              )}
            </h1>
            {subtitle && <p className="t-body-md mt-3" style={{ color: "var(--body)", maxWidth: "68ch" }}>{subtitle}</p>}
            {meta && <div className="mt-4 flex items-center gap-4 flex-wrap">{meta}</div>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Empty State
// ============================================================
export function EmptyState({ message, hint }: { message: string; hint?: string }) {
  return (
    <div className="py-20 text-center">
      <div className="t-body-md" style={{ color: "var(--muted)" }}>{message}</div>
      {hint && <div className="t-body-sm mt-1.5" style={{ color: "var(--muted-soft)" }}>{hint}</div>}
    </div>
  );
}

export function LoadingBlock({ label = "Loading" }: { label?: string }) {
  return (
    <div className="h-64 flex flex-col items-center justify-center gap-3">
      <div className="w-3.5 h-3.5 border-2 rounded-full spin-slow" style={{ borderColor: "var(--hairline)", borderTopColor: "var(--primary)" }} />
      <div className="t-label" style={{ color: "var(--muted)" }}>{label}</div>
    </div>
  );
}

// ============================================================
// Sortable, Responsive Table - Swiss hairline grid
// ============================================================
export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  mobileLabel?: string;
  hideOnMobile?: boolean;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  className?: string;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  onRowClick,
  emptyMessage = "No records found.",
  mobileCardRender,
  defaultSort,
}: {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  mobileCardRender?: (row: T) => ReactNode;
  defaultSort?: { key: string; dir: "asc" | "desc" };
}) {
  const [sortKey, setSortKey] = useState<string | null>(defaultSort?.key || null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(defaultSort?.dir || "asc");

  const sorted = [...data];
  if (sortKey) {
    const col = columns.find(c => c.key === sortKey);
    if (col?.sortValue) {
      sorted.sort((a, b) => {
        const av = col.sortValue!(a);
        const bv = col.sortValue!(b);
        if (av < bv) return sortDir === "asc" ? -1 : 1;
        if (av > bv) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }
  }

  const toggleSort = (key: string) => {
    const col = columns.find(c => c.key === key);
    if (!col?.sortable) return;
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  if (sorted.length === 0) return <EmptyState message={emptyMessage} />;

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto scroll-fine">
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--hairline)" }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className={cn("t-label text-left py-2.5 px-4", col.sortable && "cursor-pointer select-none hover:bg-[var(--canvas-soft)]")}
                  style={{ color: "var(--muted)", fontWeight: 600, backgroundColor: "var(--canvas-soft)" }}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortKey === col.key && (sortDir === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={cn(onRowClick && "cursor-pointer transition-colors hover:bg-[var(--canvas-soft)]")}
                style={{ borderBottom: "1px solid var(--hairline-soft)" }}
              >
                {columns.map((col) => (
                  <td key={col.key} className="t-body-sm py-3 px-4" style={{ color: "var(--ink)" }}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y" style={{ borderColor: "var(--hairline)" }}>
        {sorted.map((row) => (
          <div
            key={row.id}
            onClick={() => onRowClick?.(row)}
            className={cn("p-4", onRowClick && "cursor-pointer")}
            style={{ backgroundColor: "var(--surface-card)" }}
          >
            {mobileCardRender ? mobileCardRender(row) : (
              <div className="space-y-2">
                {columns.filter(c => !c.hideOnMobile).slice(0, 4).map((col) => (
                  <div key={col.key} className="flex items-start justify-between gap-3">
                    <span className="t-label shrink-0 pt-0.5" style={{ color: "var(--muted)" }}>
                      {col.mobileLabel || col.header}
                    </span>
                    <span className="t-body-sm text-right" style={{ color: "var(--ink)" }}>
                      {col.render(row)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

// ============================================================
// Stat Card - Swiss minimal: large number, small label, no decoration
// ============================================================
export function StatCard({ label, value, sublabel, tone = "neutral", icon, unit }: { label: string; value: string | number; sublabel?: string; tone?: "neutral" | "ok" | "warn" | "risk"; icon?: ReactNode; unit?: string }) {
  const colors = { neutral: "var(--ink)", ok: "var(--semantic-success)", warn: "var(--semantic-warn)", risk: "var(--semantic-error)" };
  return (
    <div className="rounded-md p-5 transition-colors" style={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="t-label" style={{ color: "var(--muted)" }}>{label}</div>
        {icon && <div style={{ color: "var(--muted-soft)" }}>{icon}</div>}
      </div>
      <div className="flex items-baseline gap-1">
        <div className="t-display-sm t-num" style={{ color: colors[tone], fontWeight: 400 }}>{value}</div>
        {unit && <div className="t-body-sm" style={{ color: "var(--muted)" }}>{unit}</div>}
      </div>
      {sublabel && <div className="t-body-sm mt-2" style={{ color: "var(--muted)" }}>{sublabel}</div>}
    </div>
  );
}

export function DetailRow({ label, value, mono, tooltip }: { label: string; value: string | null | undefined; mono?: boolean; tooltip?: string }) {
  return (
    <div {...(tooltip ? { "data-tooltip": tooltip, "data-tooltip-pos": "top" } : {})}>
      <div className="t-label mb-1" style={{ color: "var(--muted)" }}>{label}</div>
      <div className={cn("t-body-sm font-medium", mono && "t-code")} style={{ color: "var(--ink)" }}>{value || "-"}</div>
    </div>
  );
}

export function FilterBar({ children, count, label = "records" }: { children: ReactNode; count?: number; label?: string }) {
  return (
    <div className="flex items-center gap-2 flex-wrap px-5 md:px-10 py-3.5 border-b" style={{ borderColor: "var(--hairline)" }}>
      {children}
      {count !== undefined && (
        <div className="ml-auto t-body-sm t-num" style={{ color: "var(--muted)" }}>{count} {label}</div>
      )}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder, className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 pl-9 pr-8 rounded-md t-body-sm outline-none transition-colors focus:border-[var(--primary)]"
        style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)", color: "var(--ink)" }}
      />
      {value && (
        <button onClick={() => onChange("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
          <X size={14} style={{ color: "var(--muted)" }} />
        </button>
      )}
    </div>
  );
}

// ============================================================
// Date helpers
// ============================================================
export function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function fmtDateTime(d: string | Date | null | undefined): string {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) + " · " + date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function pct(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`;
}

// ============================================================
// Section Divider - Swiss numbered section header
// ============================================================
export function SectionHeader({ number, title, subtitle, action }: { number?: string; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div className="flex items-start gap-3">
        {number && <span className="num-marker pt-1.5">{number}</span>}
        <div>
          <h2 className="t-title-md" style={{ color: "var(--ink)" }}>{title}</h2>
          {subtitle && <p className="t-body-sm mt-0.5" style={{ color: "var(--muted)" }}>{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
