// app/api/check-servicing-status/route.js
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    await connectDB();
    const { uniqueId, partName } = await request.json();

    // Check if notification exists for this machine part
    const existingNotification = await Notification.findOne({
      uniqueId: uniqueId,
      partName: partName
    });

    return NextResponse.json({ 
      success: true, 
      hasNotification: !!existingNotification,
      notification: existingNotification 
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ 
      success: false, 
      message: "Error checking servicing status" 
    });
  }
}