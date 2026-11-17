import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/users?role=...&department=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");
  const department = searchParams.get("department");

  const where: any = {};
  if (role && role !== "all") where.role = role;
  if (department && department !== "all") where.department = department;

  const users = await db.qmsUser.findMany({
    where,
    orderBy: { createdAt: "asc" },
    select: {
      id: true, username: true, name: true, email: true, role: true,
      department: true, plant: true, phone: true, employeeId: true,
      status: true, assignedStages: true, managedStages: true,
      shiftPreference: true, managerId: true, createdAt: true,
    },
  });

  return NextResponse.json({ users });
}

// POST /api/users - create new user (admin/manager only - enforced client-side)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const existing = await db.qmsUser.findUnique({ where: { username: body.username } });
  if (existing) {
    return NextResponse.json({ error: "Username already exists" }, { status: 400 });
  }
  const existingEmail = await db.qmsUser.findUnique({ where: { email: body.email } });
  if (existingEmail) {
    return NextResponse.json({ error: "Email already exists" }, { status: 400 });
  }
  const user = await db.qmsUser.create({
    data: {
      username: body.username,
      password: body.password,
      name: body.name,
      email: body.email,
      role: body.role || "Operator",
      department: body.department || null,
      plant: body.plant || "K2",
      phone: body.phone || null,
      employeeId: body.employeeId || null,
      status: body.status || "Active",
      assignedStages: body.assignedStages ? JSON.stringify(body.assignedStages) : null,
      managedStages: body.managedStages ? JSON.stringify(body.managedStages) : null,
      shiftPreference: body.shiftPreference || null,
      managerId: body.managerId || null,
    },
  });
  return NextResponse.json({ user: { ...user, password: undefined } });
}

// PATCH /api/users - update user (role, status, permissions, stage assignments, managerId)
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const data: any = {};
  for (const k of ["role", "department", "status", "shiftPreference", "phone", "employeeId", "plant", "managerId"]) {
    if (updates[k] !== undefined) data[k] = updates[k];
  }
  if (updates.assignedStages) data.assignedStages = JSON.stringify(updates.assignedStages);
  if (updates.managedStages) data.managedStages = JSON.stringify(updates.managedStages);
  if (updates.permissions) data.permissions = JSON.stringify(updates.permissions);
  if (updates.password) data.password = updates.password;

  const user = await db.qmsUser.update({ where: { id }, data });
  return NextResponse.json({ user: { ...user, password: undefined } });
}

// DELETE /api/users
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.qmsUser.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
