// app/api/iep-interview/two-step-search/route.js
import { NextResponse } from "next/server";
import { connectDB } from '@/lib/db';
import VivaInterview from "@/models/IepInterview";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get('candidateId');
    
    if (!candidateId) {
      return NextResponse.json({ 
        success: false, 
        error: "Candidate ID is required" 
      }, { status: 400 });
    }
    
    const candidate = await VivaInterview.find({
      candidateId: candidateId
    })
    .select('candidateId name nid birthCertificate picture')
    .sort({ createdAt: -1 });
    
    return NextResponse.json({ 
      success: true, 
      data: candidate 
    });
    
  } catch (error) {
    console.error("❌ Search Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}