import { connectDB } from "@/lib/db";
import DataModel from "@/models/DataModel";

export async function POST(req) {
  try {
    await connectDB();
    const data = await req.json();
    console.log("Received data:", data);


    const saved = await DataModel.create({
      temperature: data.temperature,
      humidity: data.humidity,
      current: data.current,
      deviceId: data.deviceId,
    });

    return Response.json({ success: true, data: saved });
  } catch (error) {
    console.error("❌ API Error:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();
    const records = await DataModel.find().sort({ createdAt: -1 }).limit(10);
    return Response.json({ success: true, data: records });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
