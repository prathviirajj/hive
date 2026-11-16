import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// PATCH /api/rework/[id] - update rework job status or fields
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const body = await req.json();
  const { id } = await params;

  const existing = await db.reworkJobOrder.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Rework job not found" }, { status: 404 });
  }

  const fromStatus = existing.status;
  const toStatus = body.status || fromStatus;

  const updated = await db.reworkJobOrder.update({
    where: { id },
    data: {
      status: toStatus,
      disposition: body.disposition || existing.disposition,
      currentLocation: body.currentLocation || existing.currentLocation,
      holdReason: body.holdReason || existing.holdReason,
      closureJustification: body.closureJustification || existing.closureJustification,
      actualCost: body.actualCost !== undefined ? body.actualCost : existing.actualCost,
      approvedCost: body.approvedCost !== undefined ? body.approvedCost : existing.approvedCost,
    },
  });

  // Record the status change event if status changed
  if (toStatus !== fromStatus) {
    await db.reworkEvent.create({
      data: {
        rwoId: id,
        eventType: "STATUS_CHANGE",
        fromStatus,
        toStatus,
        notes: `Status changed by ${body.updatedBy || "system"}`,
      },
    });
  }

  return NextResponse.json({ job: updated });
}
