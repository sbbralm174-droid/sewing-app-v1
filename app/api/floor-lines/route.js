// api/floor-lines
import { connectDB } from '@/lib/db';
import FloorLine from '@/models/FloorLine';
import { NextResponse } from 'next/server';
import '@/models/Supervisor'
import '@/models/Operator'
import '@/models/Machine'
import '@/models/Floor' // Make sure to import the Floor model so populate works

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const floorLine = await FloorLine.create(body);
    return NextResponse.json(floorLine, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET() {
  try {
    await connectDB();
    // .populate('floor') - এই লাইনটি ঠিক আছে, এটি ফ্লোর অবজেক্ট এনে দেবে।
    const floorLines = await FloorLine.find({})
      .populate('floor')
      .populate('supervisor')
      .populate('operators')
      .populate('machines');
    return NextResponse.json(floorLines);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}