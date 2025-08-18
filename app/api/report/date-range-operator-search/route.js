// app/api/daily-production/search/route.js
import { connectDB } from "@/lib/db";
import DailyProduction from "@/models/DailyProduction";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectDB();
    const { startDate, endDate, operatorSearch } = await req.json();

    if (!startDate || !endDate || !operatorSearch) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const productions = await DailyProduction.find({
      date: { $gte: start, $lte: end },
      $or: [
        { "operator.name": { $regex: operatorSearch, $options: "i" } },
        { "operator.operatorId": { $regex: operatorSearch, $options: "i" } },
      ],
    }).sort({ date: 1 });

    return NextResponse.json(productions);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
