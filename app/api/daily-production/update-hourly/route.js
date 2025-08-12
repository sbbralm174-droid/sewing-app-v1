import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import DailyProduction from '@/models/DailyProduction';

export async function POST(req) {
  try {
    await connectDB();
    const { id, hourlyProduction } = await req.json();

    if (!id || !hourlyProduction || !Array.isArray(hourlyProduction)) {
      return NextResponse.json({ message: 'Invalid request. Document ID and hourlyProduction array are required.' }, { status: 400 });
    }

    const updatedReport = await DailyProduction.findByIdAndUpdate(
      id,
      { $set: { hourlyProduction } },
      { new: true } // আপডেটেড ডকুমেন্টটি ফিরিয়ে আনার জন্য
    );

    if (!updatedReport) {
      return NextResponse.json({ message: 'Daily production report not found.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Hourly production data saved successfully.', updatedReport }, { status: 200 });
  } catch (error) {
    console.error('Error in POST API for hourly update:', error);
    return NextResponse.json({ message: 'An error occurred while saving the hourly report.', error: error.message }, { status: 500 });
  }
}
