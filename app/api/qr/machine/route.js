import { connectDB } from "@/lib/db";
import QRCode from "qrcode";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const machineId = searchParams.get("machineId");

    if (!machineId) {
      return new Response(JSON.stringify({ error: "Machine ID is required" }), {
        status: 400,
      });
    }

    // Connect to database
    const db = await connectDB();
    
    // Find machine
    const machine = await db.collection("machines").findOne({ 
      $or: [
        { _id: new mongoose.Types.ObjectId(machineId) },
        { uniqueId: machineId }
      ]
    });

    if (!machine) {
      return new Response(JSON.stringify({ error: "Machine not found" }), {
        status: 404,
      });
    }

    // Create QR code data with type identifier
    const qrData = {
      type: "machine",
      id: machine._id.toString(),
      uniqueId: machine.uniqueId,
      machineType: machine.machineType?.name || "Unknown"
    };

    // Generate QR code
    const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));

    return new Response(
      JSON.stringify({
        qrCode,
        machine: {
          uniqueId: machine.uniqueId,
          machineType: machine.machineType?.name,
          currentStatus: machine.currentStatus
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating machine QR code:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate QR code" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}