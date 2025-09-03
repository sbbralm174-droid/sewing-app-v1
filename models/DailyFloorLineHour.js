import { connectDB } from '@/lib/db';
import DailyFloorLineHour from '@/models/DailyFloorLineHour';
import { NextResponse } from 'next/server';

// Ensure all necessary models are imported for proper referencing
import '@/models/Floor';
import '@/models/FloorLine';

export async function POST(req) {
  try {
    // Connect to the database
    await connectDB();

    // Parse the request body
    const body = await req.json();

    // Create a new document in the DailyFloorLineHour collection
    const dailyHourData = await DailyFloorLineHour.create(body);

    // Return the newly created document with a 201 status code
    return NextResponse.json(dailyHourData, { status: 201 });
  } catch (error) {
    // Handle errors and return a 400 status code
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
