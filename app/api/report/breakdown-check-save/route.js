import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Report from '@/models/breakdownSave';

export async function POST(req) {
  try {
    // Destructure the new field names from the request body
    const { date, line, floor, supervisor, matchedProcesses, unmatchedProcesses, missingProcesses, totalRecords, allRecords } = await req.json();

    if (!date || !line || !totalRecords) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();

    const newReport = new Report({
      date,
      line,
      floor,
      supervisor,
      totalRecords,
      allRecords,
      // Pass the arrays directly to the model
      matchedProcesses,
      unmatchedProcesses,
      missingProcesses,
    });

    const savedReport = await newReport.save();

    return NextResponse.json({ message: 'Report saved successfully!', data: savedReport }, { status: 201 });

  } catch (error) {
    console.error('Error saving report:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
