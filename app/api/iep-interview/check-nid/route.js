import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import VivaInterviewStep1 from '@/models/IepInterviewStepOne';

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const nid = searchParams.get('nid');

    if (!nid) {
      return NextResponse.json(
        { exists: false },
        { status: 200 }
      );
    }

    const existing = await VivaInterviewStep1.findOne({ nid });

    return NextResponse.json({
      exists: !!existing,
      candidateId: existing?.candidateId || null,
      result: existing?.result || null,
      name: existing?.name || null,
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check NID' },
      { status: 500 }
    );
  }
}
