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

  // যদি এটি প্রথম ইউজার হয়, role স্বয়ংক্রিয়ভাবে superadmin
  const userCount = await User.countDocuments();
  const finalRole = userCount === 0 ? "superadmin" : role;

  const user = await User.create({
    name,
    email,
    userId,
    password: hashedPassword,
    role: finalRole,
    designation, // এখানে employee title/set
    permissions: finalRole === "superadmin" ? ["*"] : []
  });

  return NextResponse.json({ message: "User created", user });
}
