import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import HourlyReport from '@/models/Hour';

export async function POST(req) {
  try {
    await connectDB();
    const { floor, hour } = await req.json();

    if (!floor || !hour) {
      return NextResponse.json({ message: 'All fields are required.' }, { status: 400 });
    }

    const existingReport = await HourlyReport.findOne({ floor, hour });

    if (existingReport) {
      return NextResponse.json({ message: `A report for Floor ${floor} and Hour ${hour} already exists.` }, { status: 409 });
    }

    const newReport = new HourlyReport({ floor, hour });
    await newReport.save();

    return NextResponse.json({ message: 'Hourly production report saved successfully.', newReport }, { status: 201 });
  } catch (error) {
    console.error('Error in POST API:', error);
    return NextResponse.json({ message: 'An error occurred while saving the report.', error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const floor = searchParams.get('floor'); // floor প্যারামিটারটি আনা হচ্ছে

    // যদি floor প্যারামিটার থাকে, তবে সেই floor-এর ডেটা ফিল্টার করে আনা হবে
    let query = {};
    if (floor) {
      query = { floor: floor };
    }

    const reports = await HourlyReport.find(query).sort({ createdAt: -1 });
    return NextResponse.json(reports, { status: 200 });
  } catch (error) {
    console.error('Error in GET API:', error);
    return NextResponse.json({ message: 'An error occurred while fetching reports.', error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Report ID is required.' }, { status: 400 });
    }

    const deletedReport = await HourlyReport.findByIdAndDelete(id);

    if (!deletedReport) {
      return NextResponse.json({ message: 'Report not found.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Report deleted successfully.' }, { status: 200 });
  } catch (error) {
    console.error('Error in DELETE API:', error);
    return NextResponse.json({ message: 'An error occurred while deleting the report.', error: error.message }, { status: 500 });
  }
}
