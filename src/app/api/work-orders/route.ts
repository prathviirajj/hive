import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/work-orders?status=...&route=...&plant=K2
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const route = searchParams.get("route");
  const plant = searchParams.get("plant") || "K2";

  const where: any = {};
  if (status && status !== "all") where.status = status;
  if (route && route !== "all") where.routeCode = route;
  else if (plant && plant !== "all") where.routeCode = plant;

  const workOrders = await db.workOrder.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { inspections: true, ncrs: true, materialLots: true, genealogy: true },
      },
    },
  });

  return NextResponse.json({ workOrders });
}

// POST /api/work-orders - create new work order
export async function POST(req: NextRequest) {
  const body = await req.json();
  const wo = await db.workOrder.create({
    data: {
      woNumber: body.woNumber,
      soNumber: body.soNumber || null,
      customer: body.customer,
      customerPo: body.customerPo || null,
      itemName: body.itemName,
      size: body.size,
      finishType: body.finishType,
      routeCode: body.routeCode,
      plannedQty: Number(body.plannedQty) || 1,
      priority: body.priority || "Medium",
      status: body.status || "Released",
      materialStatus: body.materialStatus || "Available",
      salesPerson: body.salesPerson || null,
      plannedStart: body.plannedStart ? new Date(body.plannedStart) : new Date(),
      plannedEnd: body.plannedEnd ? new Date(body.plannedEnd) : new Date(Date.now() + 7 * 86400000),
    },
  });
  return NextResponse.json({ workOrder: wo });
}
