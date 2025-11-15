import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    const notifications = await Notification.find().sort({ date: -1 });
    return NextResponse.json({ success: true, notifications });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Error fetching notifications" });
  }
}
