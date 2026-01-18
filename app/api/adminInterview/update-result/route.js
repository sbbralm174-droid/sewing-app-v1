import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import AdminInterview from '@/models/AdminInterview';

export async function PATCH(request) {
  try {
    await connectDB();
    const body = await request.json();

    const {
      adminInterviewId,
      result,
      remarks,
      canceledReason,
      promotedToOperator
    } = body;

    const updated = await AdminInterview.findByIdAndUpdate(
      adminInterviewId,
      {
        result,
        remarks,
        canceledReason: result === 'FAILED' ? canceledReason : '',
        promotedToOperator: result === 'PASSED'
      },
      { new: true }
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: 'Update failed' },
      { status: 500 }
    );
  }
}
