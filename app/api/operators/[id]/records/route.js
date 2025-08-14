// app/api/operators/[id]/records/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import DailyProduction from "@/models/DailyProduction";

export async function GET(req, { params }) {
  try {
    await connectDB();

    const operatorId = params.id;

    // সব daily production load for this operator
    const records = await DailyProduction.find({
      "operator._id": operatorId
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
