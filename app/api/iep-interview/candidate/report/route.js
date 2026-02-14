import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Candidate from '@/models/Candidate';

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const selectedDate = searchParams.get('date');
    const selectedFloor = searchParams.get('floor');

    let query = {};

    // Date Filter Logic
    if (selectedDate) {
      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(selectedDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: start, $lte: end };
    }

    // Floor Filter Logic
    if (selectedFloor && selectedFloor !== 'ALL') {
      query.floor = selectedFloor;
    }

    const candidates = await Candidate.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(candidates);
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}