import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Candidate from '@/models/Candidate';
import VivaInterview from '@/models/IepInterview';

export async function GET(request) {
  try {
    await connectDB();

    // URL থেকে কুয়েরি প্যারামিটার নেওয়া (date এবং floor)
    const { searchParams } = new URL(request.url);
    const selectedDate = searchParams.get('date'); // Format: YYYY-MM-DD
    const floor = searchParams.get('floor');

    // ডিফল্টভাবে আজকের তারিখ সেট করা (যদি ইউজার তারিখ না দেয়)
    let startDate, endDate;
    const targetDate = selectedDate ? new Date(selectedDate) : new Date();
    
    startDate = new Date(targetDate.setHours(0, 0, 0, 0));
    endDate = new Date(targetDate.setHours(23, 59, 59, 999));

    // ১. প্রথমে VivaInterview কালেকশন থেকে সব candidateId বের করা যারা অলরেডি ইন্টারভিউ দিয়েছে
    const existingInterviews = await VivaInterview.find({}, 'candidateId').lean();
    const existingIds = existingInterviews.map(doc => doc.candidateId);

    // ২. কুয়েরি অবজেক্ট তৈরি
    let query = {
      result: 'PASSED',
      candidateId: { $nin: existingIds }, // যারা ইন্টারভিউ লিস্টে নেই
      createdAt: { $gte: startDate, $lte: endDate } // নির্দিষ্ট তারিখের মধ্যে
    };

    // ৩. ফ্লোর ফিল্টার থাকলে যোগ করা
    if (floor && floor !== '') {
      query.floor = floor;
    }

    // ৪. ক্যান্ডিডেট খুঁজে বের করা
    const eligibleCandidates = await Candidate.find(query).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: eligibleCandidates.length,
      data: eligibleCandidates
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching eligible candidates:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal Server Error',
      error: error.message
    }, { status: 500 });
  }
}