import { connectDB } from '@/lib/db';
import DailyProduction from '@/models/DailyProduction';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    await connectDB();
    
    const { operatorId, startDate, endDate } = await request.json();

    // Validation
    if (!operatorId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Operator ID, start date and end date are required' },
        { status: 400 }
      );
    }

    // Convert dates to proper format
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // End of the day

    // Query database
    const productions = await DailyProduction.find({
      'operator.operatorId': operatorId,
      date: {
        $gte: start,
        $lte: end
      }
    })
    .populate('buyerId', 'name')
    .populate('styleId', 'name styleNumber')
    .sort({ date: 1 });

    return NextResponse.json({
      success: true,
      data: productions,
      count: productions.length
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}