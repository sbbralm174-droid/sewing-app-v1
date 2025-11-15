

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Floor from '@/models/Floor';

// Handler for creating a new floor entry
export async function POST(request) {
  await connectDB();

  try {
    const body = await request.json();
    const { floorName } = body;

    const newFloor = await Floor.create({ floorName });

    return NextResponse.json({
      success: true,
      message: 'Floor added successfully.',
      data: newFloor,
    }, { status: 201 });

  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json({
        success: false,
        error: 'A floor with this name already exists.',
      }, { status: 400 });
    }
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 400 });
  }
}

// Handler for fetching all floor entries
export async function GET() {
  await connectDB();

  try {
    // Find all documents in the 'Floor' collection
    const floors = await Floor.find({});

    return NextResponse.json({
      success: true,
      message: 'Floors fetched successfully.',
      data: floors,
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}