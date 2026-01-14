import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import DailyProduction from '@/models/DailyProduction';
import Operator from '@/models/Operator';

/* ======================================================
   ১️⃣ GET : Daily Production Fetch
====================================================== */
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');
    const floor = searchParams.get('floor');
    const line = searchParams.get('line');

    if (!dateStr || !floor || !line) {
      return NextResponse.json(
        { message: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const startOfDay = new Date(dateStr);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(dateStr);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const productions = await DailyProduction.find({
      date: { $gte: startOfDay, $lte: endOfDay },
      floor,
      line,
    })
      .select(
        'rowNo operator uniqueMachine process breakdownProcess smv workAs target hourlyProduction hourlyTarget'
      )
      .sort({ rowNo: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: productions.map((p) => ({
        ...p,
        hourlyProduction: Array.isArray(p.hourlyProduction)
          ? p.hourlyProduction
          : [],
        operatorId: p.operator?._id || p.operator || '',
        operatorName: p.operator?.name || '',
      })),
    });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

/* ======================================================
   ২️⃣ PUT : Daily Production + Operator LastScan Update
====================================================== */
export async function PUT(request) {
  try {
    await connectDB();
    const body = await request.json();

    if (!Array.isArray(body)) {
      return NextResponse.json(
        { message: 'Data must be an array' },
        { status: 400 }
      );
    }

    /* -------------------------------
        ১. DailyProduction bulk update
    -------------------------------- */
    const productionOps = body.map((item) => ({
      updateOne: {
        filter: { _id: item._id },
        update: {
          $set: {
            rowNo: item.rowNo,
            process: item.process,
            breakdownProcess: item.breakdownProcess,
            uniqueMachine: item.uniqueMachine,
            smv: item.smv,
            target: item.target,
            workAs: item.workAs,
            hourlyTarget: item.hourlyTarget || '',
            hourlyProduction: Array.isArray(item.hourlyProduction)
              ? item.hourlyProduction
              : [],
            updatedAt: new Date(),
          },
        },
      },
    }));

    const productionResult = await DailyProduction.bulkWrite(productionOps);

    /* -------------------------------
        ২. Operator lastScan & allowedProcesses Update
    -------------------------------- */
    // আমরা লুপ চালিয়ে প্রতিটি অপারেটরের ডেটা আপডেট করবো
    for (const item of body) {
      if (item.operatorId) {
        // প্রসেস নাম নির্ধারণ (process অথবা breakdownProcess)
        const processName = item.process || item.breakdownProcess;

        if (processName) {
          // hourlyProduction থেকে সর্বোচ্চ productionCount বের করা
          let maxCapacity = 0;
          if (Array.isArray(item.hourlyProduction) && item.hourlyProduction.length > 0) {
            maxCapacity = Math.max(...item.hourlyProduction.map(hp => Number(hp.productionCount) || 0));
          }

          // অপারেটর আপডেট
          // এখানে $set ব্যবহার করা হয়েছে যাতে Map এর ডাইনামিক কি (Key) আপডেট হয়
          await Operator.findOneAndUpdate(
            { operatorId: item.operatorId },
            {
              $set: {
                [`allowedProcesses.${processName}`]: maxCapacity, // ডাইনামিক কি আপডেট
                'lastScan.process': item.process || null,
                'lastScan.breakdownProcess': item.breakdownProcess || null,
                'lastScan.machine': item.uniqueMachine || null,
                'lastScan.updatedAt': new Date(),
              }
            },
            { new: true }
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `${productionResult.modifiedCount} production updated & operator allowedProcesses synced`,
    });
  } catch (error) {
    console.error('PUT Error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

/* ======================================================
   ৩️⃣ POST : Hourly Target Update Only
====================================================== */
export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();

    const { data } = body;

    if (!Array.isArray(data)) {
      return NextResponse.json(
        { message: 'Data must be an array' },
        { status: 400 }
      );
    }

    const ops = data.map((item) => ({
      updateOne: {
        filter: { _id: item._id },
        update: {
          $set: {
            hourlyTarget: item.hourlyTarget || '',
            updatedAt: new Date(),
          },
        },
      },
    }));

    const result = await DailyProduction.bulkWrite(ops);

    return NextResponse.json({
      success: true,
      message: `Hourly target updated for ${result.modifiedCount} items`,
    });
  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
