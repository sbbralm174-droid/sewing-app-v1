import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import VivaInterviewStep1 from '@/models/IepInterviewStepOne';
import Candidate from '@/models/Candidate';

export async function GET(request) {
  try {
    await connectDB();

    // ১. URL থেকে তারিখ সংগ্রহ করা (যদি না থাকে তবে আজকের তারিখ)
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date'); // Format: YYYY-MM-DD
    
    let startDate, endDate;

    if (dateParam) {
      startDate = new Date(dateParam);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(dateParam);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // ডিফল্ট আজকের তারিখ
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    }

    // ২. Candidate মডেল থেকে অলরেডি এক্সিস্ট করা আইডিগুলো বের করা
    const existingCandidates = await Candidate.find({}, 'candidateId').lean();
    const existingIds = existingCandidates.map(c => c.candidateId);

    // ৩. StepOne থেকে ক্যান্ডিডেটদের ফিল্টার করা
    // শর্ত: রেজাল্ট PASSED, তারিখ অনুযায়ী, এবং Candidate মডেলে নেই
    const eligibleCandidates = await VivaInterviewStep1.find({
      result: "PASSED",
      candidateId: { $nin: existingIds },
      createdAt: { $gte: startDate, $lte: endDate }
    }).sort({ createdAt: -1 }).lean();

    return NextResponse.json(eligibleCandidates, { status: 200 });

  } catch (error) {
    console.error("Error fetching eligible candidates:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}