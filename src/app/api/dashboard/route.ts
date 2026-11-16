import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/dashboard?plant=K2 - Management Control Tower metrics
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const plant = searchParams.get("plant") || "K2";
  const woFilter = plant !== "all" ? { routeCode: plant } : {};

  const [
    workOrders,
    openNcrs,
    criticalNcrs,
    openFmea,
    highRpnFmea,
    inspectionsToday,
    failedInspections,
    pendingDocs,
    overdueEquipment,
    materialHolds,
  ] = await Promise.all([
    db.workOrder.findMany({ where: woFilter, select: { status: true, plannedQty: true, completedQty: true, rejectedQty: true, reworkQty: true, priority: true } }),
    db.nonconformance.count({ where: { status: { not: "Closed" }, workOrder: woFilter } }),
    db.nonconformance.count({ where: { severity: "Critical", status: { not: "Closed" }, workOrder: woFilter } }),
    db.fmeaRecord.count({ where: { status: { not: "Closed" } } }),
    db.fmeaRecord.findMany({ where: { rpn: { gte: 100 } }, orderBy: { rpn: "desc" }, take: 5 }),
    db.inspectionRecord.count({ where: { inspectedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }, workOrder: woFilter } }),
    db.inspectionRecord.count({ where: { overallResult: "Fail", inspectedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }, workOrder: woFilter } }),
    db.controlledDocument.count({ where: { status: "Draft" } }),
    db.equipment.count({ where: { nextCalibration: { lt: new Date() } } }),
    db.materialLot.count({ where: { inspectionStatus: { in: ["Pending", "Under Review"] }, workOrder: woFilter } }),
  ]);

  // FPY last 14 days by stage (filtered by plant)
  const fpyRaw = await db.dailyFpy.findMany({
    where: { date: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } },
    orderBy: { date: "asc" },
  });
  const fpyByStage: Record<string, { date: string; fpy: number; total: number; ok: number }[]> = {};
  for (const r of fpyRaw) {
    if (!fpyByStage[r.stage]) fpyByStage[r.stage] = [];
    fpyByStage[r.stage].push({
      date: r.date.toISOString().slice(0, 10),
      fpy: r.totalJobs > 0 ? (r.okJobs / r.totalJobs) * 100 : 100,
      total: r.totalJobs,
      ok: r.okJobs,
    });
  }

  // Defect Pareto
  const ncrs = await db.nonconformance.findMany({
    where: { workOrder: woFilter },
    select: { defectCategory: true, severity: true, createdAt: true },
  });
  const defectCounts: Record<string, number> = {};
  for (const n of ncrs) {
    defectCounts[n.defectCategory] = (defectCounts[n.defectCategory] || 0) + 1;
  }
  const pareto = Object.entries(defectCounts).map(([defect, count]) => ({ defect, count })).sort((a, b) => b.count - a.count);
  const totalPareto = pareto.reduce((s, p) => s + p.count, 0);
  let cumPct = 0;
  const paretoWithCum = pareto.map((p) => {
    cumPct += (p.count / Math.max(totalPareto, 1)) * 100;
    return { ...p, cumPct };
  });

  const woByStatus: Record<string, number> = {};
  for (const w of workOrders) woByStatus[w.status] = (woByStatus[w.status] || 0) + 1;

  const totalPlanned = workOrders.reduce((s, w) => s + w.plannedQty, 0);
  const totalCompleted = workOrders.reduce((s, w) => s + w.completedQty, 0);
  const totalRejected = workOrders.reduce((s, w) => s + w.rejectedQty, 0);
  const totalRework = workOrders.reduce((s, w) => s + w.reworkQty, 0);
  const firstPassYield = totalPlanned > 0 ? ((totalCompleted - totalRework) / totalPlanned) * 100 : 0;

  return NextResponse.json({
    plant,
    quality: {
      firstPassYield: Number(firstPassYield.toFixed(1)),
      completed: totalCompleted,
      planned: totalPlanned,
      rejected: totalRejected,
      rework: totalRework,
      inspectionsToday,
      failedInspectionsToday: failedInspections,
    },
    risk: {
      openNcrs,
      criticalNcrs,
      openFmea,
      highRpnFmea: highRpnFmea.map((f) => ({
        id: f.fmeaId, stage: f.stageName, failureMode: f.failureMode,
        rpn: f.rpn, severity: f.severity, occurrence: f.occurrence, detection: f.detection,
      })),
    },
    operations: {
      woByStatus,
      materialHolds,
      pendingDocApprovals: pendingDocs,
      overdueCalibrations: overdueEquipment,
    },
    fpyByStage,
    pareto: paretoWithCum,
    recentNcrs: await db.nonconformance.findMany({
      where: { workOrder: woFilter },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { workOrder: { select: { woNumber: true, customer: true, itemName: true } } },
    }),
    recentInspections: await db.inspectionRecord.findMany({
      where: { workOrder: woFilter },
      orderBy: { inspectedAt: "desc" },
      take: 8,
      include: {
        stage: { select: { name: true, stageCode: true } },
        workOrder: { select: { woNumber: true, customer: true } },
      },
    }),
  });
}
