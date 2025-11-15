// app/api/report/operator-work-days/route.js

import { connectDB } from '@/lib/db';
import DailyProduction from '@/models/DailyProduction';

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const line = searchParams.get('line');
    const minDays = parseInt(searchParams.get('minDays')) || 1;

    if (!startDate || !endDate || !line) {
      return Response.json(
        { error: 'Start date, end date, and line are required' },
        { status: 400 }
      );
    }

    // Convert dates to proper format
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // End of the day

    // Aggregate to find operators who worked minimum days
    const operatorAttendance = await DailyProduction.aggregate([
      {
        $match: {
          line: line,
          date: {
            $gte: start,
            $lte: end
          },
          status: 'present'
        }
      },
      {
        $group: {
          _id: '$operator._id',
          operatorId: { $first: '$operator.operatorId' },
          name: { $first: '$operator.name' },
          designation: { $first: '$operator.designation' },
          totalDaysWorked: { $sum: 1 },
          workedDates: { $push: '$date' }
        }
      },
      {
        $match: {
          totalDaysWorked: { $gte: minDays }
        }
      },
      {
        $sort: { totalDaysWorked: -1, name: 1 }
      }
    ]);

    return Response.json({
      success: true,
      data: operatorAttendance,
      totalCount: operatorAttendance.length,
      filters: {
        startDate,
        endDate,
        line,
        minDays
      }
    });

  } catch (error) {
    console.error('Error fetching operator attendance:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}