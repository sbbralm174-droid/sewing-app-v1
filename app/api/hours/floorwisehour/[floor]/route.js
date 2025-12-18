import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import HourlyReport from "@/models/Hour"; // আপনার মডেলের সঠিক পাথটি এখানে দিন

export async function GET(request, { params }) {
  try {
    // ১. ডাটাবেজ কানেক্ট করা
    await connectDB();

    // ২. ইউআরএল থেকে ফ্লোরের নাম নেওয়া
    const { floor } = params;

    // ৩. ডাটাবেজ থেকে ঐ ফ্লোরের সব রিপোর্ট খুঁজে বের করা
    // .find() দিয়ে আমরা ঐ ফ্লোরের সব আওয়ারের লিস্ট পাবো
    const reportList = await HourlyReport.find({ floor: floor })
      .select("hour createdAt") // শুধু hour এবং সময় দেখানোর জন্য
      .sort({ createdAt: -1 }); // নতুনগুলো আগে দেখানোর জন্য

    // ৪. যদি কোনো ডাটা না থাকে
    if (!reportList || reportList.length === 0) {
      return NextResponse.json(
        { message: "এই ফ্লোরের জন্য কোনো ডাটা পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    // ৫. ডাটা রিটার্ন করা
    return NextResponse.json({
      success: true,
      floorName: floor,
      count: reportList.length,
      data: reportList
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { message: "সার্ভারে সমস্যা হয়েছে", error: error.message },
      { status: 500 }
    );
  }
}