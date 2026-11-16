"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  AlertTriangle, TrendingDown, ShieldAlert, Clock, Wrench,
  ArrowRight, Loader2, RefreshCw, Activity, Lock,
} from "lucide-react";

// =========================================================================
// VIEW B: Quality Manager Control Tower (Dashboard)
// =========================================================================
// Design rules:
// - Exception-Based Management: surface ONLY anomalies, not passing metrics
// - Swiss-inspired industrial design: high contrast, minimal decoration
// - Status colors: Red=Hold/Fail, Green=Pass, Yellow=Indeterminate
// - Active Exceptions panel is the primary focus
// =========================================================================

// ─── Types (matching API contract) ────────────────────────────────────────

interface FpyData {
  plantFpy: number;
  plantTarget: number;
  variance: number;
  trend14d: { date: string; fpy: number }[];
  stageBreakdown: { stageCode: string; stageName: string; fpy: number; totalUnits: number; failedUnits: number }[];
}

interface CriticalNcr {
  ncrNumber: string;
  severity: "CRITICAL";
  status: string;
  defectCategory: string;
  htuSerialNo: string;
  workOrderNo: string;
  customerName: string;
  stageCode: string;
  stageName: string;
  openedAt: string;
  ageHours: number;
  containmentAction: string;
  awaitingDisposition: boolean;
}

interface FpyDrop {
  stageCode: string;
  stageName: string;
  currentFpy: number;
  previousFpy: number;
  drop: number;
  affectedHtuCount: number;
  topDefect: string;
}

interface GateBlock {
  htuSerialNo: string;
  workOrderNo: string;
  stageCode: string;
  stageName: string;
  blockReason: string;
  blockedSince: string;
  blockedDurationHours: number;
}

interface OverdueCapa {
  ncrNumber: string;
  capaOwnerName: string;
  dueDate: string;
  daysOverdue: number;
  severity: "CRITICAL" | "MAJOR" | "MINOR";
}

interface InstrumentAlert {
  assetTag: string;
  instrumentCategory: string;
  status: "EXPIRED" | "DUE_SOON";
  calibrationDueDate: string;
  affectedStage: string;
}

interface ExceptionsResponse {
  timestamp: string;
  plantCode: string;
  shiftCode: string;
  fpy: FpyData;
  criticalNcrs: CriticalNcr[];
  fpyDrops: FpyDrop[];
  gateBlocks: GateBlock[];
  overdueCapas: OverdueCapa[];
  instrumentAlerts: InstrumentAlert[];
}

// ─── Component ────────────────────────────────────────────────────────────

export function ControlTowerDashboard() {
  const [data, setData] = useState<ExceptionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExceptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v2/dashboard/exceptions?plant=K2");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message || "Failed to load exceptions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExceptions();
    const interval = setInterval(fetchExceptions, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen" style={{ backgroundColor: "#ffffff" }}>
        <Loader2 size={32} className="animate-spin mb-3" style={{ color: "#083260" }} />
        <div className="text-sm" style={{ color: "#6b7280" }}>Loading Control Tower...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen" style={{ backgroundColor: "#ffffff" }}>
        <AlertTriangle size={32} className="mb-3" style={{ color: "#dc2626" }} />
        <div className="text-sm mb-4" style={{ color: "#dc2626" }}>{error || "No data"}</div>
        <button onClick={fetchExceptions} className="h-10 px-4 rounded-lg text-sm font-medium" style={{ backgroundColor: "#083260", color: "#ffffff" }}>
          Retry
        </button>
      </div>
    );
  }

  const fpyBelowTarget = data.fpy.variance < 0;
  const totalExceptions = data.criticalNcrs.length + data.fpyDrops.length + data.gateBlocks.length + data.overdueCapas.length + data.instrumentAlerts.length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#fafafa" }}>
      {/* ─── Header ─── */}
      <div className="sticky top-0 z-10 border-b" style={{ borderColor: "#e5e7eb", backgroundColor: "#083260" }}>
        <div className="flex items-center justify-between px-8 py-4">
          <div className="flex items-center gap-6">
            <div className="text-white">
              <div className="text-xs uppercase tracking-wider opacity-60">HIVE Control Tower</div>
              <div className="text-xl font-semibold">K2 Plant - Quality Manager Dashboard</div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
              <div className={cn("w-2 h-2 rounded-full", totalExceptions > 0 ? "animate-pulse" : "")} style={{ backgroundColor: totalExceptions > 0 ? "#fbbf24" : "#10b981" }} />
              <span className="text-xs font-medium text-white uppercase tracking-wider">
                {totalExceptions > 0 ? `${totalExceptions} Active Exceptions` : "All Clear"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-white text-right">
              <div className="text-xs opacity-60 uppercase tracking-wider">Shift {data.shiftCode}</div>
              <div className="text-sm font-mono">{new Date(data.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</div>
            </div>
            <button onClick={fetchExceptions} className="p-2 rounded-lg transition-colors hover:bg-white/10">
              <RefreshCw size={18} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Content ─── */}
      <div className="max-w-7xl mx-auto p-8 space-y-6">
        {/* ── Exception Summary Strip ── */}
        <div className="grid grid-cols-5 gap-4">
          <ExceptionCounter
            label="Critical NCRs"
            count={data.criticalNcrs.length}
            icon={<ShieldAlert size={20} />}
            color="#dc2626"
            bgColor="#fef2f2"
          />
          <ExceptionCounter
            label="FPY Drops"
            count={data.fpyDrops.length}
            icon={<TrendingDown size={20} />}
            color="#d97706"
            bgColor="#fffbeb"
          />
          <ExceptionCounter
            label="Gate Blocks"
            count={data.gateBlocks.length}
            icon={<Lock size={20} />}
            color="#dc2626"
            bgColor="#fef2f2"
          />
          <ExceptionCounter
            label="Overdue CAPAs"
            count={data.overdueCapas.length}
            icon={<Clock size={20} />}
            color="#dc2626"
            bgColor="#fef2f2"
          />
          <ExceptionCounter
            label="Instrument Alerts"
            count={data.instrumentAlerts.length}
            icon={<Wrench size={20} />}
            color="#d97706"
            bgColor="#fffbeb"
          />
        </div>

        {/* ── FPY KPI Card ── */}
        <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #e5e7eb", backgroundColor: "#ffffff" }}>
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#e5e7eb" }}>
            <div className="flex items-center gap-3">
              <Activity size={20} style={{ color: "#083260" }} />
              <h2 className="text-base font-semibold" style={{ color: "#111827" }}>First Pass Yield (FPY)</h2>
            </div>
            <div className={cn("text-xs font-bold px-2 py-1 rounded uppercase tracking-wider")}
              style={{
                backgroundColor: fpyBelowTarget ? "#fef2f2" : "#f0fdf4",
                color: fpyBelowTarget ? "#dc2626" : "#159640",
              }}
            >
              {fpyBelowTarget ? `${data.fpy.variance} vs Target` : "On Target"}
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-end gap-8">
              {/* Big number */}
              <div>
                <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "#6b7280" }}>Plant FPY</div>
                <div className="text-5xl font-bold" style={{ color: fpyBelowTarget ? "#dc2626" : "#159640" }}>
                  {data.fpy.plantFpy}%
                </div>
              </div>
              <div className="pb-2">
                <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "#6b7280" }}>Target</div>
                <div className="text-2xl font-mono" style={{ color: "#6b7280" }}>{data.fpy.plantTarget}%</div>
              </div>
              <div className="pb-2">
                <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "#6b7280" }}>Variance</div>
                <div className="text-2xl font-mono" style={{ color: fpyBelowTarget ? "#dc2626" : "#159640" }}>
                  {data.fpy.variance > 0 ? "+" : ""}{data.fpy.variance}
                </div>
              </div>
              {/* Mini sparkline */}
              <div className="flex-1 pb-2">
                <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "#6b7280" }}>14-Day Trend</div>
                <div className="flex items-end gap-1 h-12">
                  {data.fpy.trend14d.map((point, i) => {
                    const height = Math.max(4, (point.fpy / 100) * 48);
                    const isLow = point.fpy < data.fpy.plantTarget;
                    return (
                      <div
                        key={i}
                        className="flex-1 rounded-sm transition-colors"
                        style={{
                          height: `${height}px`,
                          backgroundColor: isLow ? "#dc2626" : "#159640",
                          opacity: i === data.fpy.trend14d.length - 1 ? 1 : 0.4 + (i / data.fpy.trend14d.length) * 0.6,
                        }}
                        title={`${point.date}: ${point.fpy}%`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Stage breakdown (below-target stages only) */}
            {data.fpy.stageBreakdown.length > 0 && (
              <div className="mt-6 pt-4 border-t" style={{ borderColor: "#f3f4f6" }}>
                <div className="text-xs uppercase tracking-wider mb-3" style={{ color: "#6b7280" }}>Stages Below Target</div>
                <div className="space-y-2">
                  {data.fpy.stageBreakdown.slice(0, 5).map(stage => (
                    <div key={stage.stageCode} className="flex items-center gap-4">
                      <div className="w-32 text-sm font-medium" style={{ color: "#374151" }}>{stage.stageName}</div>
                      <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ backgroundColor: "#f3f4f6" }}>
                        <div
                          className="h-full rounded-full flex items-center justify-end px-2"
                          style={{
                            width: `${stage.fpy}%`,
                            backgroundColor: stage.fpy < 85 ? "#dc2626" : stage.fpy < 95 ? "#d97706" : "#159640",
                          }}
                        >
                          <span className="text-xs font-bold text-white">{stage.fpy}%</span>
                        </div>
                      </div>
                      <div className="text-xs font-mono w-24 text-right" style={{ color: "#6b7280" }}>
                        {stage.failedUnits}/{stage.totalUnits} fail
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Critical NCRs Table ── */}
        <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #e5e7eb", backgroundColor: "#ffffff" }}>
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#e5e7eb", backgroundColor: "#fef2f2" }}>
            <div className="flex items-center gap-3">
              <ShieldAlert size={20} style={{ color: "#dc2626" }} />
              <h2 className="text-base font-semibold" style={{ color: "#111827" }}>Critical NCRs Awaiting Disposition</h2>
            </div>
            <span className="text-sm font-bold" style={{ color: "#dc2626" }}>{data.criticalNcrs.filter(n => n.awaitingDisposition).length} awaiting</span>
          </div>
          {data.criticalNcrs.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <CheckCircleLarge />
              <div className="text-sm mt-2" style={{ color: "#6b7280" }}>No critical NCRs. All clear.</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: "#6b7280" }}>NCR</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: "#6b7280" }}>HTU</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: "#6b7280" }}>WO / Customer</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: "#6b7280" }}>Stage</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: "#6b7280" }}>Defect</th>
                    <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: "#6b7280" }}>Age</th>
                    <th className="text-center px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: "#6b7280" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.criticalNcrs.map(ncr => (
                    <tr
                      key={ncr.ncrNumber}
                      className="transition-colors hover:bg-gray-50"
                      style={{ borderBottom: "1px solid #f3f4f6" }}
                    >
                      <td className="px-4 py-3">
                        <div className="font-mono text-sm font-bold" style={{ color: "#dc2626" }}>{ncr.ncrNumber}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-sm" style={{ color: "#111827" }}>{ncr.htuSerialNo}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium" style={{ color: "#111827" }}>{ncr.workOrderNo}</div>
                        <div className="text-xs" style={{ color: "#6b7280" }}>{ncr.customerName}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm" style={{ color: "#111827" }}>{ncr.stageName}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm" style={{ color: "#111827" }}>{ncr.defectCategory}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className={cn("text-sm font-mono font-bold", ncr.ageHours > 24 && "text-red-600")}
                          style={{ color: ncr.ageHours > 24 ? "#dc2626" : "#374151" }}
                        >
                          {ncr.ageHours}h
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className="inline-block text-xs font-bold px-2 py-1 rounded uppercase tracking-wider"
                          style={{
                            backgroundColor: ncr.awaitingDisposition ? "#fee2e2" : "#fef3c7",
                            color: ncr.awaitingDisposition ? "#dc2626" : "#92400e",
                          }}
                        >
                          {ncr.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Gate Blocks + Overdue CAPAs (side by side) ── */}
        <div className="grid grid-cols-2 gap-6">
          {/* Gate Blocks */}
          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #e5e7eb", backgroundColor: "#ffffff" }}>
            <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: "#e5e7eb", backgroundColor: "#fef2f2" }}>
              <Lock size={18} style={{ color: "#dc2626" }} />
              <h2 className="text-sm font-semibold" style={{ color: "#111827" }}>Gate Blocks</h2>
              <span className="text-xs ml-auto" style={{ color: "#dc2626" }}>{data.gateBlocks.length} HTUs blocked</span>
            </div>
            <div className="divide-y" style={{ borderColor: "#f3f4f6" }}>
              {data.gateBlocks.length === 0 ? (
                <div className="px-6 py-8 text-center text-sm" style={{ color: "#6b7280" }}>No gate blocks.</div>
              ) : (
                data.gateBlocks.map((block, i) => (
                  <div key={i} className="px-6 py-3 flex items-center justify-between">
                    <div>
                      <div className="font-mono text-sm font-bold" style={{ color: "#111827" }}>{block.htuSerialNo}</div>
                      <div className="text-xs" style={{ color: "#6b7280" }}>{block.workOrderNo} · {block.stageName}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold uppercase" style={{ color: "#dc2626" }}>{block.blockReason}</div>
                      <div className="text-xs font-mono" style={{ color: "#6b7280" }}>{block.blockedDurationHours}h blocked</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Overdue CAPAs */}
          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #e5e7eb", backgroundColor: "#ffffff" }}>
            <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: "#e5e7eb", backgroundColor: "#fef2f2" }}>
              <Clock size={18} style={{ color: "#dc2626" }} />
              <h2 className="text-sm font-semibold" style={{ color: "#111827" }}>Overdue CAPAs</h2>
              <span className="text-xs ml-auto" style={{ color: "#dc2626" }}>{data.overdueCapas.length} overdue</span>
            </div>
            <div className="divide-y" style={{ borderColor: "#f3f4f6" }}>
              {data.overdueCapas.length === 0 ? (
                <div className="px-6 py-8 text-center text-sm" style={{ color: "#6b7280" }}>No overdue CAPAs.</div>
              ) : (
                data.overdueCapas.map((capa, i) => (
                  <div key={i} className="px-6 py-3 flex items-center justify-between">
                    <div>
                      <div className="font-mono text-sm font-bold" style={{ color: "#111827" }}>{capa.ncrNumber}</div>
                      <div className="text-xs" style={{ color: "#6b7280" }}>Owner: {capa.capaOwnerName}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold" style={{ color: capa.daysOverdue > 3 ? "#dc2626" : "#d97706" }}>
                        {capa.daysOverdue}d overdue
                      </div>
                      <div className="text-xs font-mono" style={{ color: "#6b7280" }}>{capa.severity}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Instrument Alerts ── */}
        {data.instrumentAlerts.length > 0 && (
          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #e5e7eb", backgroundColor: "#ffffff" }}>
            <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: "#e5e7eb", backgroundColor: "#fffbeb" }}>
              <Wrench size={18} style={{ color: "#d97706" }} />
              <h2 className="text-sm font-semibold" style={{ color: "#111827" }}>Instrument Calibration Alerts</h2>
            </div>
            <div className="divide-y" style={{ borderColor: "#f3f4f6" }}>
              {data.instrumentAlerts.map((alert, i) => (
                <div key={i} className="px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="font-mono text-sm font-bold" style={{ color: "#111827" }}>{alert.assetTag}</div>
                    <div className="text-sm" style={{ color: "#6b7280" }}>{alert.instrumentCategory}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm" style={{ color: "#6b7280" }}>{alert.affectedStage}</div>
                    <span
                      className="text-xs font-bold px-2 py-1 rounded uppercase tracking-wider"
                      style={{
                        backgroundColor: alert.status === "EXPIRED" ? "#fee2e2" : "#fef3c7",
                        color: alert.status === "EXPIRED" ? "#dc2626" : "#92400e",
                      }}
                    >
                      {alert.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helper Components ────────────────────────────────────────────────────

function ExceptionCounter({ label, count, icon, color, bgColor }: {
  label: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}) {
  return (
    <div
      className="rounded-lg p-4 flex items-center gap-4 transition-colors"
      style={{ backgroundColor: count > 0 ? bgColor : "#f9fafb", border: `1px solid ${count > 0 ? color : "#e5e7eb"}` }}
    >
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: count > 0 ? color : "#e5e7eb" }}>
        <span style={{ color: count > 0 ? "#ffffff" : "#9ca3af" }}>{icon}</span>
      </div>
      <div>
        <div className="text-2xl font-bold" style={{ color: count > 0 ? color : "#9ca3af" }}>{count}</div>
        <div className="text-xs uppercase tracking-wider" style={{ color: "#6b7280" }}>{label}</div>
      </div>
    </div>
  );
}

function CheckCircleLarge() {
  return (
    <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: "#f0fdf4" }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#159640" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
  );
}
