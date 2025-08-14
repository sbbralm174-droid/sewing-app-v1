// app/api/operators/status/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import DailyProduction from "@/models/DailyProduction";
import Operator from "@/models/Operator";

export async function GET(req) {
  try {
    await connectDB();

    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // সব operator load
    const allOperators = await Operator.find();

    // আজকের daily production load
    const todaysRecords = await DailyProduction.find({
      date: { $gte: today, $lt: tomorrow }
    });

    // map করে operator status তৈরি
    const operatorStatus = allOperators.map(op => {
      const record = todaysRecords.find(r => r.operator._id.toString() === op._id.toString());
      return {
        _id: op._id,
        name: op.name,
        operatorId: op.operatorId,
        designation: op.designation,
        status: record ? record.status : "absent",  // match না হলে absent
        recordId: record ? record._id : null
      };
    });

    return NextResponse.json(operatorStatus);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
