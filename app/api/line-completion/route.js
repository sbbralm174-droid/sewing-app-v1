// app/api/line-completion/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import LineCompletion from '@/models/LineCompletion';

// Establish the database connection
connectDB();

// Handle POST requests
export async function POST(req) {
  try {
    const { date, floor, line, supervisor } = await req.json();

    if (!date || !line) {
      return NextResponse.json({ error: 'Date and Line are required.' }, { status: 400 });
    }

    const existingEntry = await LineCompletion.findOne({ date, line });
    if (existingEntry) {
      return NextResponse.json({ error: 'This line is already marked as complete for this date.' }, { status: 409 });
    }

    const newLineCompletion = new LineCompletion({
      date: new Date(date),
      floor,
      line,
      completedAt: new Date(),
      supervisor,
    });

    await newLineCompletion.save();
    return NextResponse.json({ message: 'Line completion saved successfully!' }, { status: 201 });

  } catch (error) {
    console.error('Error marking line as complete:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Handle GET requests
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const line = searchParams.get('line');

    const query = {};
    if (date) query.date = new Date(date);
    if (line) query.line = line;

    const completions = await LineCompletion.find(query).sort({ completedAt: -1 });
    return NextResponse.json(completions, { status: 200 });
  } catch (error) {
    console.error('Error fetching line completions:', error);
    return NextResponse.json({ error: 'Failed to fetch line completions' }, { status: 500 });
  }
}
