import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/materials?status=...&type=...&plant=K2
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const plant = searchParams.get("plant") || "K2";

  const where: any = {};
  if (status && status !== "all") where.inspectionStatus = status;
  if (type && type !== "all") where.materialType = type;
  if (plant && plant !== "all") where.workOrder = { routeCode: plant };

  const lots = await db.materialLot.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      workOrder: { select: { woNumber: true, customer: true, itemName: true } },
    },
  });

  return NextResponse.json({ lots });
}
