// app/api/adminInterview/filter-options/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import AdminInterview from '@/models/AdminInterview';

export async function GET() {
  try {
    await connectDB();

    // Floor অপশনগুলো পেতে
    const floorOptions = await AdminInterview.aggregate([
      { $match: { floor: { $exists: true, $ne: null } } },
      { $group: { _id: '$floor', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Date অপশনগুলো পেতে (শুধু তারিখ, মাস-বছর)
    const dateOptions = await AdminInterview.aggregate([
      { $match: { interviewDate: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$interviewDate" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } } // নবীনতম প্রথমে
    ]);

    return NextResponse.json({
      success: true,
      data: {
        floors: floorOptions.map(f => ({
          value: f._id,
          label: `Floor ${f._id}`,
          count: f.count
        })),
        dates: dateOptions.map(d => ({
          value: d._id,
          label: new Date(d._id).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
          count: d.count
        }))
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch filter options' },
      { status: 500 }
    );
  }
}