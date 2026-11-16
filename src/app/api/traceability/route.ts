import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/traceability?htu=...&wo=...&plant=K2
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const htu = searchParams.get("htu");
  const woNumber = searchParams.get("wo");
  const plant = searchParams.get("plant") || "K2";

  if (htu) {
    const genealogy = await db.productGenealogy.findUnique({
      where: { htuno: htu },
      include: {
        workOrder: {
          include: {
            inspections: {
              take: 50,
              orderBy: { inspectedAt: "asc" },
              select: {
                recordNo: true,
                overallResult: true,
                ctqResult: true,
                inspectedAt: true,
                inspector: true,
                stage: { select: { name: true, stageCode: true } },
              },
            },
            ncrs: { select: { ncrNumber: true, defectCategory: true, severity: true, status: true, description: true } },
            materialLots: { select: { lotNumber: true, materialType: true, supplier: true, inspectionStatus: true } },
          },
        },
      },
    });
    if (!genealogy) return NextResponse.json({ error: "HTU not found" }, { status: 404 });
    return NextResponse.json({ genealogy });
  }

  // List all genealogies
  const where: any = {};
  if (woNumber) {
    const wo = await db.workOrder.findUnique({ where: { woNumber: wo } as any });
    if (wo) where.workOrderId = wo.id;
  } else if (plant && plant !== "all") {
    where.workOrder = { routeCode: plant };
  }
  const genealogies = await db.productGenealogy.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      workOrder: { select: { woNumber: true, customer: true, itemName: true, finishType: true, routeCode: true } },
    },
  });
  return NextResponse.json({ genealogies });
}
