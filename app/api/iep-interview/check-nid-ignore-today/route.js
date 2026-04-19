// /api/iep-interview/check-nid-ignore-today

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import VivaInterviewStep1 from '@/models/IepInterviewStepOne';

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const nid = searchParams.get('nid');
    const birthCertificate = searchParams.get('birthCertificate');

    if (!nid && !birthCertificate) {
      return NextResponse.json(
        { exists: false },
        { status: 200 }
      );
    }

    // 👉 Today start & end (UTC based)
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    // ১. ইউজার যেটাই পাঠাক (nid অথবা birthCertificate) সেটা ধরুন
const idFromQuery = searchParams.get('nid') || searchParams.get('birthCertificate');

if (!idFromQuery) {
  return NextResponse.json({ exists: false }, { status: 200 });
}

    // 👉 Query
    const existing = await VivaInterviewStep1.findOne({
      $or: [
        {nid :  idFromQuery },
        { birthCertificate: idFromQuery },
      ].filter(Boolean),
     // 👉 ignore today's data
      createdAt: {
        $lt: todayStart, // today er age
      },
    });

    const existings = await VivaInterviewStep1.findOne({
      $or: [
        { nid: idFromQuery },
        { birthCertificate: idFromQuery }
      ]
    });

    return NextResponse.json({
      exists: !!existing,
      candidateId: existing?.candidateId || null,
      result: existing?.result || null,
      name: existing?.name || null,
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check data' },
      { status: 500 }
    );
  }
}