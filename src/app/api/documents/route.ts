import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/documents?status=...&category=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");

  const where: any = {};
  if (status && status !== "all") where.status = status;
  if (category && category !== "all") where.category = category;

  const docs = await db.controlledDocument.findMany({
    where,
    orderBy: [{ category: "asc" }, { docNumber: "asc" }],
  });

  return NextResponse.json({ documents: docs });
}
