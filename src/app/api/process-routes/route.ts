import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/process-routes?code=K1
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (code) {
    const route = await db.processRoute.findUnique({
      where: { code },
      include: {
        stages: {
          orderBy: { seq: "asc" },
          include: { characteristics: { orderBy: { seq: "asc" } } },
        },
      },
    });
    if (!route) return NextResponse.json({ error: "Route not found" }, { status: 404 });
    return NextResponse.json({ route });
  }

  const routes = await db.processRoute.findMany({
    include: {
      stages: {
        orderBy: { seq: "asc" },
        select: { id: true, stageCode: true, name: true, isCTQ: true, isGate: true, documentRef: true, responsibleRole: true, timing: true, _count: { select: { characteristics: true } } },
      },
      _count: { select: { stages: true } },
    },
    orderBy: { code: "asc" },
  });
  return NextResponse.json({ routes });
}
