import { NextResponse } from "next/server";
import { connectDB } from '@/lib/db';
import VivaInterview from "@/models/IepInterview";

export async function POST(req) {
  try {
    await connectDB();
    const { nid, birthCertificate } = await req.json();
    
    let previousInterviews = [];
    
    if (nid || birthCertificate) {
      const query = {};
      if (nid) query.nid = nid;
      if (birthCertificate) query.birthCertificate = birthCertificate;
      
      previousInterviews = await VivaInterview.find(query)
        .select('candidateId name interviewDate createdAt department result')
        .sort({ interviewDate: -1 })
        .limit(5);
    }
    
    return NextResponse.json({ 
      success: true, 
      previousInterviews 
    });
    
  } catch (error) {
    console.error("❌ Check Previous Interviews Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}