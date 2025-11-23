// app/api/servicing/hello

import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import ServiceHistory from "@/models/MachineServicingHistory";
import Machine from "@/models/Machine";
import { NextResponse } from "next/server";
import { getIoInstance } from "@/lib/socket"; // 🟢 Socket helper import




// Utility function to calculate the next service date based on interval
const calculateNextServiceDate = (intervalDays) => {
  if (!intervalDays || intervalDays <= 0) return null;
  const now = new Date();
  const nextDate = new Date(now);
  nextDate.setDate(now.getDate() + intervalDays);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
};

export async function POST(req) {
  try {
    await connectDB();

    const {
      machineId,
      partUniqueId,
      servicedBy,
      description,
      nextIntervalDays,
      nextServiceDate,
    } = await req.json();

    if (!machineId || !partUniqueId || !servicedBy) {
      return NextResponse.json(
        { success: false, message: "Required fields missing." },
        { status: 400 }
      );
    }

    const machine = await Machine.findById(machineId);
    if (!machine) {
      return NextResponse.json(
        { success: false, message: "Machine not found" },
        { status: 404 }
      );
    }

    const partIndex = machine.parts.findIndex(
      (p) => p.uniquePartId === partUniqueId
    );
    if (partIndex === -1) {
      return NextResponse.json(
        { success: false, message: "Part not found" },
        { status: 404 }
      );
    }

    const servicedPart = machine.parts[partIndex];
    const previousServiceDate = servicedPart.lastServicedDate;

    // 1️⃣ নতুন Last Serviced Date
    const newLastServicedDate = new Date();
    let newNextServiceDate;

    // 2️⃣ Next Service Date নির্ধারণ
    if (nextServiceDate) {
      newNextServiceDate = new Date(nextServiceDate);
      newNextServiceDate.setHours(0, 0, 0, 0);
    } else {
      const intervalDays =
        nextIntervalDays ||
        servicedPart.customIntervalDays ||
        servicedPart.defaultIntervalDays;
      newNextServiceDate = calculateNextServiceDate(intervalDays);
    }

    // 3️⃣ সার্ভিস হিস্টরি তৈরি
    await ServiceHistory.create({
      machineId: machine._id,
      uniqueId: machine.uniqueId,
      partName: servicedPart.partName,
      partUniqueId: servicedPart.uniquePartId,
      servicedBy,
      description,
      serviceDate: newLastServicedDate,
      previousServiceDate: previousServiceDate,
      nextServiceDate: newNextServiceDate,
    });

    // 4️⃣ মেশিন আপডেট
    machine.parts[partIndex].lastServicedDate = newLastServicedDate;
    machine.parts[partIndex].nextServiceDate = newNextServiceDate;

    if (nextIntervalDays) {
      machine.parts[partIndex].customIntervalDays = nextIntervalDays;
    }
    await machine.save();

    // 5️⃣ ✅ নোটিফিকেশন ডিলিট
    const notificationKey = {
      uniqueId: machine.uniqueId,
      partName: servicedPart.partName,
    };

    const deleteResult = await Notification.deleteMany(notificationKey);
    console.log(`🗑️ Deleted ${deleteResult.deletedCount} notifications from database`);

    // 🟢 Socket Emit Section
    const io = getIoInstance();
    if (io && deleteResult.deletedCount > 0) {
      const payload = {
        uniqueId: machine.uniqueId,
        partName: servicedPart.partName,
        deletedCount: deleteResult.deletedCount,
      };
      io.emit("notifications-deleted", payload);
      console.log("⚡ Socket event emitted:", payload);
    } else {
      console.log("⚠️ Socket not initialized or no notifications deleted.");
    }

    // ✅ Response
    const nextServiceDisplay = newNextServiceDate
      ? newNextServiceDate.toDateString()
      : "Not scheduled";

    return NextResponse.json({
      success: true,
      message: `Successfully serviced ${servicedPart.partName}. Next service due: ${nextServiceDisplay}`,
      deletedCount: deleteResult.deletedCount,
    });
  } catch (error) {
    console.error("❌ Service completion error:", error);
    return NextResponse.json(
      { success: false, message: "Error completing service" },
      { status: 500 }
    );
  }
}





export async function GET() {
  return NextResponse.json({
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
}
