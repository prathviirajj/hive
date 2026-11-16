import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/fmea?stage=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const stage = searchParams.get("stage");

  const where: any = {};
  if (stage) where.stageName = { contains: stage };

  const records = await db.fmeaRecord.findMany({
    where,
    orderBy: { rpn: "desc" },
  });

  return NextResponse.json({ records });
}

// PATCH /api/fmea - update FMEA record
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const data: any = {};
  for (const k of ["status", "recommendedAction", "actionOwner", "actionPriority", "failureMode", "failureEffect", "potentialCause", "preventionControl", "detectionControl"]) {
    if (updates[k] !== undefined) data[k] = updates[k];
  }
  // Risk scoring
  if (updates.severity !== undefined) data.severity = Number(updates.severity);
  if (updates.occurrence !== undefined) data.occurrence = Number(updates.occurrence);
  if (updates.detection !== undefined) data.detection = Number(updates.detection);
  if (data.severity !== undefined || data.occurrence !== undefined || data.detection !== undefined) {
    const existing = await db.fmeaRecord.findUnique({ where: { id } });
    if (existing) {
      const sev = data.severity ?? existing.severity;
      const occ = data.occurrence ?? existing.occurrence;
      const det = data.detection ?? existing.detection;
      data.rpn = sev * occ * det;
    }
  }
  if (updates.actionDueDate) data.actionDueDate = new Date(updates.actionDueDate);
  data.lastReviewedAt = new Date();

  const rec = await db.fmeaRecord.update({ where: { id }, data });
  return NextResponse.json({ record: rec });
}
