import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import DailyProduction from "@/models/DailyProduction";

function getDateRange(dateStr) {
  const d = dateStr || new Date().toISOString().split("T")[0];
  const start = new Date(d);
  const end = new Date(d);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const floorQ = searchParams.get("floor"); // ঐচ্ছিক: নির্দিষ্ট floor ফিল্টার
    const { start, end } = getDateRange(date);

    const match = {
      date: { $gte: start, $lt: end },
      status: { $ne: "absent" },
    };
    if (floorQ) match.floor = floorQ;

    const data = await DailyProduction.aggregate([
      { $match: match },
      {
        $addFields: {
          achievement: { $sum: "$hourlyProduction.productionCount" },
        },
      },
      {
        $group: {
          _id: { floor: "$floor", line: "$line" },
          totalTarget: { $sum: "$target" },
          totalAchievement: { $sum: "$achievement" },
        },
      },
      {
        $project: {
          _id: 0,
          floor: "$_id.floor",
          line: "$_id.line",
          totalTarget: 1,
          totalAchievement: 1,
          percentage: {
            $cond: [
              { $eq: ["$totalTarget", 0] },
              0,
              { $multiply: [{ $divide: ["$totalAchievement", "$totalTarget"] }, 100] },
            ],
          },
        },
      },
      { $sort: { floor: 1, line: 1 } },
    ]);

    // Totals (optional)
    const totals = data.reduce(
      (acc, cur) => {
        acc.totalTarget += cur.totalTarget || 0;
        acc.totalAchievement += cur.totalAchievement || 0;
        return acc;
      },
      { totalTarget: 0, totalAchievement: 0 }
    );
    const totalPercentage =
      totals.totalTarget > 0
        ? (totals.totalAchievement / totals.totalTarget) * 100
        : 0;

    return NextResponse.json({
      date: (date || new Date().toISOString().split("T")[0]),
      rows: data,
      summary: {
        totalTarget: totals.totalTarget,
        totalAchievement: totals.totalAchievement,
        percentage: totalPercentage,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
