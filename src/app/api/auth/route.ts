import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/auth - login
export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: "Username and password required" }, { status: 400 });
  }
  const user = await db.qmsUser.findUnique({
    where: { username: username.toLowerCase() },
  });
  if (!user || user.password !== password) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  if (user.status !== "Active") {
    return NextResponse.json({ error: "Account suspended. Contact your administrator." }, { status: 403 });
  }
  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      plant: user.plant,
      assignedStages: user.assignedStages ? JSON.parse(user.assignedStages) : [],
      managedStages: user.managedStages ? JSON.parse(user.managedStages) : [],
      shiftPreference: user.shiftPreference,
    },
  });
}
