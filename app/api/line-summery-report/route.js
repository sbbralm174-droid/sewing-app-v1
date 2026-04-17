// import { NextResponse } from 'next/server';
// import { connectDB } from '@/lib/db';
// import DailyProduction from '@/models/DailyProduction';

// export async function GET(request) {
//   try {
//     await connectDB();

//     const { searchParams } = new URL(request.url);

//     const date      = searchParams.get('date');       // YYYY-MM-DD
//     const floor     = searchParams.get('floor');
//     const line      = searchParams.get('line');
//     const startDate = searchParams.get('startDate');
//     const endDate   = searchParams.get('endDate');

//     // Match stage
//     const match = {};

//     if (date) {
//       const targetDate = new Date(date);
//       match.date = {
//         $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
//         $lte: new Date(targetDate.setHours(23, 59, 59, 999))
//       };
//     } else if (startDate && endDate) {
//       match.date = {
//         $gte: new Date(startDate),
//         $lte: new Date(endDate)
//       };
//     }

//     if (floor) match.floor = floor;
//     if (line)  match.line  = line;

//     const summary = await DailyProduction.aggregate([
//       { $match: match },

//       {
//         $group: {
//           _id: {
//             date:  { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
//             floor: "$floor",
//             line:  "$line"
//           },
//           // ==================== সবচেয়ে গুরুত্বপূর্ণ অংশ ====================
//           totalManpower: { $sum: 1 },                    // প্রতি document = ১ জন
//           totalOperator: {
//             $sum: {
//               $cond: [
//                 { $eq: [{ $toLower: "$workAs" }, "operator"] }, 
//                 1, 
//                 0
//               ]
//             }
//           },
//           totalHelper: {
//             $sum: {
//               $cond: [
//                 { $eq: [{ $toLower: "$workAs" }, "helper"] }, 
//                 1, 
//                 0
//               ]
//             }
//           },
//           hourlyTarget: { 
//             $sum: { $ifNull: ["$hourlyTarget", "$target"] } 
//           },
//           totalSMV: { 
//             $sum: { 
//               $convert: { 
//                 input: "$smv", 
//                 to: "double", 
//                 onError: 0, 
//                 onNull: 0 
//               } 
//             } 
//           },
//           totalRecords: { $sum: 1 },
//           supervisors: { $addToSet: "$supervisor" }
//         }
//       },

//       { $sort: { "_id.date": -1, "_id.floor": 1, "_id.line": 1 } },

//       {
//         $project: {
//           _id: 0,
//           date:           "$_id.date",
//           floor:          "$_id.floor",
//           line:           "$_id.line",
//           totalManpower:  1,
//           totalOperator:  1,
//           totalHelper:    1,
//           hourlyTarget:   { $round: ["$hourlyTarget", 2] },
//           totalSMV:       { $round: ["$totalSMV", 2] },
//           totalRecords:   1,
//           supervisors:    1
//         }
//       }
//     ]);

//     return NextResponse.json({
//       success: true,
//       data: summary,
//       count: summary.length
//     });

//   } catch (error) {
//     console.error("Production summary API error:", error);
//     return NextResponse.json(
//       { success: false, message: error.message || "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// }


import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import DailyProduction from '@/models/DailyProduction';
import HistoryDailyProduction from '@/models/HistoryDailyProduction';
import { Breakdown } from '@/models/Breakdown';
import '@/models/Buyer';
import '@/models/Style';

const HOUR_MAP = {
  "08-09 AM": 1, "09-10 AM": 2, "10-11 AM": 3, "11-12 AM": 4,
  "12-02 PM": 5, "02-03 PM": 6, "03-04 PM": 7, "04-05 PM": 8,
  "05-06 PM": 9, "06-07 PM": 10, "07-08 PM": 11, "08-09 PM": 12,
  "09-10 PM": 13, "10-11 PM": 14, "11-12 PM": 15
};

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');

    if (!dateParam) {
      return NextResponse.json({ message: 'date query is required' }, { status: 400 });
    }

    const startDate = new Date(dateParam);
    const endDate = new Date(dateParam);
    endDate.setHours(23, 59, 59, 999);

    // --- ১. আন্ডন এপিআই থেকে NPT ক্যালকুলেশন ---
    let nptMap = {};
    try {
      const andonRes = await fetch(`https://andon-microcontroller-project-two.vercel.app/api/table?startDate=${dateParam}&endDate=${dateParam}`);
      const andonJson = await andonRes.json();
      if (andonJson.success && andonJson.data) {
        andonJson.data.forEach(item => {
          const parts = item.deviceId.split('-');
          if (parts.length >= 4) {
            const lineNumber = parts[3].padStart(2, '0');
            const formattedLine = `PODDO-${lineNumber}`;
            const duration = parseFloat(item.onDuration) || 0;
            nptMap[formattedLine] = (nptMap[formattedLine] || 0) + duration;
          }
        });
      }
    } catch (err) {
      console.error("Andon API Error:", err);
    }

    // --- ২. ডাটা ফেচিং ---
    const [mainRecords, historyRecords] = await Promise.all([
      DailyProduction.find({ date: { $gte: startDate, $lte: endDate } })
        .populate('buyerId', 'name').populate('styleId', 'name').lean(),
      HistoryDailyProduction.find({ date: { $gte: startDate, $lte: endDate } })
        .populate('buyerId', 'name').populate('styleId', 'name').lean()
    ]);

    const lineMap = {};

    const getLineObj = (lineKey, doc) => {
      if (!lineMap[lineKey]) {
        lineMap[lineKey] = {
          line: lineKey,
          buyer: doc?.buyerId?.name || '',
          style: doc?.styleId?.name || '',
          jobNo: doc?.jobNo || '', // jobNo এখানে যুক্ত করা হয়েছে
          totalManpower: doc?.totalManpower || '', 
          breakdownTitle: doc?.breakdownProcessTitle || '',
          totalSmv: 0,
          operatorCount: 0,
          helperCount: 0,
          hourlyTarget: 0,
          totalWorkingMinutes: 0,
          opWorkAsHelper: 0,
          helperWorkAsOp: 0
        };
      }
      if (!lineMap[lineKey].buyer && doc?.buyerId?.name) lineMap[lineKey].buyer = doc.buyerId.name;
      if (!lineMap[lineKey].style && doc?.styleId?.name) lineMap[lineKey].style = doc.styleId.name;
      if (!lineMap[lineKey].jobNo && doc?.jobNo) lineMap[lineKey].jobNo = doc.jobNo; // jobNo আপডেট
      if (!lineMap[lineKey].totalManpower && doc?.totalManpower) lineMap[lineKey].totalManpower = doc.totalManpower; 
      if (!lineMap[lineKey].breakdownTitle && doc?.breakdownProcessTitle) lineMap[lineKey].breakdownTitle = doc.breakdownProcessTitle;

      return lineMap[lineKey];
    };

    const getRealRole = (designation) => {
      if (!designation) return 'operator';
      return designation.toUpperCase().includes('ASST') ? 'helper' : 'operator';
    };

    // --- ৩. হিস্ট্রি ও মেইন প্রোডাকশন প্রসেসিং ---
    const processRecord = (doc, isHistory = false) => {
      const lineObj = getLineObj(doc.line, doc);
      const realRole = getRealRole(doc.operator?.designation);
      const currentWorkAs = doc.workAs; 

      if (currentWorkAs === 'operator') lineObj.operatorCount += 1;
      else if (currentWorkAs === 'helper') lineObj.helperCount += 1;

      if (realRole === 'operator' && currentWorkAs === 'helper') {
        lineObj.opWorkAsHelper += 1;
      } else if (realRole === 'helper' && currentWorkAs === 'operator') {
        lineObj.helperWorkAsOp += 1;
      }

      lineObj.totalSmv += parseFloat(doc.smv) || 0;

      if (isHistory) {
        lineObj.totalWorkingMinutes += parseFloat(doc.previousLineWorkingTime) || 0;
      } else {
        let totalMinutesThisOperatorWorkedToday = 0;
        if (doc.hourlyProduction && doc.hourlyProduction.length > 0) {
          const lastEntry = doc.hourlyProduction[doc.hourlyProduction.length - 1];
          totalMinutesThisOperatorWorkedToday = (HOUR_MAP[lastEntry.hour] || 0) * 60;
        }
        const operatorHistory = historyRecords.filter(h => String(h.operator) === String(doc.operator?._id || doc.operator));
        const minutesSpentInOtherLines = operatorHistory.reduce((sum, h) => sum + (parseFloat(h.previousLineWorkingTime) || 0), 0);
        lineObj.totalWorkingMinutes += Math.max(0, totalMinutesThisOperatorWorkedToday - minutesSpentInOtherLines);
        
        if (doc.hourlyTarget) lineObj.hourlyTarget = doc.hourlyTarget;
      }
    };

    historyRecords.forEach(hist => processRecord(hist, true));
    mainRecords.forEach(doc => processRecord(doc, false));

    // --- ৪. Breakdown ক্যালকুলেশন এবং ফাইনাল আউটপুট ---
    const finalData = await Promise.all(Object.values(lineMap).map(async (line) => {
      let breakdownSMV = 0;
      let breakdownHP = 0;
      let breakdownOperator = 0;
      let capacities = [];

      if (line.breakdownTitle) {
        const bdData = await Breakdown.findOne({ fileName: line.breakdownTitle }).lean();
        if (bdData && bdData.data) {
          bdData.data.forEach(item => {
            breakdownSMV += parseFloat(item.smv) || 0;
            if (item.mcTypeHp && item.mcTypeHp.toUpperCase() === "HP") {
              breakdownHP += 1;
            } else if (item.mcTypeHp) {
              breakdownOperator += 1;
            }
            const capValue = parseFloat(item.capacity);
            if (!isNaN(capValue) && capValue > 0) {
              capacities.push(capValue);
            }
          });
        }
      }

      const totalManpowerVariable = line.operatorCount + line.helperCount;
      const breakdownCapacity = capacities.length > 0 ? Math.min(...capacities) : 0;

      return {
        line: line.line,
        buyer: line.buyer,
        style: line.style,
        jobNo: line.jobNo, // এখানে jobNo পাঠানো হচ্ছে
        totalManpower: line.totalManpower, 
        totalSmv: Number(line.totalSmv.toFixed(2)),
        operator: line.operatorCount,
        helper: line.helperCount,
        totalManpowerVariable: totalManpowerVariable,
        opWorkAsHelper: line.opWorkAsHelper,
        helperWorkAsOp: line.helperWorkAsOp,
        hourlyTarget: line.hourlyTarget,
        avgWorkingHour: Number((line.totalWorkingMinutes / (line.totalManpower || 1) / 60).toFixed(2)),
        npt: nptMap[line.line] ? Number((nptMap[line.line] / 60).toFixed(2)) : 0,
        breakdownSMV: Number(breakdownSMV.toFixed(2)),
        breakdownOperator: breakdownOperator,
        breakdownHP: breakdownHP,
        breakdownCapacity: breakdownCapacity
      };
    }));

    return NextResponse.json({
      date: dateParam,
      totalLines: finalData.length,
      data: finalData
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}