import { NextResponse } from "next/server";
import Machine from "@/models/Machine";
import { connectDB } from "@/lib/db";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const uniqueId = searchParams.get("uniqueId");

    if (!uniqueId) {
      return NextResponse.json({ success: false, message: "uniqueId দিতে হবে" }, { status: 400 });
    }

    const machine = await Machine.findOne({ uniqueId }).populate('machineType');
    if (!machine) {
      return NextResponse.json({ success: false, message: "Machine পাওয়া যায়নি" }, { status: 404 });
    }

    return NextResponse.json({ success: true, machine });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
