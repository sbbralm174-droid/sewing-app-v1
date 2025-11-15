import { NextResponse } from "next/server";
import { connectDB } from '@/lib/db';
import VivaInterview from "@/models/IepInterview";




export async function GET() {
  try {
    await connectDB();
    const candidates = await VivaInterview.find();
    return NextResponse.json(candidates);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch candidates" },
      { status: 500 }
    );
  }
}