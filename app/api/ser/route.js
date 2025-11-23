import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import ServiceHistory from "@/models/MachineServicingHistory";
import Machine from "@/models/Machine";
import { NextResponse } from "next/server";
import { getIoInstance } from "@/lib/socket"; // Socket.IO utility function

/**
 * Utility function to calculate the next service date based on the interval days.
 * @param {number} intervalDays - The number of days after which the next service is due.
 * @returns {Date | null} The calculated next service date, or null if interval is invalid.
 */
const calculateNextServiceDate = (intervalDays) => {
  if (!intervalDays || intervalDays <= 0) return null;
  const now = new Date();
  const nextDate = new Date(now);
  // Add the interval days to the current date
  nextDate.setDate(now.getDate() + intervalDays); 
  // Set time to start of the day for consistent comparison
  nextDate.setHours(0, 0, 0, 0); 
  return nextDate;
};

/**
 * Handles POST request to mark a machine part service as complete.
 * This function updates the machine status, creates a service history record,
 * and deletes pending notifications.
 */
export async function POST(req) {
  try {
    // Ensure database connection is established
    await connectDB();

    const {
      machineId,
      partUniqueId,
      servicedBy,
      description,
      nextIntervalDays, // Optional: New custom interval in days
      nextServiceDate,  // Optional: Specific next date to set
    } = await req.json();

    // 1. Basic Input Validation
    if (!machineId || !partUniqueId || !servicedBy) {
      console.error("❌ Missing required service completion fields.");
      return NextResponse.json(
        { success: false, message: "Required fields missing (machineId, partUniqueId, servicedBy)." },
        { status: 400 }
      );
    }

    // 2. Find the Machine
    const machine = await Machine.findById(machineId);
    if (!machine) {
      console.warn(`⚠️ Machine not found with ID: ${machineId}`);
      return NextResponse.json(
        { success: false, message: "Machine not found" },
        { status: 404 }
      );
    }

    // 3. Find the specific Part within the machine
    const partIndex = machine.parts.findIndex(
      (p) => p.uniquePartId === partUniqueId
    );
    if (partIndex === -1) {
      console.warn(`⚠️ Part not found with unique ID: ${partUniqueId} in machine ${machineId}`);
      return NextResponse.json(
        { success: false, message: "Part not found" },
        { status: 404 }
      );
    }

    const servicedPart = machine.parts[partIndex];
    const previousServiceDate = servicedPart.lastServicedDate;

    // --- Service Date Calculation Logic ---

    // Set the new last serviced date to now
    const newLastServicedDate = new Date();
    let newNextServiceDate;

    if (nextServiceDate) {
      // Option A: Specific date provided by the user
      newNextServiceDate = new Date(nextServiceDate);
      newNextServiceDate.setHours(0, 0, 0, 0);
    } else {
      // Option B: Calculate based on interval days (custom > default)
      const intervalDays =
        nextIntervalDays ||
        servicedPart.customIntervalDays ||
        servicedPart.defaultIntervalDays;
      newNextServiceDate = calculateNextServiceDate(intervalDays);
    }

    // --- Database Updates ---

    // 4. Create Service History Record
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
    console.log(`✅ Service history created for part: ${servicedPart.partName}`);

    // 5. Update Machine Part details (Last and Next service dates)
    machine.parts[partIndex].lastServicedDate = newLastServicedDate;
    machine.parts[partIndex].nextServiceDate = newNextServiceDate;

    // Optionally update the custom interval if provided
    if (nextIntervalDays) {
      machine.parts[partIndex].customIntervalDays = nextIntervalDays;
    }
    await machine.save();
    console.log(`✅ Machine part updated successfully.`);


    // 6. Delete Service Notifications
    const notificationKey = {
      uniqueId: machine.uniqueId,
      partName: servicedPart.partName,
    };

    const deleteResult = await Notification.deleteMany(notificationKey);
    console.log(`🗑️ Deleted ${deleteResult.deletedCount} notifications from database`);

    // --- Socket Communication ---

    const io = getIoInstance();
    if (io && deleteResult.deletedCount > 0) {
      // Emit real-time event that notifications related to this part were cleared
      const payload = {
        uniqueId: machine.uniqueId,
        partName: servicedPart.partName,
        deletedCount: deleteResult.deletedCount,
      };
      io.emit("notifications-deleted", payload);
      console.log("⚡ Socket event emitted: notifications-deleted");
    } else {
      console.log("ℹ️ No socket event emitted (Socket not ready or no notifications deleted).");
    }

    // 7. Success Response
    const nextServiceDisplay = newNextServiceDate
      ? newNextServiceDate.toDateString()
      : "Not scheduled";

    return NextResponse.json({
      success: true,
      message: `Successfully serviced ${servicedPart.partName}. Next service due: ${nextServiceDisplay}`,
      deletedCount: deleteResult.deletedCount,
    });

  } catch (error) {
    // 8. Error Handling (Internal Server Error)
    console.error("❌ Fatal Service completion error:", error);
    return NextResponse.json(
      { success: false, message: "Error completing service. Check server logs for details." },
      { status: 500 }
    );
  }
}


/**
 * Temporary GET function for health check (works fine).
 */
export async function GET() {
  return NextResponse.json({
    message: 'API is working (complete-part route is accessible)',
    timestamp: new Date().toISOString()
  });
}