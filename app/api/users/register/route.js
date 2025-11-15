import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req) {
  await connectDB();
  const { name, email, userId, password, role, designation } = await req.json();

  const existingUser = await User.findOne({ $or: [{ email }, { userId }] });
  if (existingUser) return NextResponse.json({ message: "User already exists" }, { status: 400 });

  const hashedPassword = await bcrypt.hash(password, 10);

  // প্রথম ইউজারকে superadmin বানানো
  const userCount = await User.countDocuments();
  const finalRole = userCount === 0 ? "superadmin" : role;

  const user = await User.create({
    name,
    email,
    userId,
    password: hashedPassword,
    role: finalRole,
    designation,
    permissions: finalRole === "superadmin" ? ["*"] : []
  });

  return NextResponse.json({ message: "User created", user });
}
