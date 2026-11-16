import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/analytics?type=fpy-trend|pareto|stage-yield|route-summary&plant=K2
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "fpy-trend";
  const days = Number(searchParams.get("days") || 30);
  const plant = searchParams.get("plant") || "K2";
  const woFilter = plant !== "all" ? { routeCode: plant } : {};

  if (type === "fpy-trend") {
    const records = await db.dailyFpy.findMany({
      where: { date: { gte: new Date(Date.now() - days * 86400000) } },
      orderBy: { date: "asc" },
    });
    const byStage: Record<string, { date: string; fpy: number; total: number; ok: number; rejected: number; rework: number; hold: number }[]> = {};
    for (const r of records) {
      if (!byStage[r.stage]) byStage[r.stage] = [];
      byStage[r.stage].push({
        date: r.date.toISOString().slice(0, 10),
        fpy: r.totalJobs > 0 ? Number(((r.okJobs / r.totalJobs) * 100).toFixed(1)) : 100,
        total: r.totalJobs,
        ok: r.okJobs,
        rejected: r.rejectedJobs,
        rework: r.reworkJobs,
        hold: r.holdJobs,
      });
    }
    return NextResponse.json({ trend: byStage });
  }

  if (type === "pareto") {
    const ncrs = await db.nonconformance.findMany({
      where: { workOrder: woFilter },
      select: { defectCategory: true, severity: true, stageName: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    const byDefect: Record<string, number> = {};
    const byStage: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    for (const n of ncrs) {
      byDefect[n.defectCategory] = (byDefect[n.defectCategory] || 0) + 1;
      byStage[n.stageName] = (byStage[n.stageName] || 0) + 1;
      bySeverity[n.severity] = (bySeverity[n.severity] || 0) + 1;
    }
    const toPareto = (obj: Record<string, number>) => {
      const total = Object.values(obj).reduce((s, v) => s + v, 0);
      let cum = 0;
      return Object.entries(obj)
        .map(([label, count]) => {
          cum += (count / Math.max(total, 1)) * 100;
          return { label, count, cumPct: Number(cum.toFixed(1)) };
        })
        .sort((a, b) => b.count - a.count);
    };
    return NextResponse.json({
      byDefect: toPareto(byDefect),
      byStage: toPareto(byStage),
      bySeverity: toPareto(bySeverity),
      total: ncrs.length,
    });
  }

  if (type === "stage-yield") {
    // Aggregate FPY per stage across the period
    const records = await db.dailyFpy.findMany({
      where: { date: { gte: new Date(Date.now() - days * 86400000) } },
    });
    const byStage: Record<string, { total: number; ok: number; rejected: number; rework: number; hold: number; fpy: number }> = {};
    for (const r of records) {
      if (!byStage[r.stage]) byStage[r.stage] = { total: 0, ok: 0, rejected: 0, rework: 0, hold: 0, fpy: 0 };
      byStage[r.stage].total += r.totalJobs;
      byStage[r.stage].ok += r.okJobs;
      byStage[r.stage].rejected += r.rejectedJobs;
      byStage[r.stage].rework += r.reworkJobs;
      byStage[r.stage].hold += r.holdJobs;
    }
    for (const k of Object.keys(byStage)) {
      byStage[k].fpy = byStage[k].total > 0 ? Number(((byStage[k].ok / byStage[k].total) * 100).toFixed(1)) : 100;
    }
    return NextResponse.json({ stages: byStage });
  }

  if (type === "route-summary") {
    // Work orders per route with quality summary (filtered by plant if specified)
    const wos = await db.workOrder.findMany({
      where: woFilter,
      select: {
        routeCode: true,
        status: true,
        plannedQty: true,
        completedQty: true,
        rejectedQty: true,
        reworkQty: true,
        _count: { select: { inspections: true, ncrs: true } },
      },
    });
    const byRoute: Record<string, any> = {};
    for (const w of wos) {
      if (!byRoute[w.routeCode]) {
        byRoute[w.routeCode] = {
          route: w.routeCode,
          workOrders: 0,
          planned: 0,
          completed: 0,
          rejected: 0,
          rework: 0,
          inspections: 0,
          ncrs: 0,
        };
      }
      byRoute[w.routeCode].workOrders += 1;
      byRoute[w.routeCode].planned += w.plannedQty;
      byRoute[w.routeCode].completed += w.completedQty;
      byRoute[w.routeCode].rejected += w.rejectedQty;
      byRoute[w.routeCode].rework += w.reworkQty;
      byRoute[w.routeCode].inspections += w._count.inspections;
      byRoute[w.routeCode].ncrs += w._count.ncrs;
    }
    for (const k of Object.keys(byRoute)) {
      const r = byRoute[k];
      r.firstPassYield = r.planned > 0 ? Number((((r.completed - r.rework) / r.planned) * 100).toFixed(1)) : 0;
    }
    return NextResponse.json({ routes: Object.values(byRoute) });
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}
