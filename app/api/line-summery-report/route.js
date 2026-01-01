import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import DailyProduction from '@/models/DailyProduction';
import HistoryDailyProduction from '@/models/HistoryDailyProduction';
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

    // --- ২. ডাটা ফেচিং (Main Production & History) ---
    const [mainRecords, historyRecords] = await Promise.all([
      DailyProduction.find({ date: { $gte: startDate, $lte: endDate } })
        .populate('buyerId', 'name').populate('styleId', 'name').lean(),
      HistoryDailyProduction.find({ date: { $gte: startDate, $lte: endDate } }).lean()
    ]);

    const lineMap = {};

    // হেল্পার ফাংশন লাইন অবজেক্ট তৈরি করতে
    const getLineObj = (lineKey, doc) => {
      if (!lineMap[lineKey]) {
        lineMap[lineKey] = {
          line: lineKey,
          buyer: doc?.buyerId?.name || '',
          style: doc?.styleId?.name || '',
          totalSmv: 0,
          operatorCount: 0,
          helperCount: 0,
          hourlyTarget: 0,
          totalWorkingMinutes: 0
        };
      }
      return lineMap[lineKey];
    };

    // --- ৩. হিস্ট্রি প্রসেসিং (পুরানো লাইনের সময় যোগ করা) ---
    historyRecords.forEach(hist => {
      const lineKey = hist.line;
      const lineObj = getLineObj(lineKey, hist);

      // হিস্ট্রি থেকে ওই লাইনের কাজের সময় (মিনিটে)
      const workMinutes = parseFloat(hist.previousLineWorkingTime) || 0;
      lineObj.totalWorkingMinutes += workMinutes;

      // ম্যানপাওয়ার কাউন্ট
      if (hist.workAs === 'operator') lineObj.operatorCount += 1;
      else if (hist.workAs === 'helper') lineObj.helperCount += 1;
      
      lineObj.totalSmv += parseFloat(hist.smv) || 0;
    });

    // --- ৪. মেইন প্রোডাকশন প্রসেসিং (বর্তমান লাইনের সময় থেকে হিস্ট্রি বিয়োগ) ---
    mainRecords.forEach(doc => {
      const lineKey = doc.line;
      const lineObj = getLineObj(lineKey, doc);

      // ১ নম্বর পয়েন্ট লজিক: বর্তমান লাইনের মোট সময় থেকে অন্য লাইনের সময় বিয়োগ
      let totalMinutesThisOperatorWorkedToday = 0;
      if (doc.hourlyProduction && doc.hourlyProduction.length > 0) {
        const lastEntry = doc.hourlyProduction[doc.hourlyProduction.length - 1];
        const hoursWorked = HOUR_MAP[lastEntry.hour] || 0;
        totalMinutesThisOperatorWorkedToday = hoursWorked * 60;
      }

      // এই অপারেটরের হিস্ট্রি রেকর্ডগুলো খুঁজে বের করা (সে অন্য লাইনে কতক্ষণ ছিল)
      const operatorHistory = historyRecords.filter(h => 
        h.operator.operatorId === doc.operator.operatorId
      );
      const minutesSpentInOtherLines = operatorHistory.reduce((sum, h) => sum + (parseFloat(h.previousLineWorkingTime) || 0), 0);

      // বর্তমান লাইনের একচুয়াল সময়
      const actualMinutesInCurrentLine = Math.max(0, totalMinutesThisOperatorWorkedToday - minutesSpentInOtherLines);
      lineObj.totalWorkingMinutes += actualMinutesInCurrentLine;

      // ম্যানপাওয়ার ও অন্যান্য ডাটা
      if (doc.workAs === 'operator') lineObj.operatorCount += 1;
      else if (doc.workAs === 'helper') lineObj.helperCount += 1;
      if (doc.hourlyTarget) lineObj.hourlyTarget = doc.hourlyTarget;
      lineObj.totalSmv += parseFloat(doc.smv) || 0;
    });

    // --- ৫. ফাইনাল আউটপুট প্রোসেসিং ---
    const result = Object.values(lineMap).map(line => {
      return {
        line: line.line,
        buyer: line.buyer,
        style: line.style,
        totalSmv: Number(line.totalSmv.toFixed(2)),
        operator: line.operatorCount,
        helper: line.helperCount,
        totalManpower: line.operatorCount + line.helperCount,
        hourlyTarget: line.hourlyTarget,
        avgWorkingHour: Number((line.totalWorkingMinutes / 60).toFixed(2)), // মিনিট থেকে ঘণ্টায় কনভার্ট
        npt: nptMap[line.line] ? Number((nptMap[line.line] / 60).toFixed(2)) : 0
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