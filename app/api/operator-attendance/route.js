import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

const Operator = require("@/models/Operator");
const DailyProduction = require("@/models/DailyProduction");

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const dateString =
      searchParams.get("date") ||
      new Date().toISOString().split("T")[0];

    const start = new Date(dateString);
    start.setHours(0, 0, 0, 0);

    const end = new Date(dateString);
    end.setHours(23, 59, 59, 999);

    const [operators, productions] = await Promise.all([
      Operator.find({}).lean(),

      DailyProduction.find({
        date: {
          $gte: start,
          $lte: end,
        },
      }).lean(),
    ]);

    const productionMap = new Map();

    productions.forEach((item) => {
      const totalProduction = (item.hourlyProduction || []).reduce(
        (sum, h) => sum + (h.productionCount || 0),
        0
      );

      productionMap.set(item.operator.operatorId, {
        status: "Present",

        process:
          item.breakdownProcessTitle ||
          item.breakdownProcess ||
          item.process ||
          "-",

        production: totalProduction,

        floor: item.floor,
        line: item.line,
      });
    });

    const result = operators.map((op) => {
      const found = productionMap.get(op.operatorId);

      return {
        _id: op._id,
        operatorId: op.operatorId,
        employeeId: op.employeeId,
        name: op.name,
        designation: op.designation,

        status: found ? found.status : "Absent",

        process: found ? found.process : "-",

        production: found ? found.production : 0,

        floor: found?.floor || "-",
        line: found?.line || "-",
      };
    });

    result.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(result);
  } catch (err) {
    console.log(err);

    return NextResponse.json(
      {
        success: false,
        message: err.message,
      },
      {
        status: 500,
      }
    );
  }
}