import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import VivaInterviewStep1 from '@/models/IepInterviewStepOne';
import ResignHistory from '@/models/ResignHistory';

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const nid = searchParams.get('nid');
    const birthCertificate = searchParams.get('birthCertificate');

    const idFromQuery = nid || birthCertificate;

    if (!idFromQuery) {
      return NextResponse.json({ exists: false }, { status: 200 });
    }

    // =========================
    // 1️⃣ VivaInterviewStep1 check
    // =========================
    const interviewData = await VivaInterviewStep1.findOne({
      $or: [
        { nid: idFromQuery },
        { birthCertificate: idFromQuery },
      ],
    });

    // =========================
    // 2️⃣ ResignHistory check
    // =========================
    const resignData = await ResignHistory.findOne({
      $or: [
        { nid: idFromQuery },
        { birthCertificate: idFromQuery },
      ],
    });

    // =========================
    // FINAL RESPONSE
    // =========================

    if (interviewData) {
      return NextResponse.json({
        exists: true,
        source: 'interview',
        candidateId: interviewData?.candidateId || null,
        result: interviewData?.result || null,
        name: interviewData?.name || null,
      });
    }

    if (resignData) {
      return NextResponse.json({
        exists: true,
        source: 'resigned',
        name: resignData?.name || null,
        reason: resignData?.reason || null,
        performanceMark: resignData?.performanceMark || null,
      });
    }

    return NextResponse.json({
      exists: false,
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check data' },
      { status: 500 }
    );
  }
}