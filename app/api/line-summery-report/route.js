import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import DailyProduction from '@/models/DailyProduction';
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

    // --- ১. আন্ডন এপিআই থেকে NPT ক্যালকুলেশন ---
    let nptMap = {};
    try {
      const andonRes = await fetch(`https://andon-microcontroller-project-two.vercel.app/api/table?startDate=${dateParam}&endDate=${dateParam}`);
      const andonJson = await andonRes.json();

      if (andonJson.success && andonJson.data) {
        andonJson.data.forEach(item => {
          const parts = item.deviceId.split('-');
          if (parts.length >= 4) {
            // "ESP32-ACS712-1-5-1" -> parts[3] হচ্ছে লাইন নম্বর (5)
            const lineNumber = parts[3].padStart(2, '0'); 
            const formattedLine = `PODDO-${lineNumber}`; 
            
            // অফ ডিউরেশন বা অন ডিউরেশন (আপনার রিকোয়ারমেন্ট অনুযায়ী onDuration যোগ করা হলো)
            const duration = parseFloat(item.onDuration) || 0;
            nptMap[formattedLine] = (nptMap[formattedLine] || 0) + duration;
          }
        });
      }
    } catch (err) {
      console.error("Andon API Error:", err);
    }

    // --- ২. প্রোডাকশন ডাটা ফেচিং ---
    const startDate = new Date(dateParam);
    const endDate = new Date(dateParam);
    endDate.setHours(23, 59, 59, 999);

    const records = await DailyProduction.find({
      date: { $gte: startDate, $lte: endDate }
    })
      .populate('buyerId', 'name')
      .populate('styleId', 'name')
      .lean();

    const lineMap = {};

    records.forEach(doc => {
      const lineKey = doc.line; // যেমন: PODDO-02, PODDO-05

      if (!lineMap[lineKey]) {
        lineMap[lineKey] = {
          line: lineKey,
          buyer: doc.buyerId?.name || '',
          style: doc.styleId?.name || '',
          totalSmv: 0,
          operatorCount: 0,
          helperCount: 0,
          hourlyTarget: 0,
          workingHours: []
        };
      }

      // SMV যোগফল
      lineMap[lineKey].totalSmv += parseFloat(doc.smv) || 0;
      
      // গুরুত্বপূর্ণ: Operator এবং Helper কাউন্ট লজিক
      const workAs = (doc.workAs || '').trim().toLowerCase();
      if (workAs === 'operator') {
        lineMap[lineKey].operatorCount += 1;
      } else if (workAs === 'helper') {
        lineMap[lineKey].helperCount += 1;
      }

      // Hourly Target (সর্বশেষ এন্ট্রি থেকে নেয়া ভালো)
      if (doc.hourlyTarget) {
        lineMap[lineKey].hourlyTarget = doc.hourlyTarget;
      }

      // Working Hour Calculation
      if (doc.hourlyProduction && doc.hourlyProduction.length > 0) {
        const lastEntry = doc.hourlyProduction[doc.hourlyProduction.length - 1];
        const hourValue = HOUR_MAP[lastEntry.hour];
        if (hourValue) {
          lineMap[lineKey].workingHours.push(hourValue);
        }
      }
    });

    // --- ৩. ফাইনাল আউটপুট প্রোসেসিং ---
    const result = Object.values(lineMap).map(line => {
      const totalHours = line.workingHours.reduce((a, b) => a + b, 0);
      const avgWorkingHour = line.workingHours.length > 0 
        ? Number((totalHours / line.workingHours.length).toFixed(2)) 
        : 0;

      return {
        line: line.line,
        buyer: line.buyer,
        style: line.style,
        totalSmv: Number(line.totalSmv.toFixed(2)),
        operator: line.operatorCount,
        helper: line.helperCount,
        totalManpower: line.operatorCount + line.helperCount,
        hourlyTarget: line.hourlyTarget,
        avgWorkingHour: avgWorkingHour,
        // আন্ডন ম্যাপ থেকে NPT নিয়ে আসা
        npt: nptMap[line.line] ? Number((nptMap[line.line] / 60).toFixed(2)) : 0 // সেকেন্ড থেকে মিনিটে কনভার্ট করা হয়েছে (/60)
      };
    });

    return NextResponse.json({
      date: dateParam,
      totalLines: result.length,
      data: result
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}