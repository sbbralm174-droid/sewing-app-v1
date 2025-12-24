import { connectDB } from "@/lib/db";
import DailyProduction from "@/models/DailyProduction";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const floor = searchParams.get("floor");
    const line = searchParams.get("line");
    const type = searchParams.get("type"); 

    if (!date || !type) {
      return NextResponse.json(
        { message: "Date and Report Type are required" },
        { status: 400 }
      );
    }

    // ১. ডেট রেঞ্জ ঠিক করা
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // ২. প্রাথমিক Match Stage (ইনডেক্স ব্যবহার করার জন্য)
    const matchStage = {
      date: { $gte: startDate, $lte: endDate },
    };

    if (floor) matchStage.floor = floor;
    if (line) matchStage.line = line;

    // ৩. লজিক অনুযায়ী দ্বিতীয় Match Stage তৈরি
    let logicMatch = {};

    if (type === "operator-workAs-helper") {
      logicMatch = {
        "operator.designation": { $regex: /operator/i }, // Designation contains "Operator" (case-insensitive)
        "workAs": { $regex: /^helper$/i }               // WorkAs is "Helper"
      };
    } else if (type === "helper-workAs-operator") {
      logicMatch = {
        "operator.designation": { $regex: /helper/i },   // Designation contains "Helper"
        "workAs": { $regex: /^operator$/i }             // WorkAs is "Operator"
      };
    } else {
       return NextResponse.json({ message: "Invalid type" }, { status: 400 });
    }

    // ৪. Aggregation Pipeline চালানো
    const results = await DailyProduction.aggregate([
      // Stage 1: Basic Filtering (Date, Floor, Line)
      { $match: matchStage },

      // Stage 2: Mismatch Logic Filtering
      { $match: logicMatch },

      // Stage 3: Sorting (Optional - by Line)
      { $sort: { line: 1, "operator.operatorId": 1 } },

      // Stage 4: Projection (ডাটা সুন্দর করে সাজিয়ে ফ্রন্টএন্ডে পাঠানো)
      {
        $project: {
          _id: 1,
          date: 1,
          // অপারেটর অবজেক্ট ফ্ল্যাট করে পাঠানো হচ্ছে যাতে ফ্রন্টএন্ডে কাজ করা সহজ হয়
          operatorId: "$operator.operatorId",
          name: "$operator.name",
          designation: "$operator.designation",
          workAs: 1,
          floor: 1,
          line: 1,
          uniqueMachine: 1,
          styleId: 1
        }
      }
    ]);

    return NextResponse.json({
      count: results.length,
      data: results.map(item => ({
        // ফ্রন্টএন্ডের আগের স্ট্রাকচার ঠিক রাখার জন্য সামান্য ম্যাপ করা হলো
        // অথবা আপনি চাইলে ফ্রন্টএন্ড কোড বদলে সরাসরি ফ্ল্যাট ডাটা ব্যবহার করতে পারেন
        _id: item._id,
        floor: item.floor,
        line: item.line,
        workAs: item.workAs,
        uniqueMachine: item.uniqueMachine,
        operator: {
            operatorId: item.operatorId,
            name: item.name,
            designation: item.designation
        }
      })),
    });

  } catch (error) {
    console.error("Aggregation Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}