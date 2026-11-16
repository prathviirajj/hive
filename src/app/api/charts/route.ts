import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/charts?type=histogram|scatter|control|pie|bar|line|cause-effect|checksheet&plant=K2&days=30&stage=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "histogram";
  const plant = searchParams.get("plant") || "K2";
  const days = Number(searchParams.get("days") || 30);
  const stage = searchParams.get("stage");
  const woFilter = plant !== "all" ? { routeCode: plant } : {};
  const dateFilter = { gte: new Date(Date.now() - days * 86400000) };

  // ============================================================
  // HISTOGRAM - distribution of inspection results by stage
  // ============================================================
  if (type === "histogram") {
    const inspections = await db.inspectionRecord.findMany({
      where: { workOrder: woFilter, inspectedAt: dateFilter, ...(stage && stage !== "all" ? { stage: { name: stage } } : {}) },
      select: { overallResult: true, ctqResult: true, stage: { select: { name: true } } },
    });
    const bins = { Pass: 0, Fail: 0, Hold: 0, Pending: 0 };
    for (const r of inspections) {
      bins[r.overallResult as keyof typeof bins] = (bins[r.overallResult as keyof typeof bins] || 0) + 1;
    }
    return NextResponse.json({
      type: "histogram",
      title: "Inspection Result Distribution",
      xLabel: "Result",
      yLabel: "Count",
      data: Object.entries(bins).map(([label, count]) => ({ label, count })),
      total: inspections.length,
    });
  }

  // ============================================================
  // SCATTER - RPN vs Severity (FMEA risk matrix)
  // ============================================================
  if (type === "scatter") {
    const fmeas = await db.fmeaRecord.findMany({
      select: { severity: true, occurrence: true, detection: true, rpn: true, stageName: true, failureMode: true, fmeaId: true },
    });
    return NextResponse.json({
      type: "scatter",
      title: "FMEA Risk Matrix - Severity vs Occurrence",
      xLabel: "Severity (1-10)",
      yLabel: "Occurrence (1-10)",
      xMax: 10, yMax: 10,
      data: fmeas.map(f => ({
        x: f.severity, y: f.occurrence, z: f.rpn,
        label: f.failureMode, id: f.fmeaId, stage: f.stageName,
      })),
    });
  }

  // ============================================================
  // CONTROL CHART - FPY over time per stage (X-bar style)
  // ============================================================
  if (type === "control") {
    const records = await db.dailyFpy.findMany({
      where: { date: { gte: new Date(Date.now() - days * 86400000) } },
      orderBy: { date: "asc" },
    });
    const byDate: Record<string, { total: number; ok: number; fpy: number }> = {};
    for (const r of records) {
      const d = r.date.toISOString().slice(0, 10);
      if (!byDate[d]) byDate[d] = { total: 0, ok: 0, fpy: 0 };
      byDate[d].total += r.totalJobs;
      byDate[d].ok += r.okJobs;
    }
    const points = Object.entries(byDate).map(([date, v]) => ({
      date, fpy: v.total > 0 ? Number(((v.ok / v.total) * 100).toFixed(1)) : 100,
    }));
    const fpyValues = points.map(p => p.fpy);
    const mean = fpyValues.length > 0 ? fpyValues.reduce((s, v) => s + v, 0) / fpyValues.length : 0;
    const stdDev = fpyValues.length > 1 ? Math.sqrt(fpyValues.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / fpyValues.length) : 0;
    const ucl = Number((mean + 3 * stdDev).toFixed(1));
    const lcl = Number((mean - 3 * stdDev).toFixed(1));
    return NextResponse.json({
      type: "control",
      title: "FPY Control Chart (X-bar)",
      xLabel: "Date",
      yLabel: "FPY %",
      mean: Number(mean.toFixed(1)),
      ucl, lcl,
      data: points,
    });
  }

  // ============================================================
  // PIE - NCR by severity
  // ============================================================
  if (type === "pie") {
    const ncrs = await db.nonconformance.findMany({
      where: { workOrder: woFilter, createdAt: dateFilter },
      select: { severity: true, defectCategory: true },
    });
    const bySeverity: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    for (const n of ncrs) {
      bySeverity[n.severity] = (bySeverity[n.severity] || 0) + 1;
      byCategory[n.defectCategory] = (byCategory[n.defectCategory] || 0) + 1;
    }
    return NextResponse.json({
      type: "pie",
      title: "NCR Distribution",
      bySeverity: Object.entries(bySeverity).map(([label, value]) => ({ label, value })),
      byCategory: Object.entries(byCategory).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
      total: ncrs.length,
    });
  }

  // ============================================================
  // BAR - inspections by stage (pass vs fail)
  // ============================================================
  if (type === "bar") {
    const inspections = await db.inspectionRecord.findMany({
      where: { workOrder: woFilter, inspectedAt: dateFilter },
      select: { overallResult: true, stage: { select: { name: true } } },
    });
    const byStage: Record<string, { pass: number; fail: number; hold: number; total: number }> = {};
    for (const r of inspections) {
      const s = r.stage?.name || "Unknown";
      if (!byStage[s]) byStage[s] = { pass: 0, fail: 0, hold: 0, total: 0 };
      byStage[s].total++;
      if (r.overallResult === "Pass") byStage[s].pass++;
      else if (r.overallResult === "Fail") byStage[s].fail++;
      else if (r.overallResult === "Hold") byStage[s].hold++;
    }
    return NextResponse.json({
      type: "bar",
      title: "Inspections by Stage - Pass vs Fail",
      data: Object.entries(byStage).map(([stage, v]) => ({ stage, ...v })),
    });
  }

  // ============================================================
  // LINE - FPY trend per stage
  // ============================================================
  if (type === "line") {
    const records = await db.dailyFpy.findMany({
      where: { date: { gte: new Date(Date.now() - days * 86400000) } },
      orderBy: { date: "asc" },
    });
    const byStage: Record<string, { date: string; fpy: number }[]> = {};
    for (const r of records) {
      if (!byStage[r.stage]) byStage[r.stage] = [];
      byStage[r.stage].push({
        date: r.date.toISOString().slice(0, 10),
        fpy: r.totalJobs > 0 ? Number(((r.okJobs / r.totalJobs) * 100).toFixed(1)) : 100,
      });
    }
    return NextResponse.json({
      type: "line",
      title: "FPY Trend by Stage",
      data: byStage,
    });
  }

  // ============================================================
  // CAUSE-EFFECT - predefined 6M categories with linked NCRs/FMEA
  // ============================================================
  if (type === "cause-effect") {
    const ncrs = await db.nonconformance.findMany({
      where: { workOrder: woFilter },
      select: { defectCategory: true, rootCause: true, stageName: true, description: true },
    });
    const fmeas = await db.fmeaRecord.findMany({
      select: { stageName: true, failureMode: true, potentialCause: true, failureEffect: true },
    });
    // Map causes to 6M categories (Man, Machine, Method, Material, Measurement, Environment)
    const causes6M: Record<string, { causes: string[]; count: number }> = {
      Man: { causes: [], count: 0 },
      Machine: { causes: [], count: 0 },
      Method: { causes: [], count: 0 },
      Material: { causes: [], count: 0 },
      Measurement: { causes: [], count: 0 },
      Environment: { causes: [], count: 0 },
    };
    const categorize = (cause: string): string => {
      const c = cause.toLowerCase();
      if (/operator|welder|human|skill|train|fatigue|human error/.test(c)) return "Man";
      if (/machine|m\/c|equipment|welding.*m|plasma|torque|electrode|wheel|calibrat/.test(c)) return "Machine";
      if (/sop|procedure|method|wps|sequence|setting|parameter|gauge setting|process/.test(c)) return "Method";
      if (/material|coil|sheet|wire|pipe|grit|primer|paint|supplier|incoming|spec/.test(c)) return "Material";
      if (/measurement|gauge|micrometer|vernier|dft|measurement system|inspection/.test(c)) return "Measurement";
      if (/humidity|temperature|environment|weather|dust|climate|atmosphere/.test(c)) return "Environment";
      return "Method";
    };
    for (const n of ncrs) {
      if (n.rootCause) {
        const cat = categorize(n.rootCause);
        causes6M[cat].causes.push(n.rootCause);
        causes6M[cat].count++;
      }
    }
    for (const f of fmeas) {
      if (f.potentialCause) {
        const cat = categorize(f.potentialCause);
        causes6M[cat].causes.push(f.potentialCause);
        causes6M[cat].count++;
      }
    }
    return NextResponse.json({
      type: "cause-effect",
      title: "Cause & Effect (Ishikawa) - 6M Analysis",
      effect: "Quality Defects / NCRs",
      data: Object.entries(causes6M).map(([category, v]) => ({
        category,
        count: v.count,
        causes: [...new Set(v.causes)].slice(0, 5),
      })),
    });
  }

  // ============================================================
  // CHECKSHEET - defect frequency tally
  // ============================================================
  if (type === "checksheet") {
    const ncrs = await db.nonconformance.findMany({
      where: { workOrder: woFilter, createdAt: dateFilter },
      select: { defectCategory: true, severity: true, stageName: true, createdAt: true },
    });
    const tally: Record<string, number> = {};
    for (const n of ncrs) {
      tally[n.defectCategory] = (tally[n.defectCategory] || 0) + 1;
    }
    const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
    return NextResponse.json({
      type: "checksheet",
      title: "Defect Checksheet - Frequency Tally",
      data: sorted.map(([defect, count]) => ({ defect, count, tally: "█".repeat(count) })),
      total: ncrs.length,
    });
  }

  // ============================================================
  // AREA - cumulative NCR closure over time
  // ============================================================
  if (type === "area") {
    const ncrs = await db.nonconformance.findMany({
      where: { workOrder: woFilter, createdAt: dateFilter },
      select: { createdAt: true, status: true, closedAt: true },
      orderBy: { createdAt: "asc" },
    });
    const byDate: Record<string, { open: number; closed: number }> = {};
    for (const n of ncrs) {
      const d = n.createdAt.toISOString().slice(0, 10);
      if (!byDate[d]) byDate[d] = { open: 0, closed: 0 };
      byDate[d].open++;
      if (n.status === "Closed" && n.closedAt) {
        const cd = n.closedAt.toISOString().slice(0, 10);
        if (!byDate[cd]) byDate[cd] = { open: 0, closed: 0 };
        byDate[cd].closed++;
      }
    }
    let cumOpen = 0, cumClosed = 0;
    const data = Object.entries(byDate).sort((a, b) => a[0].localeCompare(b[0])).map(([date, v]) => {
      cumOpen += v.open;
      cumClosed += v.closed;
      return { date, open: cumOpen, closed: cumClosed, backlog: cumOpen - cumClosed };
    });
    return NextResponse.json({
      type: "area",
      title: "NCR Backlog - Cumulative Open vs Closed",
      data,
    });
  }

  // ============================================================
  // RADAR - FMEA risk by stage
  // ============================================================
  if (type === "radar") {
    const fmeas = await db.fmeaRecord.findMany({
      select: { stageName: true, severity: true, occurrence: true, detection: true, rpn: true },
    });
    const byStage: Record<string, { sev: number[]; occ: number[]; det: number[]; rpn: number[] }> = {};
    for (const f of fmeas) {
      if (!byStage[f.stageName]) byStage[f.stageName] = { sev: [], occ: [], det: [], rpn: [] };
      byStage[f.stageName].sev.push(f.severity);
      byStage[f.stageName].occ.push(f.occurrence);
      byStage[f.stageName].det.push(f.detection);
      byStage[f.stageName].rpn.push(f.rpn);
    }
    const avg = (arr: number[]) => arr.length > 0 ? Number((arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(1)) : 0;
    return NextResponse.json({
      type: "radar",
      title: "FMEA Risk Profile by Stage",
      data: Object.entries(byStage).map(([stage, v]) => ({
        stage,
        severity: avg(v.sev),
        occurrence: avg(v.occ),
        detection: avg(v.det),
        rpn: avg(v.rpn),
      })),
    });
  }

  return NextResponse.json({ error: "Unknown chart type" }, { status: 400 });
}
