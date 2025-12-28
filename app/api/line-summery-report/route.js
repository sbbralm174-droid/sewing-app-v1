import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import DailyProduction from '@/models/DailyProduction';
import '@/models/Buyer';
import '@/models/Style';

const HOUR_MAP = {
  "08-09 AM": 1,
  "09-10 AM": 2,
  "10-11 AM": 3,
  "11-12 AM": 4,
  "12-02 PM": 5,
  "02-03 PM": 6,
  "03-04 PM": 7,
  "04-05 PM": 8,
  "05-06 PM": 9,
  "06-07 PM": 10,
  "07-08 PM": 11,
  "08-09 PM": 12,
  "09-10 PM": 13,
  "10-11 PM": 14,
  "11-12 PM": 15
};

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');

    if (!dateParam) {
      return NextResponse.json(
        { message: 'date query is required (YYYY-MM-DD)' },
        { status: 400 }
      );
    }

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

    for (const doc of records) {
      const lineKey = doc.line;

      if (!lineMap[lineKey]) {
        lineMap[lineKey] = {
          line: doc.line,
          buyer: doc.buyerId?.name || '',
          style: doc.styleId?.name || '',
          totalSmv: 0,
          operatorCount: 0,
          helperCount: 0,
          totalManpower: 0,
          hourlyTarget: doc.hourlyTarget || 0,
          workingHours: [] // temp
        };
      }

      // ✅ SMV যোগ
      const smvValue = parseFloat(doc.smv);
      if (!isNaN(smvValue)) {
        lineMap[lineKey].totalSmv += smvValue;
      }

      // ✅ Operator / Helper count
      const workAs = (doc.workAs || '').toLowerCase();

if (workAs === 'operator') {
  lineMap[lineKey].operatorCount += 1;
} else if (workAs === 'helper') {
  lineMap[lineKey].helperCount += 1;
}

      // ✅ Working hour calculation
      if (doc.hourlyProduction && doc.hourlyProduction.length > 0) {
        const lastEntry = doc.hourlyProduction[doc.hourlyProduction.length - 1];
        const hourValue = HOUR_MAP[lastEntry.hour];
        if (hourValue) {
          lineMap[lineKey].workingHours.push(hourValue);
        }
      }
    }

    // 🔁 Final processing
    const result = Object.values(lineMap).map(line => {
      const totalHours = line.workingHours.reduce((a, b) => a + b, 0);
      const avgWorkingHour =
        line.workingHours.length > 0
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
        avgWorkingHour
      };
    });

    return NextResponse.json({
      date: dateParam,
      totalLines: result.length,
      data: result
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
