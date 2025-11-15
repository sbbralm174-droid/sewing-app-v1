import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import DailyProduction from "@/models/DailyProduction";

export async function PUT(req) {
  try {
    await connectDB();

    const { date, operatorId, updateData } = await req.json();

    if (!date || !operatorId) {
      return NextResponse.json(
        { success: false, message: "date এবং operatorId প্রয়োজন!" },
        { status: 400 }
      );
    }

    // ✅ এক দিনের সীমার মধ্যে খোঁজা হবে
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // ✅ পুরনো ডেটা খোঁজা হচ্ছে
    const existing = await DailyProduction.findOne({
      date: { $gte: startOfDay, $lte: endOfDay },
      "operator.operatorId": operatorId,
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "এই operator ও date অনুযায়ী কোনো রেকর্ড পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    // ✅ CHECK: uniqueMachine পরিবর্তন হয়েছে কিনা
    const isMachineChanged =
      updateData.uniqueMachine &&
      updateData.uniqueMachine !== existing.uniqueMachine;

    // ✅ যদি machine পরিবর্তন হয় → hourlyProduction খালি করে দাও
    if (isMachineChanged) {
      existing.hourlyProduction = [];
    }

    // ✅ বাকি update ফিল্ডগুলো merge করা হচ্ছে
    Object.assign(existing, updateData);

    await existing.save();

    return NextResponse.json({
      success: true,
      message: isMachineChanged
        ? "uniqueMachine পরিবর্তিত হয়েছে — hourlyProduction রিসেট করা হয়েছে।"
        : "DailyProduction ডেটা সফলভাবে আপডেট হয়েছে।",
      updatedData: existing,
    });
  } catch (error) {
    console.error("❌ Update Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
