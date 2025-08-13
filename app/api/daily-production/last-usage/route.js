import { connectDB } from '@/lib/db';
import DailyProduction from '@/models/DailyProduction';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const machineId = searchParams.get('machineId');

    if (!machineId) {
      return NextResponse.json(
        { error: 'machineId is required.' },
        { status: 400 }
      );
    }

    const lastUsage = await DailyProduction.findOne({ uniqueMachine: machineId })
      .sort({ date: -1 });

    if (!lastUsage) {
      return NextResponse.json({ 
        message: 'No usage data found for this machine.',
        location: 'location not entry', // নতুন লজিক অনুযায়ী ডেটা পাঠানো হচ্ছে
        date: 'N/A'
      }, { status: 404 });
    }

    // floor এবং line থেকে location তৈরি করা হচ্ছে
    const locationString = `${lastUsage.floor} - Line ${lastUsage.line}`;

    // সংশোধিত ডেটা পাঠানো হচ্ছে
    return NextResponse.json({
      ...lastUsage.toObject(),
      location: locationString
    });

  } catch (error) {
    console.error('Error fetching last usage data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch last usage data.' },
      { status: 500 }
    );
  }
}