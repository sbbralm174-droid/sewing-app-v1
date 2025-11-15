import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import DailyProduction from '@/models/DailyProduction';
import Operator from '@/models/Operator';

export async function POST(req) {
  try {
    await connectDB();
    console.log("✅ Connected to DB");

    const { id, hourlyProduction } = await req.json();
    console.log("📩 Received:", { id, hourlyProduction });

    if (!id || !hourlyProduction || !Array.isArray(hourlyProduction)) {
      console.log("❌ Invalid request format");
      return NextResponse.json(
        { message: 'Invalid request. Document ID and hourlyProduction array are required.' },
        { status: 400 }
      );
    }

    // Step 1️⃣: Find report
    const report = await DailyProduction.findById(id);
    if (!report) {
      console.log("❌ Report not found for ID:", id);
      return NextResponse.json({ message: 'Daily production report not found.' }, { status: 404 });
    }
    console.log("✅ Found DailyProduction:", report._id);

    // Step 2️⃣: Update hourly production
    report.hourlyProduction = hourlyProduction;
    await report.save();
    console.log("✅ HourlyProduction updated in report");

    // Step 3️⃣: Find Operator
    if (!report.operator?.operatorId) {
      console.log("⚠️ No operatorId found in report:", report.operator);
    } else {
      const operatorId = report.operator.operatorId;
      const operator = await Operator.findOne({ operatorId });

      if (!operator) {
        console.log("❌ Operator not found for ID:", operatorId);
      } else {
        console.log("✅ Found Operator:", operator.operatorId);

        const lineName = report.line || report.lineName || 'Unknown Line';

        for (const hourData of hourlyProduction) {
          const { processName, productionCount, productionDate } = hourData;

          console.log("➡️ Checking:", { processName, productionCount, productionDate });

          if (!processName || typeof productionCount !== 'number') {
            console.log("⚠️ Skipped invalid process data:", hourData);
            continue;
          }

          const currentScore = operator.allowedProcesses?.get(processName) || 0;
          const newScore = Number(productionCount);

          console.log(`📊 Process: ${processName}, current: ${currentScore}, new: ${newScore}`);

          if (newScore > currentScore) {
            console.log(`🔼 New higher score found for ${processName}`);

            operator.previousProcessScores.push({
              processName,
              previousScore: currentScore,
              line: lineName,
              date: productionDate,
            });

            operator.allowedProcesses.set(processName, newScore);
          } else {
            console.log(`🟡 No update needed for ${processName}`);
          }
        }

        await operator.save();
        console.log("✅ Operator updated successfully");
      }
    }

    return NextResponse.json(
      {
        message: 'Hourly production data and operator performance updated successfully.',
        updatedReport: report,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error in POST API for hourly update:', error);
    return NextResponse.json(
      { message: 'An error occurred while saving the hourly report.', error: error.message },
      { status: 500 }
    );
  }
}
