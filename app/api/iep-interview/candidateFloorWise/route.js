import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Candidate from '@/models/Candidate';

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');

    // 👉 যদি date না দেয় → today
    const targetDate = dateParam ? new Date(dateParam) : new Date();

    // 👉 start & end of day
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // 👉 aggregation
    const result = await Candidate.aggregate([
      {
        $match: {
          result: 'PASSED',
          createdAt: {
            $gte: startOfDay,
            $lte: endOfDay
          }
        }
      },
      {
        $group: {
          _id: '$floor',
          count: { $sum: 1 }
        }
      }
    ]);

    // 👉 default structure
    const report = {
      SHAPLA: 0,
      PODDO: 0,
      KODOM: 0,
      BELLY: 0
    };

    // 👉 data fill
    result.forEach(item => {
      if (item._id) {
        report[item._id] = item.count;
      }
    });

    return NextResponse.json({
      success: true,
      date: startOfDay,
      data: report
    });

  } catch (error) {
    console.error('Error:', error);

    return NextResponse.json(
      { success: false, message: 'Server Error' },
      { status: 500 }
    );
  }
}