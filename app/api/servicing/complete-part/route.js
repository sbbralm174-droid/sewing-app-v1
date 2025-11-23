import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import ServiceHistory from "@/models/MachineServicingHistory";
import Machine from "@/models/Machine";
import { NextResponse } from "next/server";
import { getIoInstance } from "@/lib/socket";

// UTC based date calculation for consistency
const calculateNextServiceDate = (intervalDays) => {
  if (!intervalDays || intervalDays <= 0) return null;
  const now = new Date();
  const nextDate = new Date(now);
  // Using UTC methods for date arithmetic to avoid timezone shifts
  nextDate.setUTCDate(now.getUTCDate() + intervalDays); 
  nextDate.setUTCHours(0, 0, 0, 0); // Sets to midnight UTC
  return nextDate;
};

export async function POST(request) {
  console.log("📩 Incoming POST → /api/servicing/complete-part");

  try {
    // -----------------------------
    console.log("⏳ Connecting DB...");
    await connectDB();
    console.log("✅ DB Connected");

    // -----------------------------
    console.log("📥 Reading request body...");
    const body = await request.json();
    console.log("📦 Request Body:", body);

    const {
      machineId,
      partUniqueId,
      servicedBy,
      description,
      nextIntervalDays,
      nextServiceDate,
    } = body;

    // -----------------------------
    console.log("🧪 Validating body fields...");
    if (!machineId || !partUniqueId || !servicedBy) {
      console.log("❌ Missing required fields:", {
        machineId,
        partUniqueId,
        servicedBy,
      });

      return NextResponse.json(
        { success: false, message: "Required fields missing." },
        { status: 400 }
      );
    }

    // -----------------------------
    // NOTE: We fetch the machine just to get the existing part data (like lastServicedDate)
    console.log("🔎 Finding Machine:", machineId);
    const machine = await Machine.findById(machineId);

    if (!machine) {
      console.log("❌ Machine not found with ID:", machineId);
      return NextResponse.json(
        { success: false, message: "Machine not found" },
        { status: 404 }
      );
    }

    // Creating a temporary array of plain objects for searching
    // We map to plain objects to ensure the findIndex comparison is safe.
    const partsArray = machine.parts.map((p) => p.toObject ? p.toObject() : p);

    console.log("Parts array plain JS:", partsArray);

    const partIndex = partsArray.findIndex(
      (p) => p.uniquePartId?.trim().toLowerCase() === partUniqueId?.trim().toLowerCase()
    );

    console.log("partIndex:", partIndex);


    if (partIndex === -1) {
      console.log("❌ Part not found inside machine.parts");
      return NextResponse.json(
        { success: false, message: "Part not found" },
        { status: 404 }
      );
    }

    console.log("✅ Part Found at index:", partIndex);

    // We use servicedPartData (the plain object) to read the original values safely.
    const servicedPartData = partsArray[partIndex];
    
    console.log("🔧 Serviced Part Data (Plain Object):", servicedPartData);

    // -----------------------------
    const previousServiceDate = servicedPartData.lastServicedDate; // Read from plain object
    const newLastServicedDate = new Date();

    console.log("⏳ Previous Service Date:", previousServiceDate);
    console.log("🆕 New Last Service Date:", newLastServicedDate);

    // -----------------------------
    let newNextServiceDate;

    if (nextServiceDate) {
      console.log("📅 Using custom nextServiceDate:", nextServiceDate);
      newNextServiceDate = new Date(nextServiceDate);
      // Ensure consistency by setting to start of day UTC
      newNextServiceDate.setUTCHours(0, 0, 0, 0);
    } else {
      console.log("📅 Calculating next service date...");

      const intervalDays =
        nextIntervalDays ||
        servicedPartData.customIntervalDays ||
        servicedPartData.defaultIntervalDays;

      console.log("📆 Interval Days:", intervalDays);

      newNextServiceDate = calculateNextServiceDate(intervalDays);
    }

    console.log("📅 Final Next Service Date:", newNextServiceDate);

    // -----------------------------
    console.log("📝 Creating Service History...");

    // Using values extracted from the plain object for safety
    const historyPartName = servicedPartData.partName;
    const historyPartUniqueId = servicedPartData.uniquePartId;

    console.log("🔥 Service History Data:", {
        historyPartName,
        historyPartUniqueId,
        servicedBy,
        machineId: machine._id,
    });
    
    await ServiceHistory.create({
      machineId: machine._id,
      uniqueId: machine.uniqueId,
      partName: historyPartName,
      partUniqueId: historyPartUniqueId,
      servicedBy,
      description,
      serviceDate: newLastServicedDate,
      previousServiceDate: previousServiceDate,
      nextServiceDate: newNextServiceDate,
    });

    console.log("✅ Service history created.");

    // -----------------------------
    console.log("🛠 Updating Machine Part Info (Direct DB Update)...");
    
    // FIX: Building the update object using the positional operator ($)
    // This bypasses the faulty custom validator during subdocument update.
    const updateFields = {
      'parts.$.lastServicedDate': newLastServicedDate,
      'parts.$.nextServiceDate': newNextServiceDate,
    };

    if (nextIntervalDays) {
      console.log("🔧 Updating customIntervalDays →", nextIntervalDays);
      updateFields['parts.$.customIntervalDays'] = nextIntervalDays;
    }
    
    // Perform the direct update using findOneAndUpdate
    const updateResult = await Machine.findOneAndUpdate(
        // Query: Find the specific Machine and the specific part within its 'parts' array
        { _id: machineId, 'parts.uniquePartId': partUniqueId },
        // Update: Use $set with the positional operator '$' to update ONLY the matched part
        { $set: updateFields },
        // Options: Return the updated document if needed (not strictly necessary here, but good practice)
        { new: true } 
    );
    
    if (updateResult) {
        console.log("✅ Machine part updated directly in DB.");
    } else {
        console.log("⚠️ Machine update failed or part not found during update.");
    }


    // -----------------------------
    console.log("🗑️ Deleting Notifications...");

    const notificationKey = {
      uniqueId: machine.uniqueId,
      partName: servicedPartData.partName, // Use safely extracted name
    };

    console.log("🔑 Notification delete query:", notificationKey);

    const deleteResult = await Notification.deleteMany(notificationKey);
    console.log(
      `🗑️ Deleted ${deleteResult.deletedCount} notifications from database`
    );

    // -----------------------------
    console.log("📡 Emitting socket event if needed...");

    const io = getIoInstance();
    if (io && deleteResult.deletedCount > 0) {
      const payload = {
        uniqueId: machine.uniqueId,
        partName: servicedPartData.partName, // Use safely extracted name
        deletedCount: deleteResult.deletedCount,
      };

      io.emit("notifications-deleted", payload);
      console.log("⚡ Socket event emitted:", payload);
    } else {
      console.log("⚠️ No socket emit → reason:", {
        socket: !!io,
        deleted: deleteResult.deletedCount,
      });
    }

    // -----------------------------
    const nextServiceDisplay = newNextServiceDate
      ? newNextServiceDate.toDateString()
      : "Not scheduled";

    console.log("📤 Sending final response...");

    return NextResponse.json({
      success: true,
      message: `Successfully serviced ${servicedPartData.partName}. Next service due: ${nextServiceDisplay}`,
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