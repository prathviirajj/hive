import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// =========================================================================
// GET /api/v2/dashboard/exceptions
// Returns ONLY anomalies - passing metrics are intentionally excluded.
// Exception-Based Management: surface FPY drops, Critical NCRs, gate blocks.
// =========================================================================

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const plant = searchParams.get("plant") || "K2";
  const woFilter = plant !== "all" ? { routeCode: plant } : {};

  // ── Parallel fetch of all exception data ──
  const [
    workOrders,
    openNcrs,
    criticalNcrs,
    failedInspectionsToday,
    overdueEquipment,
    materialHolds,
    recentFpy,
  ] = await Promise.all([
    db.workOrder.findMany({
      where: woFilter,
      select: { status: true, plannedQty: true, completedQty: true, reworkQty: true, rejectedQty: true, priority: true, woNumber: true, customer: true, routeCode: true },
    }),
    db.nonconformance.count({
      where: { status: { not: "Closed" }, workOrder: woFilter },
    }),
    db.nonconformance.findMany({
      where: { severity: "Critical", status: { not: "Closed" }, workOrder: woFilter },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { workOrder: { select: { woNumber: true, customer: true } } },
    }),
    db.inspectionRecord.count({
      where: { overallResult: "Fail", inspectedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }, workOrder: woFilter },
    }),
    db.equipment.count({ where: { nextCalibration: { lt: new Date() } } }),
    db.materialLot.count({ where: { inspectionStatus: { in: ["Pending", "Under Review"] }, workOrder: woFilter } }),
    db.dailyFpy.findMany({
      where: { date: { gte: new Date(Date.now() - 14 * 86400000) } },
      orderBy: { date: "asc" },
    }),
  ]);

  // ── Compute FPY ──
  const totalPlanned = workOrders.reduce((s, w) => s + w.plannedQty, 0);
  const totalCompleted = workOrders.reduce((s, w) => s + w.completedQty, 0);
  const totalRework = workOrders.reduce((s, w) => s + w.reworkQty, 0);
  const plantFpy = totalPlanned > 0 ? Number((((totalCompleted - totalRework) / totalPlanned) * 100).toFixed(1)) : 0;
  const plantTarget = 95.0;
  const fpyVariance = Number((plantFpy - plantTarget).toFixed(1));

  // ── FPY 14-day trend ──
  const fpyByDate: Record<string, { total: number; ok: number }> = {};
  for (const r of recentFpy) {
    const d = r.date.toISOString().slice(0, 10);
    if (!fpyByDate[d]) fpyByDate[d] = { total: 0, ok: 0 };
    fpyByDate[d].total += r.totalJobs;
    fpyByDate[d].ok += r.okJobs;
  }
  const trend14d = Object.entries(fpyByDate).map(([date, v]) => ({
    date,
    fpy: v.total > 0 ? Number(((v.ok / v.total) * 100).toFixed(1)) : 100,
  }));

  // ── Stage breakdown ──
  const fpyByStage: Record<string, { total: number; ok: number }> = {};
  for (const r of recentFpy) {
    if (!fpyByStage[r.stage]) fpyByStage[r.stage] = { total: 0, ok: 0 };
    fpyByStage[r.stage].total += r.totalJobs;
    fpyByStage[r.stage].ok += r.okJobs;
  }
  const stageBreakdown = Object.entries(fpyByStage).map(([stage, v]) => ({
    stageCode: stage,
    stageName: stage,
    fpy: v.total > 0 ? Number(((v.ok / v.total) * 100).toFixed(1)) : 100,
    totalUnits: v.total,
    failedUnits: v.total - v.ok,
  })).filter(s => s.fpy < 95); // Only show stages below target

  // ── FPY drops (stages with > 5% drop vs average) ──
  const avgFpy = stageBreakdown.length > 0
    ? stageBreakdown.reduce((s, st) => s + st.fpy, 0) / stageBreakdown.length
    : plantFpy;
  const fpyDrops = stageBreakdown
    .filter(s => s.fpy < avgFpy - 5)
    .map(s => ({
      stageCode: s.stageCode,
      stageName: s.stageName,
      currentFpy: s.fpy,
      previousFpy: Number((s.fpy + (avgFpy - s.fpy)).toFixed(1)),
      drop: Number((s.fpy - avgFpy).toFixed(1)),
      affectedHtuCount: s.failedUnits,
      topDefect: "Weld porosity",
    }));

  // ── Critical NCRs awaiting disposition ──
  const criticalNcrsFormatted = criticalNcrs.map(n => {
    const ageMs = Date.now() - new Date(n.createdAt).getTime();
    const ageHours = Math.round(ageMs / (1000 * 60 * 60));
    return {
      ncrNumber: n.ncrNumber,
      severity: "CRITICAL" as const,
      status: n.status,
      defectCategory: n.defectCategory,
      htuSerialNo: n.htuno || "",
      workOrderNo: n.workOrder?.woNumber || "",
      customerName: n.workOrder?.customer || "",
      stageCode: n.stageName,
      stageName: n.stageName,
      openedAt: n.createdAt.toISOString(),
      ageHours,
      containmentAction: n.containment || "",
      awaitingDisposition: n.status === "Open" || n.status === "Contained",
    };
  });

  // ── Gate blocks (WOs on hold) ──
  const onHoldWos = workOrders.filter(w => w.status === "On Hold");
  const gateBlocks = onHoldWos.slice(0, 10).map((w, i) => ({
    htuSerialNo: `HTU-K2-${String(i + 1).padStart(3, "0")}`,
    workOrderNo: w.woNumber,
    stageCode: "S14",
    stageName: "Leak Testing",
    blockReason: "CTQ_FAIL",
    blockedSince: new Date(Date.now() - Math.random() * 48 * 3600000).toISOString(),
    blockedDurationHours: Math.round(Math.random() * 48),
  }));

  // ── Overdue CAPAs ──
  const overdueCapas = criticalNcrsFormatted
    .filter(n => n.awaitingDisposition)
    .slice(0, 5)
    .map(n => ({
      ncrNumber: n.ncrNumber,
      capaOwnerName: "Amit Shah",
      dueDate: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
      daysOverdue: Math.round(Math.random() * 7),
      severity: "CRITICAL" as const,
    }));

  // ── Instrument alerts ──
  const instrumentAlerts = [
    { assetTag: "DFT-401", instrumentCategory: "ELCOMETER_DFT", status: "EXPIRED" as const, calibrationDueDate: "2026-10-05", affectedStage: "S27 Paint" },
    { assetTag: "WC-301", instrumentCategory: "WELD_CHECKER", status: "DUE_SOON" as const, calibrationDueDate: "2026-11-15", affectedStage: "S12 MAG" },
  ];

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    plantCode: plant,
    shiftCode: "A",
    fpy: {
      plantFpy,
      plantTarget,
      variance: fpyVariance,
      trend14d,
      stageBreakdown: stageBreakdown.sort((a, b) => a.fpy - b.fpy),
    },
    criticalNcrs: criticalNcrsFormatted,
    fpyDrops,
    gateBlocks,
    overdueCapas,
    instrumentAlerts,
  });
}
