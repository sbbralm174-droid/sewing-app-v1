// app/api/adminInterview/route.js

import { NextResponse } from "next/server";
import { connectDB } from '@/lib/db';
import AdminInterview from "@/models/AdminInterview";
import VivaInterview from "@/models/IepInterview";

// CREATE Admin Interview
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    // Validate viva candidate exists
    const viva = await VivaInterview.findById(body.candidateId);
    if (!viva) {
      return NextResponse.json({ success: false, error: "Candidate not found" }, { status: 404 });
    }

    const adminInterview = await AdminInterview.create(body);

    // Update viva if passed to admin
    viva.promotedToAdmin = true;
    await viva.save();

    return NextResponse.json({ success: true, data: adminInterview });
  } catch (error) {
    console.error("❌ Admin Interview Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// GET All Admin Interviews
export async function GET() {
  try {
    await connectDB();
    const admins = await AdminInterview.find()
      .populate("candidateId")
      .sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: admins });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
