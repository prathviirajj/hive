import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/equipment
export async function GET() {
  const equipment = await db.equipment.findMany({
    orderBy: { assetCode: "asc" },
  });

  const today = new Date();
  const enriched = equipment.map((e) => {
    const overdue = e.nextCalibration && e.nextCalibration < today;
    const dueIn30Days = e.nextCalibration && e.nextCalibration > today && new Date(e.nextCalibration.getTime() - 30 * 86400000) < today;
    return { ...e, calibrationStatus: overdue ? "Overdue" : dueIn30Days ? "Due Soon" : "OK" };
  });

  return NextResponse.json({ equipment: enriched });
}
