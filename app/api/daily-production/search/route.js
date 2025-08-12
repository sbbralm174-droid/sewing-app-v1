import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import DailyProduction from '@/models/DailyProduction';

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');
    const floor = searchParams.get('floor');
    const line = searchParams.get('line');

    if (!dateParam || !floor || !line) {
      return NextResponse.json({ error: 'Date, floor, and line are required.' }, { status: 400 });
    }

    const date = new Date(dateParam);
    if (isNaN(date.getTime())) {
      return NextResponse.json({ error: 'Invalid date format.' }, { status: 400 });
    }

    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const query = {
      date: { $gte: startOfDay, $lte: endOfDay },
      floor: floor,
      line: line,
    };

    const data = await DailyProduction.find(query);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching production data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch production data.' },
      { status: 500 }
    );
  }
}
