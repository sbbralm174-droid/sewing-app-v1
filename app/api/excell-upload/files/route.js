import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Breakdown } from '@/models/Breakdown'; // আপনার মডেলের সঠিক পাথ দিন

export async function GET() {
  try {
    // ১. ডেটাবেস কানেকশন করা
    await connectDB();

    // ২. শুধু _id এবং fileName সিলেক্ট করে ডেটা ফেচ করা
    // .select('_id fileName') ব্যবহার করলে বাকি সব ফিল্ড বাদ যাবে
    const files = await Breakdown.find({})
      .select('_id fileName')
      .sort({ createdAt: -1 }); // নতুনগুলো আগে দেখাবে

    return NextResponse.json(
      { success: true, data: files },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching filenames:", error);
    return NextResponse.json(
      { success: false, message: "Server Error", error: error.message },
      { status: 500 }
    );
  }
}