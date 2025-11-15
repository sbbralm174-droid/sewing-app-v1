// app/api/iep-interview/candidate/[id]/route.js
import { NextResponse } from 'next/server';
import VivaInterview from '@/models/IepInterview';
import { connectDB } from '@/lib/db';

export async function GET(request, context) {
  try {
    await connectDB();
    const { id } = await context.params; // ✅ FIX: Await params

    const candidate = await VivaInterview.findOne({ candidateId: id }); // ✅ FIX: No ObjectId cast

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ candidate });

  } catch (error) {
    console.error('Get candidate error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request, context) {
  try {
    await connectDB();
    const { id } = await context.params; // ✅ FIX: Await params

    const { updateFields } = await request.json();

    const existingCandidate = await VivaInterview.findOne({ candidateId: id }); // ✅ FIX

    if (!existingCandidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    const updateObject = {};
    Object.keys(updateFields).forEach(key => {
      if (updateFields[key] !== undefined) {
        updateObject[key] = updateFields[key];
      }
    });

    const updatedCandidate = await VivaInterview.findOneAndUpdate(
      { candidateId: id }, // ✅ FIX
      { $set: updateObject },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      candidate: updatedCandidate,
      message: 'Candidate updated successfully'
    });

  } catch (error) {
    console.error('Update candidate error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
