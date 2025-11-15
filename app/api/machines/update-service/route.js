import { NextResponse } from "next/server";
import Machine from "@/models/Machine";
import { connectDB } from "@/lib/db";

export async function PUT(req) {
  try {
    await connectDB();
    const { uniqueId, lastServiced, customInterval, isNotificationActive } = await req.json();

    if (!uniqueId) {
      return NextResponse.json({ success: false, message: "uniqueId দিতে হবে" }, { status: 400 });
    }

    const machine = await Machine.findOne({ uniqueId });
    if (!machine) {
      return NextResponse.json({ success: false, message: "Machine পাওয়া যায়নি" }, { status: 404 });
    }

    const updateData = {};

    if (lastServiced) {
      const lastDate = new Date(lastServiced);
      updateData['servicingConfig.lastServiced'] = lastDate;

      const interval = customInterval ?? machine.servicingConfig.defaultInterval ?? 15;
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + interval);

      updateData['servicingConfig.nextServiceDate'] = nextDate;
    }

    if (customInterval !== undefined) {
      updateData['servicingConfig.customInterval'] = customInterval;
      // যদি lastServiced থাকে, nextServiceDate already set
      if (lastServiced) {
        // nextServiceDate set already
      } else if (machine.servicingConfig.lastServiced) {
        const nextDate = new Date(machine.servicingConfig.lastServiced);
        nextDate.setDate(nextDate.getDate() + customInterval);
        updateData['servicingConfig.nextServiceDate'] = nextDate;
      }
    }

    if (isNotificationActive !== undefined) {
      updateData['servicingConfig.isNotificationActive'] = isNotificationActive;
    }

    const updatedMachine = await Machine.findOneAndUpdate(
      { uniqueId },
      { $set: updateData },
      { new: true }
    );

    return NextResponse.json({ success: true, machine: updatedMachine });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
