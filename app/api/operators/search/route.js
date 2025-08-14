// app/api/operators/search/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Operator from "@/models/Operator";
import DailyProduction from "@/models/DailyProduction";

export async function POST(req) {
  try {
    await connectDB();
    const { processes } = await req.json();

    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // allowedProcesses match করা operator
    const operators = await Operator.find({
      allowedProcesses: { $in: processes },
    });

    // প্রতিটি operator-এর current date status attach
    const results = await Promise.all(
      operators.map(async (op) => {
        const record = await DailyProduction.findOne({
          "operator._id": op._id,
          date: { $gte: today, $lt: tomorrow },
        });
        return {
          ...op.toObject(),
          status: record ? record.status : "absent",
        };
      })
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || "Failed to search operators" },
      { status: 500 }
    );
  }
}
