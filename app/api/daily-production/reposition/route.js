// /app/api/dailyproduction/reposition/route.js

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import DailyProduction from "@/models/DailyProduction";

export async function PUT(req) {
  try {
    await connectDB();
    const { date, fromOperatorId, toOperatorId } = await req.json();

    if (!date || !fromOperatorId || !toOperatorId) {
      return NextResponse.json({
        success: false,
        message: "date, fromOperatorId, এবং toOperatorId প্রয়োজন।",
      });
    }

    // ওই day's data fetch & sort by position
    const list = await DailyProduction.find({ date }).sort({ position: 1 });

    const fromIndex = list.findIndex(op => op.operator.operatorId === fromOperatorId);
    const toIndex = list.findIndex(op => op.operator.operatorId === toOperatorId);

    if (fromIndex === -1 || toIndex === -1) {
      return NextResponse.json({
        success: false,
        message: "দেওয়া operatorId গুলোর মধ্যে অন্তত একটি পাওয়া যায়নি।",
      });
    }

    // remove & insert
    const [moved] = list.splice(fromIndex, 1);
    list.splice(toIndex + 1, 0, moved);

    // auto update position
    for (let i = 0; i < list.length; i++) {
      await DailyProduction.findByIdAndUpdate(list[i]._id, { position: i + 1 });
    }

    return NextResponse.json({
      success: true,
      message: "Operator reposition সফল হয়েছে ✅"
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: error.message });
  }
}
