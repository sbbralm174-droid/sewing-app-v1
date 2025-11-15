// app/api/viva-interview/step1/route.js
import { NextResponse } from "next/server";
import { connectDB } from '@/lib/db';
import VivaInterview from "@/models/IepInterviewStepOne";

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    
    // Create candidate with basic info only for step 1
    const viva = await VivaInterview.create({
      name: body.name,
      nid: body.nid || undefined,
      birthCertificate: body.birthCertificate || undefined,
      picture: body.picture,
      result: body.result,
      failureReason: body.failureReason || undefined,
      // Set default values for required fields that will be updated in step 2
      interviewDate: new Date(), // temporary date
      interviewer: "TBD", // temporary value
      department: "TBD", // temporary value
      stepCompleted: 1
    });
    
    return NextResponse.json({ 
      success: true, 
      data: viva 
    });
    
  } catch (error) {
    console.error("❌ Step 1 Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}