"use client";

import { useEffect, useState, useMemo } from "react";
import {
  AlertTriangle, ShieldCheck, FileCheck2, FileSearch, GitBranch, CircleDashed,
  TrendingUp, TrendingDown, ArrowRight, ArrowDownToLine, Plus, Search,
  CheckCircle2, XCircle, AlertCircle, Clock, FileText, Network, Target,
  Beaker, Ruler, Droplets, Flame, Layers3, BookOpen, Filter, Printer,
  ChevronRight, ChevronDown, Eye, FileBarChart, Sigma, DollarSign,
  Wrench, Boxes, Package, Activity, CalendarDays, Building2, User as UserIcon,
  Save, Edit3, X, Lightbulb, Flag, PenLine, StickyNote,
} from "lucide-react";
import {
  StatusBadge, ResultBadge, PageHeader, EmptyState, LoadingBlock,
  DataTable, StatCard, DetailRow, FilterBar, SearchInput, SectionHeader,
  fmtDate, fmtDateTime, pct, type Column,
} from "@/components/qms/shared";
import { ReportHeader, CertificateSeal } from "@/components/qms/brand";
import {
  ChartCard, PieChartView, BarChartView, LineChartView, AreaChartView,
  ScatterChartView, ControlChartView, RadarChartView, HistogramView,
  CauseEffectView, ChecksheetView, useChartData,
  HorizontalBarChartView, HeatmapView, PolarAreaView, ProgressiveLineView,
  FunnelView, ComparisonLineView, DonutChartView, StackedBarView,
} from "@/components/qms/charts";
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
// ADVANCED ANALYTICS - expanded with 8+ report types, Ishikawa,
// heatmap, polar area, progressive line, funnel charts
// ============================================================

const K2_STAGES_SHORT = [
  "S01", "S02", "S03", "S04", "S05", "S06", "S07",
  "S11", "S12", "S13", "S14", "S20", "S23", "S27",
  "S33", "S34", "S35", "S38",
];

const STAGE_NAMES: Record<string, string> = {
  S01: "Rolling", S02: "Single Spot", S03: "Multi Spot", S04: "Seam Weld",
  S05: "Cross Seam", S06: "Edge Cut", S07: "TIG Weld", S11: "Erection",
  S12: "MAG Weld", S13: "Spatter", S14: "Leak Test", S20: "Grit Blast",
  S23: "Primer", S27: "Paint MIO", S33: "Spray+Final", S34: "Final Insp",
  S35: "N2 Fill", S38: "Packing",
};

export function AdvancedAnalyticsModule({ plant }: { plant: string }) {
  const [tab, setTab] = useState("overview");
  const [days, setDays] = useState("30");
  const [stageFilter, setStageFilter] = useState("all");

  return (
    <div className="reveal-up">
      <PageHeader
        eyebrow="Continuous Improvement"
        title="Quality Analytics"
        subtitle="FPY trends, defect Pareto, Ishikawa cause-and-effect, process funnel, heatmaps, and FMEA risk matrix. Every chart has a defined analytical purpose with drill-down to source records."
        meta={
          <>
            <span className="t-label t-num" style={{ color: "var(--muted)" }}>8 REPORT TYPES</span>
            <span className="t-label" style={{ color: "var(--muted)" }}>·</span>
            <span className="t-label t-num" style={{ color: "var(--muted)" }}>6 CHART VARIATIONS</span>
          </>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap px-5 md:px-10 py-3.5 border-b" style={{ borderColor: "var(--hairline)" }}>
        <Filter size={13} style={{ color: "var(--muted)" }} />
        <span className="t-label" style={{ color: "var(--muted)" }}>Date Range</span>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-24 h-8 t-body-sm" style={{ borderColor: "var(--hairline)" }}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 days</SelectItem>
            <SelectItem value="30">30 days</SelectItem>
            <SelectItem value="90">90 days</SelectItem>
            <SelectItem value="180">180 days</SelectItem>
          </SelectContent>
        </Select>
        <span className="t-label ml-2" style={{ color: "var(--muted)" }}>Stage</span>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-40 h-8 t-body-sm" style={{ borderColor: "var(--hairline)" }}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {Object.entries(STAGE_NAMES).map(([code, name]) => (
              <SelectItem key={code} value={code}>{code} · {name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="p-5 md:p-10">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex-wrap h-auto" style={{ backgroundColor: "var(--canvas-soft)" }}>
            <TabsTrigger value="overview" className="t-body-sm">Overview</TabsTrigger>
            <TabsTrigger value="ishikawa" className="t-body-sm">Cause & Effect</TabsTrigger>
            <TabsTrigger value="defects" className="t-body-sm">Defect Analysis</TabsTrigger>
            <TabsTrigger value="process" className="t-body-sm">Process Funnel</TabsTrigger>
            <TabsTrigger value="heatmap" className="t-body-sm">Heatmap</TabsTrigger>
            <TabsTrigger value="trends" className="t-body-sm">Trends</TabsTrigger>
            <TabsTrigger value="risk" className="t-body-sm">Risk</TabsTrigger>
          </TabsList>

          {/* === OVERVIEW === */}
          <TabsContent value="overview" className="mt-5 space-y-5">
            {/* KPI summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard label="First Pass Yield" value="92.4%" sublabel="↑ 2.7% vs last period" tone="ok" icon={<Target size={15} />} />
              <StatCard label="Defect Rate" value="3.2%" sublabel="↓ 0.4% vs last period" tone="ok" icon={<AlertTriangle size={15} />} />
              <StatCard label="Open NCRs" value="8" sublabel="1 critical · 2 overdue CAPA" tone="warn" icon={<ShieldCheck size={15} />} />
              <StatCard label="Inspections" value="142" sublabel="11 failures · 7.7% fail rate" tone="neutral" icon={<FileCheck2 size={15} />} />
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              {/* FPY Progressive Line */}
              <ChartCard title="First Pass Yield - 14 day trend" subtitle="Progressive line with easing animation">
                <ProgressiveLineView
                  data={Array.from({ length: 14 }, (_, i) => ({
                    date: `${14 - i}d`,
                    fpy: 88 + Math.random() * 8,
                    target: 92,
                  }))}
                  lines={[
                    { key: "fpy", name: "FPY %", color: "#1c3d5a" },
                    { key: "target", name: "Target 92%", color: "#a04545" },
                  ]}
                  height={280}
                />
              </ChartCard>

              {/* Defect Pareto */}
              <ChartCard title="Defect Pareto - Top categories" subtitle="80/20 analysis of defect causes">
                <HorizontalBarChartView
                  data={[
                    { label: "Weld porosity", count: 14 },
                    { label: "Dimensional dev.", count: 9 },
                    { label: "Surface defect", count: 6 },
                    { label: "Leak path", count: 5 },
                    { label: "Coating thin", count: 3 },
                    { label: "Other", count: 2 },
                  ]}
                  keys={[{ key: "count", name: "Count" }]}
                  height={280}
                />
              </ChartCard>

              {/* NCR Severity Donut */}
              <ChartCard title="NCR Severity Distribution" subtitle="Critical / Major / Minor breakdown">
                <DonutChartView
                  data={[
                    { label: "Critical", value: 1 },
                    { label: "Major", value: 4 },
                    { label: "Minor", value: 3 },
                  ]}
                  colors={["#a04545", "#8a6a3a", "#71717a"]}
                  height={250}
                />
              </ChartCard>

              {/* Inspection Status Stacked Bar */}
              <ChartCard title="Inspection Status by Week" subtitle="Pass / Fail / Hold stacked">
                <StackedBarView
                  data={[
                    { label: "W1", pass: 38, fail: 3, hold: 1 },
                    { label: "W2", pass: 42, fail: 2, hold: 2 },
                    { label: "W3", pass: 35, fail: 4, hold: 1 },
                    { label: "W4", pass: 27, fail: 2, hold: 0 },
                  ]}
                  keys={[
                    { key: "pass", name: "Pass", color: "#4a7c5e" },
                    { key: "fail", name: "Fail", color: "#a04545" },
                    { key: "hold", name: "Hold", color: "#8a6a3a" },
                  ]}
                  height={250}
                />
              </ChartCard>
            </div>

            {/* Insights panel */}
            <ChartCard title="Analytics Insights" subtitle="Automated observations from the data - context for each metric">
              <div className="space-y-3">
                <InsightRow
                  num="01"
                  tone="risk"
                  title="Weld porosity is the #1 defect - 14 occurrences (35% of all defects)"
                  detail="Concentrated at S12 (MAG Welding) and S04 (Seam Welding). Probable root cause: shielding gas flow drift on station #3. Investigate via RCA Workspace → NCR-2026-008."
                />
                <InsightRow
                  num="02"
                  tone="warn"
                  title="FPY dipped to 88% on day 8 - recovered to 94% by day 11"
                  detail="Correlation: MAG station #2 maintenance event on day 7. Effectiveness of CAPA-2026-008 verified over 3 subsequent shifts."
                />
                <InsightRow
                  num="03"
                  tone="ok"
                  title="Dimensional deviations reduced 40% month-over-month"
                  detail="Compound die maintenance (S01) on 2026-10-15 directly improved neck-to-neck consistency. 4 NCRs reduced to 2 in subsequent 30 days."
                />
                <InsightRow
                  num="04"
                  tone="neutral"
                  title="Inspection volume down 9% - planned maintenance shutdown Oct 18-22"
                  detail="Not a quality regression. Sample size remains statistically meaningful (142 inspections). No data completeness gaps."
                />
              </div>
            </ChartCard>
          </TabsContent>

          {/* === ISHIKAWA / CAUSE & EFFECT === */}
          <TabsContent value="ishikawa" className="mt-5 space-y-5">
            <ChartCard
              title="Cause & Effect Diagram (Ishikawa - 6M)"
              subtitle="Map defects to root causes across the 6M manufacturing model. Each branch links to evidence and CAPA."
              action={
                <Select defaultValue="leak">
                  <SelectTrigger className="w-56 h-8 t-body-sm" style={{ borderColor: "var(--hairline)" }}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leak">Effect: Leak Test Failure (S14)</SelectItem>
                    <SelectItem value="dimensional">Effect: Dimensional Deviation (S01)</SelectItem>
                    <SelectItem value="weld">Effect: Weld Porosity (S12)</SelectItem>
                    <SelectItem value="coating">Effect: Coating Adhesion (S27)</SelectItem>
                  </SelectContent>
                </Select>
              }
            >
              <IshikawaDiagram effect="Leak Test Failure at S14 - seam weld porosity creating leak path" />
            </ChartCard>

            {/* 6M breakdown cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ISHIKAWA_BRANCHES.map((branch) => (
                <IshikawaBranchCard key={branch.key} branch={branch} />
              ))}
            </div>

            {/* 5 Whys linked */}
            <ChartCard title="5 Whys - linked to selected effect" subtitle="Drill from symptom to root cause">
              <div className="space-y-3">
                {FIVE_WHYS_LINKED.map((w, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center t-num" style={{
                      backgroundColor: i === FIVE_WHYS_LINKED.length - 1 ? "var(--semantic-error)" : "var(--canvas-soft)",
                      color: i === FIVE_WHYS_LINKED.length - 1 ? "#fff" : "var(--muted)",
                      border: "1px solid var(--hairline)",
                      fontSize: 12, fontWeight: 600,
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
                  Shift change checklist does not include shielding gas flow verification. Incorrect regulator setting propagated undetected for one full shift.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="t-label" style={{ color: "var(--muted)" }}>LINKED CAPA:</span>
                  <span className="t-code" style={{ color: "var(--primary)" }}>CAPA-2026-008</span>
                  <span className="t-label" style={{ color: "var(--muted)" }}>· STATUS:</span>
                  <StatusBadge status="Effectiveness-check" size="xs" />
                </div>
              </div>
            </ChartCard>
          </TabsContent>

          {/* === DEFECT ANALYSIS === */}
          <TabsContent value="defects" className="mt-5 space-y-5">
            <div className="grid lg:grid-cols-2 gap-4">
              {/* Defects by Stage - horizontal bar */}
              <ChartCard title="Defects by Stage" subtitle="Which manufacturing stages produce the most defects">
                <HorizontalBarChartView
                  data={[
                    { label: "S12 MAG Weld", defects: 14 },
                    { label: "S14 Leak Test", defects: 8 },
                    { label: "S01 Rolling", defects: 6 },
                    { label: "S04 Seam Weld", defects: 5 },
                    { label: "S27 Paint MIO", defects: 3 },
                    { label: "S11 Erection", defects: 2 },
                  ]}
                  keys={[{ key: "defects", name: "Defects" }]}
                  height={280}
                />
              </ChartCard>

              {/* Defect Categories - polar area */}
              <ChartCard title="Defect Categories" subtitle="Polar area view of defect type distribution">
                <PolarAreaView
                  data={[
                    { label: "Welding", value: 22 },
                    { label: "Dimensional", value: 9 },
                    { label: "Surface", value: 6 },
                    { label: "Leak", value: 5 },
                    { label: "Coating", value: 3 },
                    { label: "Material", value: 2 },
                  ]}
                  height={300}
                />
              </ChartCard>

              {/* Defect Trend - progressive line */}
              <ChartCard title="Defect Trend - 30 days" subtitle="Progressive line with easing, by category">
                <ProgressiveLineView
                  data={Array.from({ length: 10 }, (_, i) => ({
                    date: `D${i * 3 + 1}`,
                    welding: 2 + Math.random() * 3,
                    dimensional: 1 + Math.random() * 2,
                    surface: Math.random() * 2,
                  }))}
                  lines={[
                    { key: "welding", name: "Welding", color: "#1c3d5a" },
                    { key: "dimensional", name: "Dimensional", color: "#8a6a3a" },
                    { key: "surface", name: "Surface", color: "#4a7c5e" },
                  ]}
                  height={280}
                  showArea={false}
                />
              </ChartCard>

              {/* Repeat defects */}
              <ChartCard title="Repeat Defects - same characteristic, multiple NCRs" subtitle="Indicates systemic issue requiring RCA">
                <div className="space-y-2">
                  {[
                    { char: "Seam weld porosity", stage: "S04/S14", count: 5, lastNcr: "NCR-2026-008", trend: "up" },
                    { char: "Neck-to-neck distance", stage: "S01", count: 4, lastNcr: "NCR-2026-017", trend: "down" },
                    { char: "Coating adhesion", stage: "S27", count: 3, lastNcr: "NCR-2026-015", trend: "flat" },
                    { char: "MAG weld spatter", stage: "S12/S13", count: 3, lastNcr: "NCR-2026-012", trend: "up" },
                  ].map((d, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-md" style={{ border: "1px solid var(--hairline)" }}>
                      <div className="w-8 h-8 rounded-md flex items-center justify-center t-num shrink-0" style={{ backgroundColor: d.count >= 4 ? "var(--semantic-error)14" : "var(--semantic-warn)14", color: d.count >= 4 ? "var(--semantic-error)" : "var(--semantic-warn)", fontSize: 12, fontWeight: 600 }}>
                        {d.count}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{d.char}</div>
                        <div className="t-label" style={{ color: "var(--muted)" }}>{d.stage} · Last: {d.lastNcr}</div>
                      </div>
                      <div className="shrink-0">
                        {d.trend === "up" && <TrendingUp size={14} style={{ color: "var(--semantic-error)" }} />}
                        {d.trend === "down" && <TrendingDown size={14} style={{ color: "var(--semantic-success)" }} />}
                        {d.trend === "flat" && <Activity size={14} style={{ color: "var(--muted)" }} />}
                      </div>
                    </div>
                  ))}
                </div>
              </ChartCard>
            </div>

            {/* Defect insights */}
            <ChartCard title="Defect Analysis Insights" subtitle="Why these defects are occurring - context for management">
              <div className="space-y-3">
                <InsightRow num="01" tone="risk" title="Welding defects concentrate at S12 and S04"
                  detail="32% of all defects are welding-related. Shielding gas flow verification at shift change is the confirmed root cause for S12. S04 porosity investigation pending - sample WPS parameters." />
                <InsightRow num="02" tone="warn" title="Repeat defects indicate systemic issues, not isolated events"
                  detail="4 characteristics have 3+ NCRs in 30 days. Each requires formal RCA. Neck-to-neck distance trend improving post die maintenance - effectiveness verified." />
                <InsightRow num="03" tone="ok" title="Coating defects reduced after primer flooding parameter update"
                  detail="CAPA-2026-011 effectiveness verified. Coating adhesion failures dropped from 5 (Sep) to 3 (Oct). Continue monitoring for 2 more months before closure." />
              </div>
            </ChartCard>
          </TabsContent>

          {/* === PROCESS FUNNEL === */}
          <TabsContent value="process" className="mt-5 space-y-5">
            <ChartCard title="Production Funnel - K2 Route" subtitle="Track units from rolling to dispatch. Identify where work drops off.">
              <FunnelView
                data={[
                  { label: "Started (S01)", value: 320, color: "#1c3d5a" },
                  { label: "Spot Weld OK (S02)", value: 308, color: "#2d5a7a" },
                  { label: "Seam Weld OK (S04)", value: 295, color: "#3a6b8a" },
                  { label: "Erection OK (S11)", value: 287, color: "#4a7c5e" },
                  { label: "MAG OK (S12)", value: 274, color: "#6b9d7e" },
                  { label: "Leak Test Pass (S14)", value: 269, color: "#8a6a3a" },
                  { label: "Paint OK (S33)", value: 264, color: "#a88a5a" },
                  { label: "Final Pass (S34)", value: 261, color: "#71717a" },
                ]}
                height={400}
              />
            </ChartCard>

            <div className="grid lg:grid-cols-2 gap-4">
              <ChartCard title="NCR Lifecycle Funnel" subtitle="From detection to effectiveness verification">
                <FunnelView
                  data={[
                    { label: "Detected", value: 39, color: "#a04545" },
                    { label: "Recorded", value: 39, color: "#b05555" },
                    { label: "Contained", value: 36, color: "#c06565" },
                    { label: "Investigated", value: 28, color: "#8a6a3a" },
                    { label: "CAPA Open", value: 22, color: "#a07a4a" },
                    { label: "Action Done", value: 18, color: "#4a7c5e" },
                    { label: "Effectiveness Verified", value: 12, color: "#1c3d5a" },
                    { label: "Closed", value: 10, color: "#71717a" },
                  ]}
                  height={360}
                />
              </ChartCard>

              <ChartCard title="Inspection Outcome Funnel" subtitle="Pass / Fail / Hold / Rework distribution">
                <FunnelView
                  data={[
                    { label: "Inspections Done", value: 142, color: "#1c3d5a" },
                    { label: "First-Pass", value: 124, color: "#4a7c5e" },
                    { label: "Rework OK", value: 7, color: "#8a6a3a" },
                    { label: "Released", value: 131, color: "#2d5a7a" },
                    { label: "On Hold", value: 4, color: "#a04545" },
                    { label: "Scrapped", value: 2, color: "#71717a" },
                  ]}
                  height={360}
                />
              </ChartCard>
            </div>

            <ChartCard title="Funnel Insights" subtitle="Where work is lost and why">
              <div className="space-y-3">
                <InsightRow num="01" tone="risk" title="Largest drop-off: S01 → S02 (12 units, 3.75%)"
                  detail="Rolling defects at S01 reject sheets before spot welding. Compound die maintenance scheduled. Expected recovery: 1.5% improvement." />
                <InsightRow num="02" tone="warn" title="S12 MAG welding loses 13 units (4.5%)"
                  detail="Weld porosity is the primary cause. CAPA-2026-008 in effectiveness-verification phase. Expected recovery: 3% improvement post-verification." />
                <InsightRow num="03" tone="ok" title="Final inspection yield 99.1% - within target"
                  detail="S34 final inspection rejects 3 units of 264 presented. Within target (≥98%). No systemic issue." />
                <InsightRow num="04" tone="warn" title="NCR lifecycle: 18 of 28 actions done, but only 12 effectiveness-verified"
                  detail="6 CAPAs are pending effectiveness verification. These cannot be closed until verification evidence is captured per the controlled procedure." />
              </div>
            </ChartCard>
          </TabsContent>

          {/* === HEATMAP === */}
          <TabsContent value="heatmap" className="mt-5 space-y-5">
            <ChartCard title="Defect Heatmap - Stage × Category" subtitle="Dark cells = high defect concentration. Click a cell concept to investigate.">
              <HeatmapView
                data={[
                  // S01..S14 rows × Welding/Dimensional/Surface/Leak/Coating cols
                  [0, 6, 1, 0, 0],  // S01 Rolling
                  [2, 1, 1, 0, 0],  // S02 Single Spot
                  [1, 0, 0, 0, 0],  // S03 Multi Spot
                  [4, 0, 0, 1, 0],  // S04 Seam Weld
                  [1, 0, 0, 0, 0],  // S05 Cross Seam
                  [0, 2, 0, 0, 0],  // S06 Edge Cut
                  [2, 1, 0, 0, 0],  // S07 TIG
                  [1, 1, 0, 0, 0],  // S11 Erection
                  [9, 2, 1, 2, 0],  // S12 MAG
                  [0, 0, 2, 0, 0],  // S13 Spatter
                  [0, 0, 0, 5, 0],  // S14 Leak Test
                  [0, 0, 1, 0, 1],  // S20 Grit Blast
                  [0, 0, 0, 0, 2],  // S23 Primer
                  [0, 0, 0, 0, 3],  // S27 Paint
                ]}
                xLabels={["Welding", "Dimensional", "Surface", "Leak", "Coating"]}
                yLabels={["S01", "S02", "S03", "S04", "S05", "S06", "S07", "S11", "S12", "S13", "S14", "S20", "S23", "S27"]}
              />
            </ChartCard>

            <div className="grid lg:grid-cols-2 gap-4">
              <ChartCard title="FPY Heatmap - Stage × Week" subtitle="Weekly FPY by stage. Dark = high yield.">
                <HeatmapView
                  data={[
                    [96, 94, 92, 95],  // S01
                    [98, 97, 96, 98],  // S02
                    [97, 98, 95, 97],  // S03
                    [94, 92, 90, 93],  // S04
                    [95, 96, 94, 96],  // S05
                    [97, 96, 95, 97],  // S06
                    [93, 91, 89, 92],  // S07
                    [90, 88, 85, 89],  // S11
                    [84, 82, 80, 86],  // S12 ← bottleneck
                    [96, 95, 94, 96],  // S13
                    [94, 92, 89, 93],  // S14
                    [92, 90, 88, 91],  // S20
                    [95, 94, 93, 95],  // S23
                    [93, 91, 88, 92],  // S27
                  ]}
                  xLabels={["W1", "W2", "W3", "W4"]}
                  yLabels={["S01", "S02", "S03", "S04", "S05", "S06", "S07", "S11", "S12", "S13", "S14", "S20", "S23", "S27"]}
                  colorScale={["#a04545", "#4a7c5e"]}
                />
              </ChartCard>

              <ChartCard title="Inspector Activity Heatmap - Inspector × Day" subtitle="Dark = high inspection volume.">
                <HeatmapView
                  data={[
                    [4, 6, 5, 7, 3, 0, 0],  // Sneha Patel
                    [3, 5, 4, 6, 4, 0, 0],  // Rahul Desai
                    [2, 3, 4, 3, 2, 0, 0],  // Priya K.
                    [5, 7, 6, 8, 5, 0, 0],  // Amit Shah
                    [2, 2, 3, 2, 1, 0, 0],  // QC-003
                  ]}
                  xLabels={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
                  yLabels={["Sneha", "Rahul", "Priya", "Amit", "QC-003"]}
                />
              </ChartCard>
            </div>

            <ChartCard title="Heatmap Insights" subtitle="What the patterns reveal">
              <div className="space-y-3">
                <InsightRow num="01" tone="risk" title="S12 MAG Welding is the defect hotspot - 9 welding defects in 30 days"
                  detail="Concentrated in welding category. Cross-reference with WPS register and welder qualification records. Possible causes: WPS deviation, electrode wear, gas flow." />
                <InsightRow num="02" tone="warn" title="FPY heatmap shows S12 as persistent bottleneck across all 4 weeks"
                  detail="Week 3 is the lowest (80%). Correlates with the MAG station #2 maintenance event. Recovery visible in Week 4." />
                <InsightRow num="03" tone="ok" title="S02 Single Spot Welding consistently 96-98% FPY"
                  detail="Stable process. No action required. Use as benchmark for other welding stages." />
              </div>
            </ChartCard>
          </TabsContent>

          {/* === TRENDS === */}
          <TabsContent value="trends" className="mt-5 space-y-5">
            <div className="grid lg:grid-cols-2 gap-4">
              <ChartCard title="FPY by Stage - 30 day trend" subtitle="Progressive line, animated easing">
                <ProgressiveLineView
                  data={Array.from({ length: 10 }, (_, i) => ({
                    date: `D${i * 3 + 1}`,
                    s01: 94 + Math.random() * 4,
                    s12: 82 + Math.random() * 6,
                    s14: 90 + Math.random() * 5,
                  }))}
                  lines={[
                    { key: "s01", name: "S01 Rolling", color: "#4a7c5e" },
                    { key: "s12", name: "S12 MAG", color: "#a04545" },
                    { key: "s14", name: "S14 Leak", color: "#1c3d5a" },
                  ]}
                  height={300}
                />
              </ChartCard>

              <ChartCard title="NCR Backlog Trend" subtitle="Open NCRs over time, by severity">
                <ProgressiveLineView
                  data={Array.from({ length: 10 }, (_, i) => ({
                    date: `D${i * 3 + 1}`,
                    critical: Math.random() < 0.3 ? 1 : 0,
                    major: 2 + Math.random() * 3,
                    minor: 3 + Math.random() * 2,
                  }))}
                  lines={[
                    { key: "critical", name: "Critical", color: "#a04545" },
                    { key: "major", name: "Major", color: "#8a6a3a" },
                    { key: "minor", name: "Minor", color: "#71717a" },
                  ]}
                  height={300}
                />
              </ChartCard>

              <ChartCard title="Inspection Volume by Stage" subtitle="Stacked bar - where inspections concentrate">
                <StackedBarView
                  data={[
                    { label: "S01", planned: 38, done: 36 },
                    { label: "S04", planned: 32, done: 30 },
                    { label: "S11", planned: 28, done: 27 },
                    { label: "S12", planned: 30, done: 28 },
                    { label: "S14", planned: 26, done: 25 },
                    { label: "S34", planned: 22, done: 21 },
                  ]}
                  keys={[
                    { key: "planned", name: "Planned", color: "#71717a" },
                    { key: "done", name: "Completed", color: "#1c3d5a" },
                  ]}
                  height={280}
                />
              </ChartCard>

              <ChartCard title="COPQ Trend - 6 months" subtitle="Cost of poor quality by category">
                <ProgressiveLineView
                  data={[
                    { date: "May", internal: 28000, external: 95000, appraisal: 130000, prevention: 28000 },
                    { date: "Jun", internal: 31000, external: 78000, appraisal: 135000, prevention: 30000 },
                    { date: "Jul", internal: 26000, external: 120000, appraisal: 140000, prevention: 32000 },
                    { date: "Aug", internal: 24000, external: 65000, appraisal: 138000, prevention: 35000 },
                    { date: "Sep", internal: 22000, external: 84000, appraisal: 142000, prevention: 38000 },
                    { date: "Oct", internal: 19060, external: 102500, appraisal: 151300, prevention: 59000 },
                  ]}
                  lines={[
                    { key: "internal", name: "Internal", color: "#a04545" },
                    { key: "external", name: "External", color: "#8a6a3a" },
                    { key: "appraisal", name: "Appraisal", color: "#1c3d5a" },
                    { key: "prevention", name: "Prevention", color: "#4a7c5e" },
                  ]}
                  height={280}
                />
              </ChartCard>
            </div>
          </TabsContent>

          {/* === RISK === */}
          <TabsContent value="risk" className="mt-5 space-y-5">
            <div className="grid lg:grid-cols-2 gap-4">
              <ChartCard title="FMEA Risk Matrix" subtitle="Severity × Occurrence. Top-right = highest risk.">
                <HeatmapView
                  data={[
                    [0, 0, 1, 2, 1],
                    [0, 1, 2, 3, 2],
                    [1, 2, 4, 3, 1],
                    [2, 3, 5, 2, 0],
                    [1, 2, 1, 0, 0],
                  ]}
                  xLabels={["1", "2", "3", "4", "5"]}
                  yLabels={["S5", "S4", "S3", "S2", "S1"]}
                  colorScale={["#4a7c5e", "#a04545"]}
                />
                <div className="mt-3 flex items-center justify-between t-label" style={{ color: "var(--muted)" }}>
                  <span>← Severity (low to high) →</span>
                  <span>↑ Occurrence (high to low) ↑</span>
                </div>
              </ChartCard>

              <ChartCard title="Risk Radar - Process capability" subtitle="Multi-dimensional view across 6 risk axes">
                <RadarChartView
                  data={[
                    { axis: "Welding", value: 78 },
                    { axis: "Dimensional", value: 62 },
                    { axis: "Material", value: 45 },
                    { axis: "Coating", value: 55 },
                    { axis: "Leak", value: 70 },
                    { axis: "Documentation", value: 40 },
                  ]}
                  height={300}
                />
              </ChartCard>
            </div>

            <ChartCard title="Top 5 FMEA Risks (RPN ranked)" subtitle="Risk Priority Number = Severity × Occurrence × Detection">
              <div className="space-y-2">
                {[
                  { rank: 1, item: "Shielding gas flow drift (S12 MAG)", severity: 8, occurrence: 6, detection: 5, rpn: 240, action: "CAPA-2026-008 in effectiveness-verify" },
                  { rank: 2, item: "Compound die wear (S01 Rolling)", severity: 7, occurrence: 5, detection: 4, rpn: 140, action: "Die maintenance completed 2026-10-15" },
                  { rank: 3, item: "Seam weld porosity (S04)", severity: 7, occurrence: 4, detection: 5, rpn: 140, action: "Investigation pending - RCA Workspace" },
                  { rank: 4, item: "Coating adhesion (S27 Paint)", severity: 6, occurrence: 4, detection: 5, rpn: 120, action: "CAPA-2026-011 effectiveness verified" },
                  { rank: 5, item: "Material MTC missing (Incoming)", severity: 9, occurrence: 2, detection: 6, rpn: 108, action: "Audit finding AF-2026-004 - critical" },
                ].map((r) => (
                  <div key={r.rank} className="flex items-center gap-4 p-3 rounded-md" style={{ border: "1px solid var(--hairline)" }}>
                    <div className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center t-num" style={{ backgroundColor: r.rpn >= 200 ? "var(--semantic-error)14" : r.rpn >= 120 ? "var(--semantic-warn)14" : "var(--canvas-soft)", color: r.rpn >= 200 ? "var(--semantic-error)" : r.rpn >= 120 ? "var(--semantic-warn)" : "var(--muted)", fontSize: 12, fontWeight: 600 }}>
                      {r.rank}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{r.item}</div>
                      <div className="t-label" style={{ color: "var(--muted)" }}>S:{r.severity} · O:{r.occurrence} · D:{r.detection} = RPN {r.rpn}</div>
                    </div>
                    <div className="hidden md:block shrink-0 max-w-xs text-right">
                      <div className="t-body-sm" style={{ color: "var(--body)" }}>{r.action}</div>
                    </div>
                    <div className="shrink-0 t-display-sm t-num" style={{ color: r.rpn >= 200 ? "var(--semantic-error)" : r.rpn >= 120 ? "var(--semantic-warn)" : "var(--muted)", fontWeight: 600 }}>{r.rpn}</div>
                  </div>
                ))}
              </div>
            </ChartCard>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ============================================================
// Ishikawa Diagram - visual fishbone with 6M branches
// ============================================================
type IshikawaCause = { cause: string; evidence: string; status: "Confirmed" | "Investigating" | "Hypothesis"; capa?: string };
type IshikawaBranch = { key: string; label: string; color: string; causes: IshikawaCause[] };

const ISHIKAWA_BRANCHES: IshikawaBranch[] = [
  {
    key: "man", label: "Man", color: "#1c3d5a",
    causes: [
      { cause: "Operator not trained on Rev.04 WPS", evidence: "Training record gap - Operator #4", status: "Confirmed", capa: "CAPA-2026-009" },
      { cause: "Shift change handoff missed first-piece verification", evidence: "Shift log 2026-10-12", status: "Investigating" },
    ],
  },
  {
    key: "machine", label: "Machine", color: "#4a7c5e",
    causes: [
      { cause: "MAG welding station #2 current drift", evidence: "Weld checker reading 2026-10-14", status: "Confirmed", capa: "CAPA-2026-008" },
      { cause: "Wire feeder tension inconsistent", evidence: "Maintenance log - pending review", status: "Hypothesis" },
      { cause: "Gas regulator setting incorrect at shift change", evidence: "ROOT CAUSE - confirmed via 5 Whys", status: "Confirmed", capa: "CAPA-2026-008" },
    ],
  },
  {
    key: "material", label: "Material", color: "#8a6a3a",
    causes: [
      { cause: "Welding wire lot variance", evidence: "GRN-2026-098 vs GRN-2026-103", status: "Investigating" },
      { cause: "Shielding gas moisture content", evidence: "Gas certificate review pending", status: "Hypothesis" },
    ],
  },
  {
    key: "method", label: "Method", color: "#a04545",
    causes: [
      { cause: "WPS essential variables not posted at station", evidence: "Audit finding AF-2026-003", status: "Confirmed", capa: "AF-2026-003" },
      { cause: "Shift change checklist missing gas flow step", evidence: "ROOT CAUSE - confirmed", status: "Confirmed", capa: "CAPA-2026-008" },
    ],
  },
  {
    key: "measurement", label: "Measurement", color: "#5a5a8a",
    causes: [
      { cause: "Weld checker calibration overdue", evidence: "Cal-2026-Q4 - MIC-101 flagged", status: "Confirmed", capa: "Cal-2026-Q4" },
      { cause: "Leak test pressure gauge drift", evidence: "Calibration record review", status: "Investigating" },
    ],
  },
  {
    key: "environment", label: "Environment", color: "#71717a",
    causes: [
      { cause: "Humidity above 70% in weld bay", evidence: "Environmental log 2026-10-13", status: "Hypothesis" },
      { cause: "Dust ingress from blasting booth", evidence: "Visual observation", status: "Hypothesis" },
    ],
  },
];

function IshikawaDiagram({ effect }: { effect: string }) {
  return (
    <div className="w-full">
      {/* Spine + effect */}
      <div className="relative">
        {/* Effect box (right) */}
        <div className="ml-auto mr-2 w-56 p-3 rounded-md" style={{ border: "1.5px solid var(--semantic-error)", backgroundColor: "var(--semantic-error)08" }}>
          <div className="t-label mb-1" style={{ color: "var(--semantic-error)" }}>EFFECT</div>
          <div className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{effect}</div>
        </div>
        {/* Spine line */}
        <div className="absolute top-1/2 left-0 right-56 h-px" style={{ backgroundColor: "var(--hairline-strong)" }} />
      </div>

      {/* 6M branches in 2x3 grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {ISHIKAWA_BRANCHES.map((b) => (
          <IshikawaBranchCard key={b.key} branch={b} />
        ))}
      </div>
    </div>
  );
}

function IshikawaBranchCard({ branch }: { branch: IshikawaBranch }) {
  return (
    <div className="rounded-md p-4" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--canvas-soft)" }}>
      <div className="flex items-center justify-between mb-3 pb-2 border-b" style={{ borderColor: "var(--hairline)" }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-6 rounded-sm" style={{ backgroundColor: branch.color }} />
          <div>
            <div className="t-title-sm" style={{ color: "var(--ink)" }}>{branch.label}</div>
            <div className="t-label" style={{ color: "var(--muted)" }}>6M Category</div>
          </div>
        </div>
        <span className="t-label t-num" style={{ color: "var(--muted)" }}>{branch.causes.length}</span>
      </div>
      <div className="space-y-2">
        {branch.causes.map((c, i) => (
          <div key={i} className="p-2 rounded" style={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline-soft)" }}>
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className="t-body-sm" style={{ color: "var(--ink)" }}>{c.cause}</span>
              <span className="t-label shrink-0" style={{
                color: c.status === "Confirmed" ? "var(--semantic-success)" : c.status === "Investigating" ? "var(--semantic-warn)" : "var(--muted)",
              }}>{c.status.toUpperCase()}</span>
            </div>
            <div className="t-label" style={{ color: "var(--muted)" }}>Evidence: {c.evidence}</div>
            {c.capa && (
              <div className="mt-1 flex items-center gap-1">
                <span className="t-label" style={{ color: "var(--muted)" }}>CAPA:</span>
                <span className="t-code" style={{ color: "var(--primary)", fontSize: 10 }}>{c.capa}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const FIVE_WHYS_LINKED = [
  { why: "Why did the leak test fail at S14?", answer: "Weld porosity created a leak path through the seam weld." },
  { why: "Why was there weld porosity?", answer: "Insufficient shielding gas coverage at the weld pool." },
  { why: "Why was shielding gas coverage insufficient?", answer: "Gas flow rate dropped below WPS minimum (12 L/min) on station #3." },
  { why: "Why did the gas flow rate drop?", answer: "Regulator pressure set incorrectly during shift change." },
  { why: "Why was the regulator setting not verified at shift change?", answer: "Shift change checklist does not include gas flow verification step." },
];

// ============================================================
// Insight Row - for analytics context panels
// ============================================================
function InsightRow({ num, tone, title, detail }: { num: string; tone: "ok" | "warn" | "risk" | "neutral"; title: string; detail: string }) {
  const toneColors: Record<string, string> = {
    ok: "var(--semantic-success)",
    warn: "var(--semantic-warn)",
    risk: "var(--semantic-error)",
    neutral: "var(--primary)",
  };
  const toneLabels: Record<string, string> = {
    ok: "IMPROVEMENT", warn: "WATCH", risk: "ACTION REQUIRED", neutral: "OBSERVATION",
  };
  return (
    <div className="flex items-start gap-3 p-3 rounded-md" style={{ border: "1px solid var(--hairline)" }}>
      <span className="num-marker pt-1 shrink-0" style={{ color: "var(--muted)" }}>{num}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="t-label" style={{ color: toneColors[tone] }}>{toneLabels[tone]}</span>
        </div>
        <div className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{title}</div>
        <div className="t-body-sm mt-0.5" style={{ color: "var(--body)" }}>{detail}</div>
      </div>
    </div>
  );
}

// ============================================================
// DOCUMENT EDITOR MODULE - for Admin/Management to edit forms
// ============================================================

type EditableDoc = {
  id: string;
  docId: string;
  title: string;
  category: string;
  currentRev: string;
  status: "Draft" | "In-Review" | "Approved" | "Released" | "Retired";
  owner: string;
  approver?: string;
  effectiveDate?: string;
  lastChanged: string;
  changeSummary?: string;
  fields: { label: string; type: string; value: string; required?: boolean; ctq?: boolean; spec?: string }[];
};

const EDITABLE_DOCS: EditableDoc[] = [
  {
    id: "1", docId: "QCI/F/02/01", title: "Rolling & Forming Inspection Checklist", category: "In-Process",
    currentRev: "Rev.05", status: "Released", owner: "Sneha Patel", approver: "Amit Shah",
    effectiveDate: "2026-08-15", lastChanged: "2026-08-15",
    changeSummary: "Updated sheet thickness tolerance from ±0.05 to ±0.03 mm per customer feedback.",
    fields: [
      { label: "Sheet Thickness", type: "dimensional", value: "As per Drg./Tol. ±0.03 mm", required: true, ctq: false, spec: "Micrometer" },
      { label: "Sheet Width", type: "dimensional", value: "As per Drg./Tol. ±1 mm", required: true, spec: "Measuring tape" },
      { label: "Neck to Neck Distance", type: "dimensional", value: "As per Drg./Tol. ±1 mm", required: true, ctq: true, spec: "Measuring Tape" },
      { label: "Length-wise Bow", type: "dimensional", value: "Max 5 mm", required: false, spec: "Line dori & tape" },
      { label: "Width-wise Bow", type: "dimensional", value: "Max 3 mm", required: false, spec: "Line dori & filler gauge" },
      { label: "Forming & Rolling Matching", type: "dimensional", value: "Max 2.0 mm variation", required: false, spec: "Measuring tape" },
      { label: "Sheet Weaviness", type: "visual", value: "Not allowed", required: false, spec: "Visual" },
      { label: "Die Depth", type: "dimensional", value: "3.5 to 5 mm", required: false, spec: "Depth Micrometer" },
      { label: "Rolling Depth", type: "dimensional", value: "4 to 5 mm", required: false, spec: "Depth Micrometer" },
      { label: "Cut Fin Dimension", type: "dimensional", value: "X & Y = ±5 mm", required: false, spec: "Measuring tape" },
    ],
  },
  {
    id: "2", docId: "QCI/F/05/08", title: "Leak Testing Inspection Checklist", category: "Final",
    currentRev: "Rev.03", status: "Released", owner: "Priya Kulkarni", approver: "Amit Shah",
    effectiveDate: "2026-09-01", lastChanged: "2026-09-01",
    changeSummary: "Added pressure hold time requirement of 15 minutes per customer spec.",
    fields: [
      { label: "Test Pressure", type: "parameter", value: "As per drg. (typ. 2.5 kg/cm²)", required: true, ctq: true, spec: "Pressure gauge" },
      { label: "Hold Time", type: "parameter", value: "15 minutes minimum", required: true, ctq: true, spec: "Stopwatch" },
      { label: "Leak Visual Check", type: "visual", value: "No bubbles", required: true, ctq: true, spec: "Visual in tank" },
      { label: "Pressure Drop", type: "parameter", value: "≤ 0.1 kg/cm² over hold", required: true, ctq: true, spec: "Pressure gauge" },
      { label: "Dimensional - Overall", type: "dimensional", value: "As per drg.", required: true, spec: "Tape, vernier" },
      { label: "Visual - Welds", type: "visual", value: "No cracks, porosity, undercut", required: true, spec: "Visual" },
    ],
  },
  {
    id: "3", docId: "QCI/F/05/04", title: "Full MAG Welding Inspection Checklist", category: "In-Process",
    currentRev: "Rev.03", status: "Released", owner: "Rahul Desai", approver: "Amit Shah",
    effectiveDate: "2026-07-20", lastChanged: "2026-07-20",
    fields: [
      { label: "Welding Current", type: "parameter", value: "Per WPS VAA/HTR/CS/WPS", required: true, ctq: true, spec: "Weld Checker" },
      { label: "Voltage", type: "parameter", value: "Per WPS", required: true, ctq: false, spec: "Weld Checker" },
      { label: "Wire Feed Speed", type: "parameter", value: "Per WPS", required: true, spec: "Wire feeder display" },
      { label: "Gas Flow Rate", type: "parameter", value: "12-15 L/min", required: true, ctq: true, spec: "Flow meter" },
      { label: "Weld Visual", type: "visual", value: "No cracks, porosity, spatter", required: true, ctq: false, spec: "Visual" },
      { label: "Weld Size", type: "dimensional", value: "As per drg.", required: true, spec: "Weld gauge" },
    ],
  },
  {
    id: "4", docId: "QCI/F/06/04", title: "Primer & Paint Inspection Checklist", category: "Paint",
    currentRev: "Rev.04", status: "Draft", owner: "Amit Shah",
    lastChanged: "2026-10-25",
    changeSummary: "Draft: Adding DFT measurement requirement and oven temperature logging.",
    fields: [
      { label: "Primer DFT", type: "dimensional", value: "40-60 microns", required: true, ctq: true, spec: "DFT gauge" },
      { label: "Paint DFT (MIO)", type: "dimensional", value: "80-100 microns", required: true, ctq: true, spec: "DFT gauge" },
      { label: "Oven Temperature", type: "parameter", value: "180-220°C", required: true, spec: "Oven thermometer" },
      { label: "Oven Time", type: "parameter", value: "30 minutes", required: true, spec: "Timer" },
      { label: "Adhesion Test", type: "parameter", value: "Cross-cut - no peeling", required: true, ctq: true, spec: "Cross-cut tool" },
      { label: "Visual - Coverage", type: "visual", value: "Full coverage, no runs", required: true, spec: "Visual" },
    ],
  },
];

export function DocumentEditorModule({ user }: { user: User }) {
  const [docs, setDocs] = useState(EDITABLE_DOCS);
  const [selected, setSelected] = useState<EditableDoc | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [draftFields, setDraftFields] = useState<any[]>([]);
  const [changeSummary, setChangeSummary] = useState("");
  const { toast } = useToast();

  const canEdit = user.role === "Admin" || user.role === "QualityManager" || user.role === "DocumentController" || user.role === "ProcessEngineer";
  const canApprove = user.role === "Admin" || user.role === "QualityManager";

  const startEdit = (doc: EditableDoc) => {
    setSelected(doc);
    setDraftFields(doc.fields.map(f => ({ ...f })));
    setChangeSummary("");
    setEditMode(true);
  };

  const saveDraft = () => {
    if (!selected) return;
    if (!changeSummary.trim()) {
      toast({ title: "Change summary required", description: "Document the reason for this edit before saving.", variant: "destructive" });
      return;
    }
    // Update the doc with draft fields + new revision
    const newRev = incrementRev(selected.currentRev);
    const updated: EditableDoc = {
      ...selected,
      fields: draftFields,
      currentRev: newRev,
      status: "Draft",
      lastChanged: new Date().toISOString(),
      changeSummary,
    };
    setDocs(docs.map(d => d.id === selected.id ? updated : d));
    setSelected(updated);
    setEditMode(false);
    toast({
      title: "Draft saved",
      description: `${selected.docId} ${newRev} saved as Draft. Awaiting review and approval.`,
    });
  };

  const approveDoc = (doc: EditableDoc) => {
    const updated: EditableDoc = {
      ...doc,
      status: "Released",
      approver: user.name,
      effectiveDate: new Date().toISOString().slice(0, 10),
      lastChanged: new Date().toISOString(),
    };
    setDocs(docs.map(d => d.id === doc.id ? updated : d));
    toast({ title: "Document released", description: `${doc.docId} ${doc.currentRev} is now Released. Historical inspections retain their original revision.` });
  };

  return (
    <div className="reveal-up">
      <PageHeader
        eyebrow="Configuration Management"
        title="Document Editor"
        subtitle="Authorized administrators can edit controlled forms. Every change is versioned, requires a change summary, and follows draft → review → approval → release lifecycle. Historical inspections retain their original revision."
        meta={
          <>
            <span className="t-label t-num" style={{ color: "var(--muted)" }}>{docs.length} DOCS</span>
            <span className="t-label" style={{ color: "var(--muted)" }}>·</span>
            <span className="t-label t-num" style={{ color: canEdit ? "var(--semantic-success)" : "var(--muted)" }}>{canEdit ? "YOU CAN EDIT" : "READ-ONLY"}</span>
          </>
        }
      />

      <div className="p-5 md:p-10 space-y-6">
        {/* Lifecycle visualization */}
        <div>
          <SectionHeader number="01" title="Document lifecycle" subtitle="Draft → In-Review → Approved → Released → Retired" />
          <div className="rounded-md p-5" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <div className="flex items-center gap-2 flex-wrap">
              {["Draft", "In-Review", "Approved", "Released", "Retired"].map((s, i) => {
                const count = docs.filter(d => d.status === s).length;
                return (
                  <div key={s} className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-md" style={{ backgroundColor: count > 0 ? "var(--canvas-soft)" : "transparent", border: "1px solid var(--hairline)" }}>
                      <span className="num-marker" style={{ color: "var(--muted)" }}>{String(i + 1).padStart(2, "0")}</span>
                      <span className="t-body-sm font-medium" style={{ color: count > 0 ? "var(--ink)" : "var(--muted-soft)" }}>{s}</span>
                      <span className="t-label px-1.5 py-0 rounded" style={{ backgroundColor: count > 0 ? "var(--primary)" : "var(--surface-strong)", color: count > 0 ? "var(--on-primary)" : "var(--muted)" }}>{count}</span>
                    </div>
                    {i < 4 && <ArrowRight size={13} style={{ color: "var(--muted-soft)" }} />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Documents table */}
        <div>
          <SectionHeader number="02" title="Controlled documents" subtitle="Click a document to view or edit" />
          <div className="rounded-md overflow-hidden" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <DataTable
              columns={[
                { key: "docId", header: "Doc ID", sortable: true, sortValue: (d) => d.docId, render: (d) => <span className="t-code font-medium" style={{ color: "var(--primary)" }}>{d.docId}</span> },
                { key: "title", header: "Title", sortable: true, sortValue: (d) => d.title, render: (d) => (
                  <div>
                    <div className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{d.title}</div>
                    <div className="t-label mt-0.5" style={{ color: "var(--muted)" }}>{d.category}</div>
                  </div>
                ) },
                { key: "currentRev", header: "Rev", sortable: true, sortValue: (d) => d.currentRev, render: (d) => <span className="t-code" style={{ color: "var(--ink)" }}>{d.currentRev}</span> },
                { key: "status", header: "Status", render: (d) => <StatusBadge status={d.status} size="xs" /> },
                { key: "owner", header: "Owner", render: (d) => <span className="t-body-sm">{d.owner}</span>, hideOnMobile: true },
                { key: "lastChanged", header: "Last Change", sortable: true, sortValue: (d) => new Date(d.lastChanged).getTime(), render: (d) => <span className="t-label">{fmtDate(d.lastChanged)}</span>, hideOnMobile: true },
              ]}
              data={docs}
              onRowClick={setSelected}
              emptyMessage="No documents found."
            />
          </div>
        </div>

        {/* Editor / detail drawer */}
        {selected && (
          <Sheet open={true} onOpenChange={() => { setSelected(null); setEditMode(false); }}>
            <SheetContent side="right" className="w-full md:w-[50vw] md:max-w-[800px] p-0 overflow-y-auto" style={{ backgroundColor: "var(--surface-card)" }}>
              <SheetHeader className="px-6 pt-6 pb-3 border-b" style={{ borderColor: "var(--hairline)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="t-code" style={{ color: "var(--primary)" }}>{selected.docId}</span>
                  <span className="t-code" style={{ color: "var(--muted)" }}>{selected.currentRev}</span>
                  <StatusBadge status={selected.status} size="xs" />
                </div>
                <SheetTitle className="t-display-sm" style={{ color: "var(--ink)" }}>{selected.title}</SheetTitle>
                <SheetDescription className="t-body-sm mt-1" style={{ color: "var(--body)" }}>
                  {selected.category} · Owner: {selected.owner}{selected.approver ? ` · Approver: ${selected.approver}` : ""}
                  {selected.effectiveDate ? ` · Effective: ${fmtDate(selected.effectiveDate)}` : ""}
                </SheetDescription>
              </SheetHeader>

              <div className="px-6 py-5 space-y-5">
                {selected.changeSummary && (
                  <div className="rounded-md p-3" style={{ backgroundColor: "var(--canvas-soft)" }}>
                    <div className="t-label mb-1" style={{ color: "var(--primary)" }}>CHANGE SUMMARY · {selected.currentRev}</div>
                    <p className="t-body-sm" style={{ color: "var(--ink)" }}>{selected.changeSummary}</p>
                  </div>
                )}

                {!editMode ? (
                  <>
                    {/* View mode */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="t-label" style={{ color: "var(--muted)" }}>INSPECTION FIELDS · {selected.fields.length}</div>
                        {canEdit && (
                          <Button onClick={() => startEdit(selected)} className="t-body-sm h-8 px-3 rounded-md flex items-center gap-1.5" style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}>
                            <Edit3 size={13} /> Edit
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2">
                        {selected.fields.map((f, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 rounded-md" style={{ border: "1px solid var(--hairline-soft)" }}>
                            <div className="shrink-0 w-6 t-num text-center" style={{ color: "var(--muted)", fontSize: 11 }}>{i + 1}</div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{f.label}</span>
                                {f.ctq && <span className="t-label px-1.5 py-0 rounded" style={{ backgroundColor: "var(--primary)14", color: "var(--primary)", fontSize: 9 }}>CTQ</span>}
                                {f.required && <span className="t-label" style={{ color: "var(--semantic-error)", fontSize: 9 }}>REQUIRED</span>}
                              </div>
                              <div className="t-body-sm" style={{ color: "var(--body)" }}>{f.value}</div>
                              <div className="t-label mt-0.5" style={{ color: "var(--muted)" }}>Type: {f.type} · Method: {f.spec}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {canApprove && selected.status === "Draft" && (
                      <div className="pt-4 border-t" style={{ borderColor: "var(--hairline)" }}>
                        <Button onClick={() => approveDoc(selected)} className="w-full t-button h-10 rounded-md flex items-center justify-center gap-2" style={{ backgroundColor: "var(--semantic-success)", color: "#fff" }}>
                          <CheckCircle2 size={14} /> Approve & Release as {selected.currentRev}
                        </Button>
                        <div className="t-label mt-2 text-center" style={{ color: "var(--muted)" }}>
                          Releasing this document makes it the active revision. Historical inspections retain their original revision reference.
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Edit mode */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="t-label" style={{ color: "var(--primary)" }}>EDITING - DRAFT REVISION</div>
                        <div className="flex items-center gap-2">
                          <Button onClick={() => { setEditMode(false); setDraftFields(selected.fields.map(f => ({ ...f }))); }} className="t-body-sm h-8 px-3 rounded-md" style={{ border: "1px solid var(--hairline)", color: "var(--muted)" }}>
                            Cancel
                          </Button>
                          <Button onClick={saveDraft} className="t-body-sm h-8 px-3 rounded-md flex items-center gap-1.5" style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}>
                            <Save size={13} /> Save Draft
                          </Button>
                        </div>
                      </div>

                      {/* Change summary */}
                      <div className="mb-4">
                        <Label className="t-label" style={{ color: "var(--muted)" }}>Change Summary *</Label>
                        <Textarea
                          value={changeSummary}
                          onChange={(e) => setChangeSummary(e.target.value)}
                          placeholder="Describe what changed and why. This will be retained in the revision history."
                          className="mt-1 t-body-sm"
                          style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--canvas-soft)", color: "var(--ink)" }}
                          rows={2}
                        />
                      </div>

                      <div className="space-y-2">
                        {draftFields.map((f, i) => (
                          <div key={i} className="p-3 rounded-md" style={{ border: "1px solid var(--hairline)" }}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="t-num" style={{ color: "var(--muted)", fontSize: 11 }}>{i + 1}</span>
                              <Input
                                value={f.label}
                                onChange={(e) => setDraftFields(draftFields.map((df, di) => di === i ? { ...df, label: e.target.value } : df))}
                                className="t-body-sm h-7"
                                style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="t-label" style={{ color: "var(--muted)", fontSize: 9 }}>Specification / Value</Label>
                                <Input
                                  value={f.value}
                                  onChange={(e) => setDraftFields(draftFields.map((df, di) => di === i ? { ...df, value: e.target.value } : df))}
                                  className="t-body-sm h-7 mt-0.5"
                                  style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}
                                />
                              </div>
                              <div>
                                <Label className="t-label" style={{ color: "var(--muted)", fontSize: 9 }}>Method</Label>
                                <Input
                                  value={f.spec || ""}
                                  onChange={(e) => setDraftFields(draftFields.map((df, di) => di === i ? { ...df, spec: e.target.value } : df))}
                                  className="t-body-sm h-7 mt-0.5"
                                  style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={f.required || false}
                                  onChange={(e) => setDraftFields(draftFields.map((df, di) => di === i ? { ...df, required: e.target.checked } : df))}
                                  className="rounded"
                                />
                                <span className="t-label" style={{ color: "var(--muted)" }}>Required</span>
                              </label>
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={f.ctq || false}
                                  onChange={(e) => setDraftFields(draftFields.map((df, di) => di === i ? { ...df, ctq: e.target.checked } : df))}
                                  className="rounded"
                                />
                                <span className="t-label" style={{ color: "var(--primary)" }}>CTQ</span>
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </div>
  );
}

function incrementRev(rev: string): string {
  const m = rev.match(/Rev\.(\d+)/);
  if (!m) return `${rev}.1`;
  const n = parseInt(m[1], 10) + 1;
  return `Rev.${String(n).padStart(2, "0")}`;
}
