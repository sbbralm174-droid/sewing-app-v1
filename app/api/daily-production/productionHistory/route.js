import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import DailyProduction from "@/models/DailyProduction";
import ProductionHistory from "@/models/ProductionHistory";

export async function POST(req) {
  try {
    await connectDB();

    const { date, operatorId, savedBy } = await req.json();

    if (!date || !operatorId) {
      return NextResponse.json(
        { success: false, message: "date এবং operatorId দুইটাই লাগবে!" },
        { status: 400 }
      );
    }

    // একদিনের সময়সীমা নির্ধারণ
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // পুরনো ডেটা খোঁজা
    const existingData = await DailyProduction.findOne({
      date: { $gte: startOfDay, $lte: endOfDay },
      "operator.operatorId": operatorId,
    });

    if (!existingData) {
      return NextResponse.json({
        success: false,
        message: "এই date ও operatorId অনুযায়ী কোনো data পাওয়া যায়নি।",
      });
    }

    // ✅ এখন History তে পুরনো ডেটা সংরক্ষণ করা হচ্ছে
    const newHistory = new ProductionHistory({
      dailyProductionRef: existingData._id, // ✅ REQUIRED field
      date: existingData.date,
      operator: existingData.operator,
      supervisor: existingData.supervisor,
      floor: existingData.floor,
      line: existingData.line,
      process: existingData.process,
      status: existingData.status,
      machineType: existingData.machineType,
      uniqueMachine: existingData.uniqueMachine,
      target: existingData.target,
      workAs: existingData.workAs,
      hourlyProduction: existingData.hourlyProduction,
      savedBy: savedBy || "system",
      savedAt: new Date(),
    });

    await newHistory.save();

    return NextResponse.json({
      success: true,
      message: "Production history সফলভাবে সংরক্ষণ হয়েছে।",
      data: newHistory,
    });
  } catch (error) {
    console.error("❌ History Save Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
