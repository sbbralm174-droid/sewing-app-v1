import { NextResponse } from "next/server";
import {connectDB} from "@/lib/db";
import Operator from "@/models/Operator";
import DailyProduction from "@/models/DailyProduction";

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    let date = searchParams.get("date");

    // default: আজকের তারিখ
    if (!date) {
      const today = new Date();
      date = today.toISOString().split("T")[0];
    }

    // তারিখ normalize
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // মোট operator
    const allOperators = await Operator.find();

    // ওই দিনের সব entry
    const dailyEntries = await DailyProduction.find({
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    // প্রতিটি operator status
    const operatorStatus = allOperators.map((op) => {
      const entry = dailyEntries.find(
        (e) => e.operator.operatorId === op.operatorId
      );

      if (entry) {
        return {
          operatorId: op.operatorId,
          name: op.name,
          designation: op.designation,
          grade: op.grade,
          supervisor: entry.supervisor,
          floor: entry.floor,
          line: entry.line,
          process: entry.process,
          machineType: entry.machineType,
          uniqueMachine: entry.uniqueMachine,
          target: entry.target,
          workAs: entry.workAs,
          status: entry.status,
        };
      } else {
        // Entry নাই → absent
        return {
          operatorId: op.operatorId,
          name: op.name,
          designation: op.designation,
          grade: op.grade,
          supervisor: "-",
          floor: "-",
          line: "-",
          process: "-",
          machineType: "-",
          uniqueMachine: "-",
          target: 0,
          workAs: "-",
          status: "absent",
        };
      }
    });

    const presentCount = operatorStatus.filter((o) => o.status === "present").length;
    const absentCount = operatorStatus.filter((o) => o.status === "absent").length;

    return NextResponse.json({
      searchDate: date,
      totalOperators: allOperators.length,
      present: presentCount,
      absent: absentCount,
      operators: operatorStatus,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
