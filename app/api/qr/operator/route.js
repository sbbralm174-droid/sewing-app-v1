import { connectDB } from "@/lib/db";
import QRCode from "qrcode";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const operatorId = searchParams.get("operatorId");

    if (!operatorId) {
      return new Response(JSON.stringify({ error: "Operator ID is required" }), {
        status: 400,
      });
    }

    // Connect to database
    const db = await connectDB();
    
    // Find operator
    const operator = await db.collection("operators").findOne({ 
      $or: [
        { _id: new mongoose.Types.ObjectId(operatorId) },
        { operatorId: operatorId }
      ]
    });

    if (!operator) {
      return new Response(JSON.stringify({ error: "Operator not found" }), {
        status: 404,
      });
    }

    // Create QR code data with type identifier
    const qrData = {
      type: "operator",
      id: operator._id.toString(),
      operatorId: operator.operatorId,
      name: operator.name,
      designation: operator.designation
    };

    // Generate QR code
    const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));

    return new Response(
      JSON.stringify({
        qrCode,
        operator: {
          name: operator.name,
          operatorId: operator.operatorId,
          designation: operator.designation
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating operator QR code:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate QR code" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}