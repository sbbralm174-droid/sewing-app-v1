// app/api/adminInterview/floors/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import AdminInterview from '@/models/AdminInterview';

export async function GET() {
  try {
    await connectDB();
    
    // ইউনিক ফ্লোর লিস্ট পেতে aggregate ব্যবহার করুন
    const floors = await AdminInterview.aggregate([
      {
        $group: {
          _id: '$floor',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    return NextResponse.json({
      success: true,
      data: floors.map(f => f._id).filter(f => f) // null/undefined ফিল্টার করুন
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch floors' },
      { status: 500 }
    );
  }
}