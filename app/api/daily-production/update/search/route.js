import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import DailyProduction from "@/models/DailyProduction";

export async function POST(req) {
  try {
    await connectDB();
    const { date, operatorId } = await req.json();

    if (!date || !operatorId) {
      return NextResponse.json({ success: false, message: "date এবং operatorId প্রয়োজন" });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const data = await DailyProduction.findOne({
      date: { $gte: startOfDay, $lte: endOfDay },
      "operator.operatorId": operatorId,
    });

    if (!data) {
      return NextResponse.json({
        success: false,
        message: "কোনো ডেটা পাওয়া যায়নি।",
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
