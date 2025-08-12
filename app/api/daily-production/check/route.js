import { connectDB } from '@/lib/db';
import DailyProduction from '@/models/DailyProduction';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');
    const operatorId = searchParams.get('operator'); // ফ্রন্টএন্ড থেকে operatorId হিসেবে আসছে
    const machine = searchParams.get('machine');

    if (!dateParam || (!operatorId && !machine)) {
      return NextResponse.json(
        { error: 'Date and either Operator or Machine ID must be provided for duplicate check.' },
        { status: 400 }
      );
    }

    const checkDate = new Date(dateParam);
    if (isNaN(checkDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format provided for duplicate check.' },
        { status: 400 }
      );
    }

    const startOfDay = new Date(checkDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    
    const endOfDay = new Date(checkDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const query = {
      date: { $gte: startOfDay, $lte: endOfDay }
    };

    if (operatorId && machine) {
      query.$or = [
        { 'operator.operatorId': operatorId }, // Checking the nested field
        { uniqueMachine: machine }
      ];
    } else if (operatorId) {
      query['operator.operatorId'] = operatorId; // Checking the nested field
    } else if (machine) {
      query.uniqueMachine = machine;
    }

    const existing = await DailyProduction.findOne(query);

    return NextResponse.json({ exists: !!existing });
  } catch (error) {
    console.error('Error checking duplicate:', error);
    return NextResponse.json(
      { error: 'Failed to perform duplicate check.' },
      { status: 500 }
    );
  }
}