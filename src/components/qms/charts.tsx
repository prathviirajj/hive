"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ReferenceLine, ComposedChart, PolarAngleAxis as PAA,
} from "recharts";
import { EmptyState, LoadingBlock } from "./shared";

const COLORS = ["#1c3d5a", "#4a7c5e", "#8a6a3a", "#a04545", "#5a5a8a", "#71717a", "#9fbbe0", "#c0a8dd"];
const PRIMARY = "#1c3d5a";

// ============================================================
// Generic chart wrapper with title
// ============================================================
export function ChartCard({ title, subtitle, children, action }: { title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl p-5" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="t-display-sm" style={{ color: "var(--ink)" }}>{title}</h3>
          {subtitle && <p className="t-body-sm" style={{ color: "var(--muted)" }}>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ============================================================
// Pie Chart
// ============================================================
export function PieChartView({ data, dataKey = "value", nameKey = "label", height = 250 }: {
  data: { label: string; value: number }[];
  dataKey?: string; nameKey?: string; height?: number;
}) {
  if (!data || data.length === 0) return <EmptyState message="No data" />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey={dataKey} nameKey={nameKey} cx="50%" cy="50%" outerRadius={80} innerRadius={40} label={(e: any) => `${e.label}: ${e.value}`}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline)", borderRadius: 8, fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ============================================================
// Bar Chart
// ============================================================
export function BarChartView({ data, keys, xKey = "label", height = 280, stacked = false }: {
  data: any[]; keys: { key: string; color: string; name: string }[]; xKey?: string; height?: number; stacked?: boolean;
}) {
  if (!data || data.length === 0) return <EmptyState message="No data" />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={{ stroke: "var(--hairline)" }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline)", borderRadius: 8, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {keys.map((k) => (
          <Bar key={k.key} dataKey={k.key} name={k.name} fill={k.color} stackId={stacked ? "a" : undefined} radius={[2, 2, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ============================================================
// Line Chart
// ============================================================
export function LineChartView({ data, lines, xKey = "date", height = 280 }: {
  data: any[]; lines: { key: string; color: string; name: string }[]; xKey?: string; height?: number;
}) {
  if (!data || data.length === 0) return <EmptyState message="No data" />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 10, fill: "var(--muted)" }} axisLine={{ stroke: "var(--hairline)" }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline)", borderRadius: 8, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {lines.map((l) => (
          <Line key={l.key} type="monotone" dataKey={l.key} name={l.name} stroke={l.color} strokeWidth={1.5} dot={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ============================================================
// Area Chart
// ============================================================
export function AreaChartView({ data, areas, xKey = "date", height = 280 }: {
  data: any[]; areas: { key: string; color: string; name: string }[]; xKey?: string; height?: number;
}) {
  if (!data || data.length === 0) return <EmptyState message="No data" />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          {areas.map((a) => (
            <linearGradient key={a.key} id={`grad-${a.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={a.color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={a.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 10, fill: "var(--muted)" }} axisLine={{ stroke: "var(--hairline)" }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline)", borderRadius: 8, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {areas.map((a) => (
          <Area key={a.key} type="monotone" dataKey={a.key} name={a.name} stroke={a.color} fill={`url(#grad-${a.key})`} strokeWidth={1.5} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ============================================================
// Scatter Chart (FMEA Risk Matrix)
// ============================================================
export function ScatterChartView({ data, xLabel, yLabel, xMax, yMax, height = 320 }: {
  data: { x: number; y: number; z: number; label: string; id: string; stage: string }[];
  xLabel: string; yLabel: string; xMax: number; yMax: number; height?: number;
}) {
  if (!data || data.length === 0) return <EmptyState message="No data" />;
  const getColor = (z: number) => z >= 150 ? "#b85569" : z >= 80 ? "#a07840" : "#4a8a6e";
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" />
        <XAxis type="number" dataKey="x" name={xLabel} domain={[0, xMax]} tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={{ stroke: "var(--hairline)" }} label={{ value: xLabel, position: "bottom", fontSize: 11, fill: "var(--muted)" }} />
        <YAxis type="number" dataKey="y" name={yLabel} domain={[0, yMax]} tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} label={{ value: yLabel, angle: -90, position: "insideLeft", fontSize: 11, fill: "var(--muted)" }} />
        <Tooltip
          contentStyle={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline)", borderRadius: 8, fontSize: 12 }}
          content={({ payload }) => {
            if (!payload || !payload.length) return null;
            const p = payload[0].payload;
            return (
              <div className="rounded-lg p-2.5" style={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline)", fontSize: 12 }}>
                <div style={{ fontWeight: 600, color: "var(--ink)" }}>{p.label}</div>
                <div style={{ color: "var(--muted)" }}>{p.stage}</div>
                <div style={{ color: "var(--ink)" }}>S: {p.x} · O: {p.y} · RPN: {p.z}</div>
              </div>
            );
          }}
        />
        <Scatter data={data} fill="#c4741a">
          {data.map((d, i) => <Cell key={i} fill={getColor(d.z)} />)}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

// ============================================================
// Control Chart (X-bar with UCL/LCL)
// ============================================================
export function ControlChartView({ data, mean, ucl, lcl, height = 300 }: {
  data: { date: string; fpy: number }[]; mean: number; ucl: number; lcl: number; height?: number;
}) {
  if (!data || data.length === 0) return <EmptyState message="No data" />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted)" }} axisLine={{ stroke: "var(--hairline)" }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline)", borderRadius: 8, fontSize: 12 }} />
        <ReferenceLine y={ucl} stroke="#b85569" strokeDasharray="4 4" label={{ value: `UCL ${ucl}`, fontSize: 10, fill: "#b85569", position: "right" }} />
        <ReferenceLine y={mean} stroke="#4a8a6e" strokeDasharray="4 4" label={{ value: `Mean ${mean}`, fontSize: 10, fill: "#4a8a6e", position: "right" }} />
        <ReferenceLine y={lcl} stroke="#b85569" strokeDasharray="4 4" label={{ value: `LCL ${lcl}`, fontSize: 10, fill: "#b85569", position: "right" }} />
        <Line type="monotone" dataKey="fpy" stroke="#c4741a" strokeWidth={1.5} dot={{ r: 2, fill: "#c4741a" }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ============================================================
// Radar Chart (FMEA risk profile)
// ============================================================
export function RadarChartView({ data, height = 300 }: {
  data: { stage: string; severity: number; occurrence: number; detection: number }[];
  height?: number;
}) {
  if (!data || data.length === 0) return <EmptyState message="No data" />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
        <PolarGrid stroke="var(--hairline)" />
        <PolarAngleAxis dataKey="stage" tick={{ fontSize: 10, fill: "var(--muted)" }} />
        <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 10, fill: "var(--muted-soft)" }} />
        <Radar name="Severity" dataKey="severity" stroke="#b85569" fill="#b85569" fillOpacity={0.15} strokeWidth={1.5} />
        <Radar name="Occurrence" dataKey="occurrence" stroke="#a07840" fill="#a07840" fillOpacity={0.15} strokeWidth={1.5} />
        <Radar name="Detection" dataKey="detection" stroke="#4a8a6e" fill="#4a8a6e" fillOpacity={0.15} strokeWidth={1.5} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Tooltip contentStyle={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline)", borderRadius: 8, fontSize: 12 }} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ============================================================
// Histogram
// ============================================================
export function HistogramView({ data, height = 250 }: {
  data: { label: string; count: number }[]; height?: number;
}) {
  if (!data || data.length === 0) return <EmptyState message="No data" />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={{ stroke: "var(--hairline)" }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline)", borderRadius: 8, fontSize: 12 }} />
        <Bar dataKey="count" fill="#c4741a" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ============================================================
// Cause & Effect (Ishikawa) - visual diagram
// ============================================================
export function CauseEffectView({ data, effect }: {
  data: { category: string; count: number; causes: string[] }[];
  effect: string;
}) {
  if (!data || data.length === 0) return <EmptyState message="No causes mapped" />;
  const categories = data.filter(d => d.count > 0);
  if (categories.length === 0) return <EmptyState message="No causes mapped" />;
  const maxCount = Math.max(...categories.map(c => c.count));
  const colors: Record<string, string> = {
    Man: "#b85569", Machine: "#a07840", Method: "#4a8a6e",
    Material: "#9fbbe0", Measurement: "#c0a8dd", Environment: "#9fc9a2",
  };
  return (
    <div className="space-y-3">
      {/* Effect box */}
      <div className="flex items-center justify-center">
        <div className="rounded-lg px-6 py-3 text-center" style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}>
          <div className="t-label" style={{ opacity: 0.8 }}>EFFECT</div>
          <div className="t-body-md font-medium">{effect}</div>
        </div>
      </div>
      {/* 6M categories */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {categories.map((cat) => (
          <div key={cat.category} className="rounded-lg p-3" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--canvas-soft)" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[cat.category] || "var(--muted)" }} />
                <span className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{cat.category}</span>
              </div>
              <span className="t-label px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${colors[cat.category] || "var(--muted)"}14`, color: colors[cat.category] || "var(--muted)" }}>{cat.count}</span>
            </div>
            <div className="space-y-1">
              {cat.causes.map((cause, i) => (
                <div key={i} className="t-label flex items-start gap-1" style={{ color: "var(--body)" }}>
                  <span style={{ color: "var(--muted-soft)" }}>•</span>
                  <span>{cause}</span>
                </div>
              ))}
            </div>
            {/* Bar showing relative count */}
            <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "var(--hairline)" }}>
              <div className="h-full rounded-full" style={{ width: `${(cat.count / maxCount) * 100}%`, backgroundColor: colors[cat.category] || "var(--muted)" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Checksheet - tally view
// ============================================================
export function ChecksheetView({ data }: { data: { defect: string; count: number; tally: string }[] }) {
  if (!data || data.length === 0) return <EmptyState message="No defects recorded" />;
  return (
    <div className="space-y-1.5">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3 py-1.5 px-3 rounded-lg" style={{ backgroundColor: "var(--canvas-soft)" }}>
          <div className="w-32 md:w-48 shrink-0 t-body-sm" style={{ color: "var(--ink)" }}>{d.defect}</div>
          <div className="flex-1 t-code overflow-hidden" style={{ color: "var(--primary)", letterSpacing: "-0.05em" }}>{d.tally}</div>
          <div className="w-8 text-right t-code font-medium" style={{ color: "var(--ink)" }}>{d.count}</div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Fetch helper
// ============================================================
export function useChartData(type: string, plant: string, days = 30, stage?: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ type, plant, days: String(days) });
    if (stage && stage !== "all") params.set("stage", stage);
    fetch(`/api/charts?${params}`).then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, [type, plant, days, stage]);

  return { data, loading };
}

// ============================================================
// Horizontal Bar Chart - for ranking defects, stages, departments
// ============================================================
export function HorizontalBarChartView({ data, keys, yKey = "label", height = 280, colors }: {
  data: any[];
  keys: { key: string; name: string; color?: string }[];
  yKey?: string;
  height?: number;
  colors?: string[];
}) {
  if (!data || data.length === 0) return <EmptyState message="No data available" />;
  const palette = colors || [PRIMARY, "#4a7c5e", "#8a6a3a"];
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--hairline)" />
        <XAxis type="number" tick={{ fill: "var(--muted)", fontSize: 11 }} stroke="var(--hairline)" />
        <YAxis type="category" dataKey={yKey} tick={{ fill: "var(--ink)", fontSize: 11 }} stroke="var(--hairline)" width={120} />
        <Tooltip contentStyle={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline)", borderRadius: 4, fontSize: 12 }} />
        {keys.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
        {keys.map((k, i) => (
          <Bar key={k.key} dataKey={k.key} name={k.name} fill={k.color || palette[i % palette.length]} radius={[0, 2, 2, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ============================================================
// Heatmap - for stage × defect matrix, department × month, etc.
// ============================================================
export function HeatmapView({ data, xLabels, yLabels, title, colorScale = ["#f7f7f5", "#1c3d5a"] }: {
  data: number[][];      // [y][x]
  xLabels: string[];
  yLabels: string[];
  title?: string;
  colorScale?: [string, string];
}) {
  if (!data || data.length === 0) return <EmptyState message="No data available" />;
  const max = Math.max(...data.flat(), 1);
  // Parse hex to RGB
  const hexToRgb = (hex: string) => {
    const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : { r: 0, g: 0, b: 0 };
  };
  const start = hexToRgb(colorScale[0]);
  const end = hexToRgb(colorScale[1]);
  const cellColor = (val: number) => {
    const t = val / max;
    const r = Math.round(start.r + (end.r - start.r) * t);
    const g = Math.round(start.g + (end.g - start.g) * t);
    const b = Math.round(start.b + (end.b - start.b) * t);
    return `rgb(${r}, ${g}, ${b})`;
  };
  const textColor = (val: number) => (val / max > 0.5 ? "#ffffff" : "var(--ink)");

  return (
    <div className="overflow-x-auto scroll-fine">
      <table className="w-full" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th className="t-label text-left py-2 px-2" style={{ color: "var(--muted)" }}></th>
            {xLabels.map((x) => (
              <th key={x} className="t-label text-center py-2 px-1" style={{ color: "var(--muted)", fontSize: 10 }}>{x}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, yi) => (
            <tr key={yi}>
              <td className="t-body-sm text-right py-1.5 px-2" style={{ color: "var(--ink)", fontWeight: 500, whiteSpace: "nowrap" }}>{yLabels[yi]}</td>
              {row.map((val, xi) => (
                <td key={xi} className="text-center py-1 px-0.5" style={{ minWidth: 36 }}>
                  <div
                    className="rounded flex items-center justify-center t-num"
                    style={{ backgroundColor: cellColor(val), color: textColor(val), height: 28, fontSize: 11, fontWeight: 500 }}
                    title={`${yLabels[yi]} × ${xLabels[xi]}: ${val}`}
                  >
                    {val > 0 ? val : ""}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// Polar Area Chart - for multi-dimensional severity/category analysis
// ============================================================
export function PolarAreaView({ data, nameKey = "label", valueKey = "value", height = 300 }: {
  data: { label: string; value: number }[];
  nameKey?: string;
  valueKey?: string;
  height?: number;
}) {
  if (!data || data.length === 0) return <EmptyState message="No data available" />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} outerRadius="75%">
        <PolarGrid stroke="var(--hairline)" />
        <PolarAngleAxis dataKey={nameKey} tick={{ fill: "var(--muted)", fontSize: 11 }} />
        <PolarRadiusAxis tick={{ fill: "var(--muted-soft)", fontSize: 10 }} stroke="var(--hairline)" />
        <Radar dataKey={valueKey} stroke={PRIMARY} fill={PRIMARY} fillOpacity={0.4} />
        <Tooltip contentStyle={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline)", borderRadius: 4, fontSize: 12 }} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ============================================================
// Progressive Line Chart with Easing - animated line for trend emphasis
// ============================================================
export function ProgressiveLineView({ data, lines, xKey = "date", height = 300, showArea = true }: {
  data: any[];
  lines: { key: string; name: string; color?: string }[];
  xKey?: string;
  height?: number;
  showArea?: boolean;
}) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setProgress(1), 100);
    return () => clearTimeout(timer);
  }, [data]);

  if (!data || data.length === 0) return <EmptyState message="No data available" />;
  const palette = [PRIMARY, "#4a7c5e", "#8a6a3a"];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" />
        <XAxis dataKey={xKey} tick={{ fill: "var(--muted)", fontSize: 11 }} stroke="var(--hairline)" />
        <YAxis tick={{ fill: "var(--muted)", fontSize: 11 }} stroke="var(--hairline)" />
        <Tooltip contentStyle={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline)", borderRadius: 4, fontSize: 12 }} />
        {lines.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
        {lines.map((l, i) => (
          showArea ? (
            <Area
              key={l.key}
              type="monotone"
              dataKey={l.key}
              name={l.name}
              stroke={l.color || palette[i % palette.length]}
              fill={l.color || palette[i % palette.length]}
              fillOpacity={0.15}
              strokeWidth={2}
              isAnimationActive={true}
              animationDuration={1200}
              animationEasing="ease-in-out"
            />
          ) : (
            <Line
              key={l.key}
              type="monotone"
              dataKey={l.key}
              name={l.name}
              stroke={l.color || palette[i % palette.length]}
              strokeWidth={2}
              dot={{ r: 3, fill: l.color || palette[i % palette.length] }}
              isAnimationActive={true}
              animationDuration={1200}
              animationEasing="ease-in-out"
            />
          )
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ============================================================
// Funnel Chart - for stage-wise yield, NCR lifecycle, process drop-off
// ============================================================
export function FunnelView({ data, height = 320 }: {
  data: { label: string; value: number; color?: string }[];
  height?: number;
}) {
  if (!data || data.length === 0) return <EmptyState message="No data available" />;
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const total = data[0].value || 1;
  const palette = [PRIMARY, "#2d5a7a", "#4a7c5e", "#6b9d7e", "#8a6a3a", "#a88a5a", "#71717a"];

  return (
    <div className="w-full overflow-hidden" style={{ height, maxHeight: height }}>
      <div className="flex flex-col gap-1 py-2 px-1">
        {data.map((d, i) => {
          const widthPct = (d.value / maxValue) * 100;
          const conversionRate = i === 0 ? 100 : (d.value / Math.max(data[i - 1].value, 1)) * 100;
          const dropOff = i === 0 ? 0 : data[i - 1].value - d.value;
          const color = d.color || palette[i % palette.length];
          return (
            <div key={i} className="flex items-center gap-2 py-0.5" style={{ minHeight: 44 }}>
              <div className="w-28 md:w-32 text-right shrink-0 overflow-hidden">
                <div className="t-body-sm font-medium truncate" style={{ color: "var(--ink)", fontSize: 11 }}>{d.label}</div>
                <div className="t-label t-num" style={{ color: "var(--muted)", fontSize: 10 }}>{d.value.toLocaleString()}</div>
              </div>
              <div className="flex-1 min-w-0 relative h-9 rounded-md overflow-hidden flex items-center" style={{ backgroundColor: "var(--canvas-soft)" }}>
                <div
                  className="h-full rounded-md flex items-center justify-end pr-2 transition-all"
                  style={{
                    width: `${Math.min(widthPct, 100)}%`,
                    maxWidth: "100%",
                    backgroundColor: color,
                    transitionDuration: "800ms",
                    transitionTimingFunction: "ease-out",
                    overflow: "hidden",
                  }}
                >
                  <span className="t-body-sm t-num font-medium whitespace-nowrap" style={{ color: "#fff", fontSize: 11 }}>
                    {((d.value / total) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="w-20 md:w-24 shrink-0">
                {i > 0 && (
                  <div className="text-right">
                    <div className="t-label t-num" style={{ color: conversionRate >= 90 ? "var(--semantic-success)" : conversionRate >= 70 ? "var(--semantic-warn)" : "var(--semantic-error)", fontSize: 10 }}>
                      {conversionRate.toFixed(1)}%
                    </div>
                    {dropOff > 0 && (
                      <div className="t-label t-num" style={{ color: "var(--muted-soft)", fontSize: 9 }}>-{dropOff}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Multi-Line Comparison Chart - for before/after CAPA, period vs period
// ============================================================
export function ComparisonLineView({ data, seriesA, seriesB, xKey = "date", height = 320 }: {
  data: any[];
  seriesA: { key: string; name: string; color: string };
  seriesB: { key: string; name: string; color: string };
  xKey?: string;
  height?: number;
}) {
  if (!data || data.length === 0) return <EmptyState message="No data available" />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" />
        <XAxis dataKey={xKey} tick={{ fill: "var(--muted)", fontSize: 11 }} stroke="var(--hairline)" />
        <YAxis tick={{ fill: "var(--muted)", fontSize: 11 }} stroke="var(--hairline)" />
        <Tooltip contentStyle={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline)", borderRadius: 4, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Line type="monotone" dataKey={seriesA.key} name={seriesA.name} stroke={seriesA.color} strokeWidth={2} dot={{ r: 3, fill: seriesA.color }} />
        <Line type="monotone" dataKey={seriesB.key} name={seriesB.name} stroke={seriesB.color} strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3, fill: seriesB.color }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ============================================================
// Donut Chart - for severity distribution, status breakdown
// ============================================================
export function DonutChartView({ data, dataKey = "value", nameKey = "label", height = 250, colors }: {
  data: { label: string; value: number }[];
  dataKey?: string;
  nameKey?: string;
  height?: number;
  colors?: string[];
}) {
  if (!data || data.length === 0) return <EmptyState message="No data available" />;
  const palette = colors || COLORS;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey={dataKey} nameKey={nameKey} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={1}>
          {data.map((_, i) => <Cell key={i} fill={palette[i % palette.length]} />)}
        </Pie>
        <Tooltip contentStyle={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline)", borderRadius: 4, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ============================================================
// Stacked Bar Chart - for multi-category comparison over time
// ============================================================
export function StackedBarView({ data, keys, xKey = "label", height = 300, colors }: {
  data: any[];
  keys: { key: string; name: string; color?: string }[];
  xKey?: string;
  height?: number;
  colors?: string[];
}) {
  if (!data || data.length === 0) return <EmptyState message="No data available" />;
  const palette = colors || COLORS;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fill: "var(--muted)", fontSize: 11 }} stroke="var(--hairline)" />
        <YAxis tick={{ fill: "var(--muted)", fontSize: 11 }} stroke="var(--hairline)" />
        <Tooltip contentStyle={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline)", borderRadius: 4, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {keys.map((k, i) => (
          <Bar key={k.key} dataKey={k.key} name={k.name} stackId="a" fill={k.color || palette[i % palette.length]} radius={i === keys.length - 1 ? [2, 2, 0, 0] : [0, 0, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
