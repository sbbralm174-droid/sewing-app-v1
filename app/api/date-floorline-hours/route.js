import { connectDB } from '@/lib/db';
import DailyFloorLineHour from '@/models/DailyFloorLineHour';
import { NextResponse } from 'next/server';

// Make sure to import all models that are referenced in the schemas
import '@/models/Floor';
import '@/models/FloorLine';

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const dailyHourData = await DailyFloorLineHour.create(body);
    return NextResponse.json(dailyHourData, { status: 201 });
  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET() {
  try {
    await connectDB();

    // Get the start and end of the current day in UTC
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    // Find all documents for the current date and populate floor and floorLine details
    const dailyHours = await DailyFloorLineHour.find({
      date: {
        $gte: todayStart,
        $lte: todayEnd,
      },
    })
      .populate('floor') // Assuming Floor model is properly linked
      .populate('floorLine'); // Assuming FloorLine model is properly linked

    return NextResponse.json(dailyHours);
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
