import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/ncrs?status=...&severity=...&plant=K2
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const severity = searchParams.get("severity");
  const plant = searchParams.get("plant") || "K2";

  const where: any = {};
  if (status && status !== "all") where.status = status;
  if (severity && severity !== "all") where.severity = severity;
  if (plant && plant !== "all") where.workOrder = { routeCode: plant };

  const ncrs = await db.nonconformance.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      workOrder: { select: { woNumber: true, customer: true, itemName: true, size: true, routeCode: true } },
    },
  });

  return NextResponse.json({ ncrs });
}

// PATCH /api/ncrs - update NCR (e.g., add root cause, CAPA, close)
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const data: any = {};
  for (const k of ["status", "rootCause", "correctiveAction", "containment", "capaOwner", "defectCategory", "severity", "description"]) {
    if (updates[k] !== undefined) data[k] = updates[k];
  }
  if (updates.dueDate) data.dueDate = new Date(updates.dueDate);
  if (updates.effectivenessVerified !== undefined) {
    data.effectivenessVerified = updates.effectivenessVerified;
    if (updates.effectivenessVerified && updates.status === "Effectiveness-Check") {
      data.status = "Closed";
      data.closedAt = new Date();
    }
  }

  const ncr = await db.nonconformance.update({ where: { id }, data });
  return NextResponse.json({ ncr });
}
