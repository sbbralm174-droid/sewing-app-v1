import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db.js";
import Machine from "@/models/Machine.js";

export async function POST(req) {
  try {
    await connectDB();

    const { uniqueId, lastServiced, interval } = await req.json();

    const machine = await Machine.findOne({ uniqueId: decodeURIComponent(uniqueId) });

    if (!machine) {
      return NextResponse.json({ success: false, message: "Machine not found" });
    }

    // Update only the fields provided
    if (lastServiced) {
      machine.servicingConfig.lastServiced = new Date(lastServiced);
    } else {
      machine.servicingConfig.lastServiced = new Date(); // default current date
    }

    const usedInterval = interval ? Number(interval) : machine.servicingConfig.defaultInterval || 15;
    machine.servicingConfig.customInterval = usedInterval;
    machine.servicingConfig.nextServiceDate = new Date(
      machine.servicingConfig.lastServiced.getTime() + usedInterval * 24 * 60 * 60 * 1000
    );

    await machine.save();

    return NextResponse.json({
      success: true,
      message: "Machine servicing updated successfully",
      machine,
    });
  } catch (error) {
    console.error("Error updating machine servicing:", error);
    return NextResponse.json({ success: false, message: error.message });
  }
}
