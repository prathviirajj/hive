import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/rework?status=...&limit=50
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const limit = Number(searchParams.get("limit") || 50);

  const where: any = {};
  if (status && status !== "all") where.status = status;

  const jobs = await db.reworkJobOrder.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      workOrder: { select: { woNumber: true, customer: true, itemName: true } },
      costLines: true,
      events: { orderBy: { timestamp: "desc" }, take: 10 },
    },
  });

  return NextResponse.json({ jobs });
}

// POST /api/rework - create a standalone rework job (not from inspection)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const seq = await db.reworkJobOrder.count();
  const rwoNumber = `RW-K2-${new Date().getFullYear()}-${String(seq + 1).padStart(6, "0")}`;

  const job = await db.reworkJobOrder.create({
    data: {
      rwoNumber,
      workOrderId: body.workOrderId || null,
      htuNo: body.htuNo || null,
      originatingProcess: body.originatingProcess || "Unknown",
      detectionProcess: body.detectionProcess || body.originatingProcess || "Unknown",
      defectCategory: body.defectCategory || "Other",
      defectDescription: body.defectDescription || "",
      defectQuantity: body.defectQuantity || 1,
      severity: body.severity || "Major",
      status: "Reported",
      disposition: "Rework",
      currentLocation: "Reported - pending tag",
    },
  });

  // Record creation event
  await db.reworkEvent.create({
    data: {
      rwoId: job.id,
      eventType: "CREATED",
      toStatus: "Reported",
      toLocation: "Reported - pending tag",
      notes: `Manually created rework request`,
    },
  });

  return NextResponse.json({ job });
}
