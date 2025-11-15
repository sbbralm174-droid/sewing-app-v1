// app/api/viva-interview/step2/route.js
import { NextResponse } from "next/server";
import { connectDB } from '@/lib/db';
import VivaInterview from "@/models/IepInterview"; // Main model
import VivaInterviewStep1 from "@/models/IepInterviewStepOne"; // Step 1 model

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    
    const { candidateId, ...interviewData } = body;
    
    // Validate required fields for step 2
    if (!interviewData.interviewDate || !interviewData.interviewer || !interviewData.department) {
      return NextResponse.json({ 
        success: false, 
        error: "Interview date, interviewer, and department are required" 
      }, { status: 400 });
    }
    
    // First, get step 1 data
    const step1Data = await VivaInterviewStep1.findOne({ candidateId });
    
    if (!step1Data) {
      return NextResponse.json({ 
        success: false, 
        error: "Candidate not found in step 1 data" 
      }, { status: 404 });
    }
    
    // Create final interview record with combined data
    const viva = await VivaInterview.create({
      candidateId,
      name: step1Data.name, // From step 1
      nid: step1Data.nid, // From step 1
      birthCertificate: step1Data.birthCertificate, // From step 1
      picture: step1Data.picture, // From step 1
      ...interviewData // From step 2 form
    });
    
    return NextResponse.json({ 
      success: true, 
      data: viva 
    });
    
  } catch (error) {
    console.error("❌ Step 2 Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}