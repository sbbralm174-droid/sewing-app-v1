import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Machine from "@/models/Machine";

export async function GET(req, context) {
  try {
    await connectDB();

    // ✅ এখানে await context.params দিতে হবে
    const { machineId } = await context.params;

    const machine = await Machine.findOne({
      uniqueId: decodeURIComponent(machineId),
    });

    if (!machine) {
      return NextResponse.json(
        { success: false, message: "Machine not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, machine });
  } catch (error) {
    console.error("❌ Error fetching machine:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
