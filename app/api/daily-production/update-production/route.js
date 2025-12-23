// /api/daily-production/update-production

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import DailyProduction from '@/models/DailyProduction';

// ১. ডেটা খোঁজার এপিআই (GET)
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');
    const floor = searchParams.get('floor');
    const line = searchParams.get('line');

    if (!dateStr || !floor || !line) {
      return NextResponse.json({ message: "Missing required parameters" }, { status: 400 });
    }

    const startOfDay = new Date(dateStr);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(dateStr);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const productions = await DailyProduction.find({
      date: { $gte: startOfDay, $lte: endOfDay },
      floor,
      line
    })
    .select('rowNo operator uniqueMachine process breakdownProcess smv workAs target hourlyProduction')
    .sort({ rowNo: 1 })
    .lean();

    return NextResponse.json({ success: true, data: productions });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// ২. ডেটা আপডেট করার এপিআই (PUT)
export async function PUT(request) {
  try {
    await connectDB();
    const body = await request.json(); // এটি একটি অ্যারে হতে হবে (Array of objects)

    if (!Array.isArray(body)) {
      return NextResponse.json({ message: "Data must be an array" }, { status: 400 });
    }

    /* একসাথে অনেকগুলো ডকুমেন্ট আপডেট করার জন্য bulkWrite সবচেয়ে ফাস্ট।
       এটি ডাটাবেসে মাত্র একবার হিট করে সব ডেটা আপডেট করে ফেলে।
    */
    const updateOperations = body.map((item) => ({
      updateOne: {
        filter: { _id: item._id }, // প্রতিটা আইটেমের ইউনিক ID দিয়ে ফিল্টার করবে
        update: { 
          $set: {
            process: item.process,
            breakdownProcess: item.breakdownProcess,
            uniqueMachine: item.uniqueMachine,
            smv: item.smv,
            target: item.target,
            workAs: item.workAs,
            hourlyProduction: item.hourlyProduction,
            updatedAt: new Date()
          } 
        }
      }
    }));

    const result = await DailyProduction.bulkWrite(updateOperations);

    return NextResponse.json({ 
      success: true, 
      message: `${result.modifiedCount} items updated successfully!` 
    });

  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}