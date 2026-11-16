import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/sales-orders - Returns sales orders grouped by SO number with linked WOs
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const plant = searchParams.get("plant") || "K2";

  // Fetch all work orders for this plant with their linked records
  const workOrders = await db.workOrder.findMany({
    where: { routeCode: plant },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { inspections: true, ncrs: true, materialLots: true, genealogy: true, reworkJobs: true },
      },
    },
  });

  // Group work orders by SO number to create the SO -> WO relationship
  const soMap = new Map<string, any>();

  for (const w of workOrders) {
    const soKey = w.soNumber || `NO-SO-${w.woNumber}`;
    if (!soMap.has(soKey)) {
      soMap.set(soKey, {
        soNumber: w.soNumber || "",
        customer: w.customer,
        customerPo: w.customerPo || "",
        salesPerson: w.salesPerson || "",
        itemName: w.itemName,
        size: w.size,
        finishType: w.finishType,
        // SO-level quantities: sum across all linked WOs
        orderedQty: 0,
        completedQty: 0,
        rejectedQty: 0,
        reworkQty: 0,
        plannedQty: 0,
        workOrders: [],
        earliestCreated: w.createdAt,
        latestUpdated: w.updatedAt,
      });
    }

    const so = soMap.get(soKey);
    so.orderedQty += w.plannedQty;
    so.plannedQty += w.plannedQty;
    so.completedQty += w.completedQty;
    so.rejectedQty += w.rejectedQty;
    so.reworkQty += w.reworkQty;
    if (w.createdAt < so.earliestCreated) so.earliestCreated = w.createdAt;
    if (w.updatedAt > so.latestUpdated) so.latestUpdated = w.updatedAt;

    so.workOrders.push({
      id: w.id,
      woNumber: w.woNumber,
      status: w.status,
      priority: w.priority,
      plannedQty: w.plannedQty,
      completedQty: w.completedQty,
      rejectedQty: w.rejectedQty,
      reworkQty: w.reworkQty,
      materialStatus: w.materialStatus,
      routeCode: w.routeCode,
      inspectionCount: w._count.inspections,
      ncrCount: w._count.ncrs,
      reworkJobCount: w._count.reworkJobs,
      htuCount: w._count.genealogy,
      materialLotCount: w._count.materialLots,
    });
  }

  // Convert to array and compute SO-level metrics
  const salesOrders = Array.from(soMap.values()).map((so, i) => {
    const pendingQty = Math.max(0, so.orderedQty - so.completedQty - so.rejectedQty);
    const acceptedQty = so.completedQty; // Units that passed QC (completed = accepted + released)
    const fulfilmentRate = so.orderedQty > 0 ? Number(((so.completedQty / so.orderedQty) * 100).toFixed(1)) : 0;
    const hasMaterialShortage = so.workOrders.some((w: any) => w.materialStatus === "Not Available" || w.materialStatus === "Partial");
    const hasHold = so.workOrders.some((w: any) => w.status === "On Hold");
    const allWOsCompleted = so.workOrders.length > 0 && so.workOrders.every((w: any) => w.status === "Completed" || w.status === "Short Closed");

    return {
      srNo: i + 1,
      soNumber: so.soNumber,
      soDate: new Date(so.earliestCreated).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      poNumber: so.customerPo,
      customer: so.customer,
      itemName: so.itemName,
      size: so.size,
      finishType: so.finishType,
      salesPerson: so.salesPerson,
      orderedQty: so.orderedQty,
      completedQty: so.completedQty,
      acceptedQty,
      rejectedQty: so.rejectedQty,
      reworkQty: so.reworkQty,
      pendingQty,
      fulfilmentRate,
      status: allWOsCompleted ? "Completed" : hasHold ? "On Hold" : "In Progress",
      hasMaterialShortage,
      hasHold,
      linkedWOs: so.workOrders,
      woCount: so.workOrders.length,
    };
  });

  // Summary at SO level
  const totalOrdered = salesOrders.reduce((s, so) => s + so.orderedQty, 0);
  const totalCompleted = salesOrders.reduce((s, so) => s + so.completedQty, 0);
  const totalRejected = salesOrders.reduce((s, so) => s + so.rejectedQty, 0);
  const totalRework = salesOrders.reduce((s, so) => s + so.reworkQty, 0);
  const totalPending = salesOrders.reduce((s, so) => s + so.pendingQty, 0);

  return NextResponse.json({
    salesOrders,
    summary: {
      totalOrders: salesOrders.length,
      totalWOs: workOrders.length,
      totalOrdered,
      totalCompleted,
      totalRejected,
      totalRework,
      totalPending,
      fulfillmentRate: totalOrdered > 0 ? Number(((totalCompleted / totalOrdered) * 100).toFixed(1)) : 0,
    },
  });
}
