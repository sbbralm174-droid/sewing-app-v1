import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import AdminInterview from '@/models/AdminInterview';
import VivaInterview from '@/models/IepInterview';

// GET: ফিল্টার সহ সকল Admin Interview নেয়া
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const floor = searchParams.get('floor');
    const result = searchParams.get('result');
    const search = searchParams.get('search');

    // ফিল্টার অবজেক্ট তৈরি
    const filter = {};

    // তারিখ ফিল্টার
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      filter.createdAt = {
        $gte: startDate,
        $lt: endDate
      };
    }

    // ফ্লোর ফিল্টার
    if (floor && floor !== 'ALL') {
      filter.floor = floor;
    }

    // ফলাফল ফিল্টার
    if (result && result !== 'ALL') {
      filter.result = result;
    }

    // সার্চ ফিল্টার (Mongoose query)
    if (search) {
      // সার্চের জন্য ক্যান্ডিডেট আইডি খুঁজে নিন
      const candidateIds = await VivaInterview.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { nid: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');

      if (candidateIds.length > 0) {
        filter.candidateId = { $in: candidateIds.map(c => c._id) };
      } else {
        // মিল না পেলে খালি অ্যারে রিটার্ন করুন
        return NextResponse.json({
          success: true,
          data: []
        });
      }
    }

    // ডাটা ফেচ করুন
    const interviews = await AdminInterview.find(filter)
      .populate({
        path: 'candidateId',
        model: VivaInterview,
        select: 'name nid grade department floor processAndScore'
      })
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: interviews
    });
  } catch (error) {
    console.error('Error fetching admin interviews:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch admin interviews' },
      { status: 500 }
    );
  }
}

// POST: নতুন Admin Interview তৈরি
export async function POST(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    const newInterview = new AdminInterview(body);
    await newInterview.save();
    
    return NextResponse.json({
      success: true,
      data: newInterview,
      message: 'Admin interview created successfully'
    });
  } catch (error) {
    console.error('Error creating admin interview:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create admin interview' },
      { status: 500 }
    );
  }
}