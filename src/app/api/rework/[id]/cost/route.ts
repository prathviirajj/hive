import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/rework/[id]/cost - add a cost line to a rework job
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const body = await req.json();
  const { id } = await params;

  const existing = await db.reworkJobOrder.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Rework job not found" }, { status: 404 });
  }

  const quantity = parseFloat(body.quantity) || 0;
  const rateAmount = parseFloat(body.rateAmount) || 0;
  const amount = body.amount !== undefined ? parseFloat(body.amount) : quantity * rateAmount;

  const costLine = await db.reworkCostLine.create({
    data: {
      rwoId: id,
      component: body.component || "Other",
      description: body.description || "",
      quantity,
      unit: body.unit || "nos",
      rateAmount,
      amount,
    },
  });

  // Update the rework job's actualCost to the sum of all cost lines
  const allLines = await db.reworkCostLine.findMany({ where: { rwoId: id } });
  const totalActual = allLines.reduce((s, c) => s + c.amount, 0);
  await db.reworkJobOrder.update({
    where: { id },
    data: { actualCost: totalActual },
  });

  // Record the cost capture event
  await db.reworkEvent.create({
    data: {
      rwoId: id,
      eventType: "COST_CAPTURED",
      notes: `${body.component}: INR ${amount.toLocaleString()} (${body.description || ""}) - recorded by ${body.recordedBy || "system"}`,
    },
  });

  return NextResponse.json({ costLine, totalActualCost: totalActual });
}
