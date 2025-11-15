import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import ServiceHistory from "@/models/MachineServicingHistory"; // Updated model name (assuming you used the updated ServiceHistory.js)
import Machine from "@/models/Machine";
import { NextResponse } from "next/server";

// Utility function to calculate the next service date
const calculateNextServiceDate = (intervalDays) => {
  if (!intervalDays || intervalDays <= 0) return null;
  const now = new Date();
  const nextDate = new Date(now);
  nextDate.setDate(now.getDate() + intervalDays);
  nextDate.setHours(0, 0, 0, 0); // Normalize date
  return nextDate;
};

export async function POST(req) {
  try {
    await connectDB();
    // New required input: partUniqueId
    const { machineId, partUniqueId, servicedBy, description } = await req.json();

    if (!machineId || !partUniqueId || !servicedBy) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: machineId, partUniqueId, and servicedBy." },
        { status: 400 }
      );
    }

    const machine = await Machine.findById(machineId);
    if (!machine) {
      return NextResponse.json({ success: false, message: "Machine not found" }, { status: 404 });
    }

    // 1. Find the specific part being serviced
    const partIndex = machine.parts.findIndex(p => p.uniquePartId === partUniqueId);
    if (partIndex === -1) {
      return NextResponse.json({ success: false, message: "Part not found on this machine" }, { status: 404 });
    }

    const servicedPart = machine.parts[partIndex];
    const previousServiceDate = servicedPart.lastServicedDate;
    
    // Determine the service interval (use custom if available, otherwise default)
    const intervalDays = servicedPart.customIntervalDays || servicedPart.defaultIntervalDays;
    
    // Calculate new dates
    const newLastServicedDate = new Date();
    const newNextServiceDate = calculateNextServiceDate(intervalDays);

    // 2. ✅ Create Service History Entry
    const history = await ServiceHistory.create({
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

    // 3. ✅ Update the Machine's Part Configuration
    machine.parts[partIndex].lastServicedDate = newLastServicedDate;
    machine.parts[partIndex].nextServiceDate = newNextServiceDate;
    await machine.save();

    // 4. ✅ Remove notification for this specific part on this machine
    // We use the uniqueId (machine) and partName (part) to target the exact notification.
    await Notification.deleteMany({ 
        uniqueId: machine.uniqueId,
        partName: servicedPart.partName,
        // Optionally, you could also delete by partUniqueId if you added it to the Notification model
    });

    return NextResponse.json({
      success: true,
      message: `Servicing completed for Part: ${servicedPart.partName} on Machine: ${machine.uniqueId}.`,
      history,
    });
  } catch (error) {
    console.error("Service completion error:", error);
    return NextResponse.json({ success: false, message: "Error completing service" }, { status: 500 });
  }
}