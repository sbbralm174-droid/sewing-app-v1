import { connectDB } from "@/lib/db";
import DailyProduction from "@/models/DailyProduction";
import Supervisor from "@/models/Supervisor";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const line = searchParams.get("line");

    if (!date || !line) {
      return NextResponse.json(
        { error: "Missing date or line" },
        { status: 400 }
      );
    }

    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const productions = await DailyProduction.find({
      date: { $gte: startDate, $lte: endDate },
      line: line,
    }).lean();

    if (!productions.length) {
      return NextResponse.json({ message: "No data found" }, { status: 404 });
    }

    // Supervisor name from ID
    let supervisorName = productions[0].supervisor;
    if (supervisorName && /^[0-9a-fA-F]{24}$/.test(supervisorName)) {
      const sup = await Supervisor.findById(supervisorName).lean();
      if (sup) supervisorName = sup.name;
    }

    const lineNumber = productions[0].line;

    const tableData = productions.map((p) => {
      const achievement = p.hourlyProduction?.reduce(
        (sum, hp) => sum + (hp.productionCount || 0),
        0
      );

      return {
        operatorId: p.operator?.operatorId || "",
        operatorName: p.operator?.name || "",
        designation: p.operator?.designation || "",
        machineType: p.machineType || "",
        uniqueMachine: p.uniqueMachine || "",
        process: p.process || "",
        target: p.target || 0,
        achievement: achievement || 0,
        workAs: p.workAs || "",
        status: p.status || "",
      };
    });

    // Separate helpers & operators
    const operators = tableData.filter((d) => d.workAs === "operator");
    const helpers = tableData.filter((d) => d.workAs === "helper");

    return NextResponse.json({
      line: lineNumber,
      supervisor: supervisorName,
      operators,
      helpers,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
