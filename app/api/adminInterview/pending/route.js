import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import AdminInterview from '@/models/AdminInterview';
import VivaInterview from '@/models/IepInterview';

export async function GET() {
  try {
    await connectDB();

    const pendingList = await AdminInterview.find({
      result: 'PENDING'
    })
      .populate({
        path: 'candidateId',
        model: VivaInterview
      })
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: pendingList
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch pending candidates' },
      { status: 500 }
    );
  }
}
