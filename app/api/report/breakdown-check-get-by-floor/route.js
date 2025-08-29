//  api/report/breakdown-check-get-by-floor

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Report from '@/models/breakdownSave';

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const floor = searchParams.get('floor');

    if (!date || !floor) {
      return NextResponse.json({ message: 'তারিখ এবং ফ্লোরের নাম আবশ্যক' }, { status: 400 });
    }

    // Find reports based on date and floor
    const reports = await Report.find({ date, floor });

    if (!reports || reports.length === 0) {
      return NextResponse.json({ message: 'এই তারিখ এবং ফ্লোরের জন্য কোনো রিপোর্ট পাওয়া যায়নি' }, { status: 404 });
    }

    return NextResponse.json(reports, { status: 200 });

  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json({ message: 'সার্ভার ত্রুটি', error: error.message }, { status: 500 });
  }
}
