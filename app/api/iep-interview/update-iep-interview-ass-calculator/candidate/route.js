// app/api/iep-interview/get-by-candidate/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import VivaInterview from "@/models/IepInterview";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get("candidateId");

    let query = {};

    // যদি candidateId পাওয়া যায় → সেই candidate এর সব ডকুমেন্ট
    if (candidateId) {
      query = { candidateId };
    }

    // MongoDB থেকে ডাটা ফেচ
    const results = await VivaInterview.find(query).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error("❌ Error fetching viva data:", error);

    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
