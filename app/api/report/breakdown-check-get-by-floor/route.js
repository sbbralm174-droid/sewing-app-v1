// api/report/breakdown-check-get-by-floor

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
      return NextResponse.json({ message: 'Date and floor name are required' }, { status: 400 });
    }

    // Find reports based on date and floor
    const reports = await Report.find({ date, floor });

    if (!reports || reports.length === 0) {
      return NextResponse.json({ message: 'No reports found for this date and floor' }, { status: 404 });
    }

    return NextResponse.json(reports, { status: 200 });

  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}