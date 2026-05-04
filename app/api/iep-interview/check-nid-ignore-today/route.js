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

    // 👉 Today start (UTC)
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    // ================================
    // 1️⃣ VivaInterviewStep1 check (ignore today)
    // ================================
    const existing = await VivaInterviewStep1.findOne({
      $or: [
        { nid: idFromQuery },
        { birthCertificate: idFromQuery },
      ],
      createdAt: {
        $lt: todayStart,
      },
    });

    // ================================
    // 2️⃣ ResignHistory check
    // ================================
    const resignData = await ResignHistory.findOne({
      $or: [
        { nid: idFromQuery },
        { birthCertificate: idFromQuery },
      ],
    });

    // ================================
    // FINAL RESPONSE LOGIC
    // ================================

    // 👉 Case 1: VivaInterviewStep1 found
    if (existing) {
      return NextResponse.json({
        exists: true,
        source: 'interview',
        candidateId: existing?.candidateId || null,
        result: existing?.result || null,
        name: existing?.name || null,
      });
    }

    // 👉 Case 2: ResignHistory found
    if (resignData) {
      return NextResponse.json({
        exists: true,
        source: 'resigned',
        name: resignData?.name || null,
        reason: resignData?.reason || null,
        performanceMark: resignData?.performanceMark || null,
      });
    }

    // 👉 Case 3: Not found anywhere
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