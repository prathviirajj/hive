import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/quality-gates?woId=...&plant=K2
// Returns the quality gate status for a work order - which gates are passed, pending, or failed
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const woId = searchParams.get("woId");
  const plant = searchParams.get("plant") || "K2";

  // Get all gate stages for the route
  const route = await db.processRoute.findUnique({
    where: { code: plant },
    include: {
      stages: {
        where: { isGate: true },
        orderBy: { seq: "asc" },
        select: { id: true, stageCode: true, name: true, seq: true, documentRef: true, isCTQ: true },
      },
    },
  });

  if (!route) {
    return NextResponse.json({ error: "Route not found" }, { status: 404 });
  }

  // If we have a work order ID, get its inspection status for each gate
  let gateStatus: any[] = [];
  if (woId) {
    const wo = await db.workOrder.findUnique({ where: { id: woId } });
    if (!wo) {
      return NextResponse.json({ error: "Work order not found" }, { status: 404 });
    }

    for (const stage of route.stages) {
      const inspections = await db.inspectionRecord.findMany({
        where: { workOrderId: woId, stageId: stage.id },
        orderBy: { inspectedAt: "desc" },
        take: 1,
      });

      const latestInspection = inspections[0];
      const ncrs = await db.nonconformance.count({
        where: { workOrderId: woId, stageName: stage.name, status: { not: "Closed" } },
      });

      gateStatus.push({
        stageId: stage.id,
        stageCode: stage.stageCode,
        stageName: stage.name,
        seq: stage.seq,
        documentRef: stage.documentRef,
        isCTQ: stage.isCTQ,
        gateStatus: latestInspection?.overallResult === "Pass" ? "PASSED" :
                    latestInspection?.overallResult === "Fail" ? "FAILED" :
                    latestInspection?.overallResult === "Hold" ? "ON HOLD" :
                    "PENDING",
        latestInspectionNo: latestInspection?.recordNo || null,
        latestInspectionDate: latestInspection?.inspectedAt || null,
        openNCRs: ncrs,
        canProceed: latestInspection?.overallResult === "Pass" && ncrs === 0,
      });
    }
  } else {
    // Return all gates for the route without work-order-specific status
    gateStatus = route.stages.map((stage) => ({
      stageId: stage.id,
      stageCode: stage.stageCode,
      stageName: stage.name,
      seq: stage.seq,
      documentRef: stage.documentRef,
      isCTQ: stage.isCTQ,
      gateStatus: "PENDING",
      latestInspectionNo: null,
      latestInspectionDate: null,
      openNCRs: 0,
      canProceed: false,
    }));
  }

  // Determine if the work order can proceed overall
  const allGatesPassed = gateStatus.every(g => g.gateStatus === "PASSED");
  const anyGateFailed = gateStatus.some(g => g.gateStatus === "FAILED");
  const anyGateHold = gateStatus.some(g => g.gateStatus === "ON HOLD");

  return NextResponse.json({
    plant,
    gates: gateStatus,
    overallStatus: allGatesPassed ? "ALL_GATES_PASSED" : anyGateFailed ? "BLOCKED" : anyGateHold ? "ON_HOLD" : "IN_PROGRESS",
    canProceed: allGatesPassed,
    totalGates: gateStatus.length,
    passedGates: gateStatus.filter(g => g.gateStatus === "PASSED").length,
    pendingGates: gateStatus.filter(g => g.gateStatus === "PENDING").length,
    failedGates: gateStatus.filter(g => g.gateStatus === "FAILED").length,
    holdGates: gateStatus.filter(g => g.gateStatus === "ON HOLD").length,
  });
}
