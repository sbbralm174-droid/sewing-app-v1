import { connectDB } from '@/lib/db';
import Candidate from '@/models/Candidate';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    await connectDB();
    
    const {candidateId, result, interviewData, failureReason, nid, name} = await request.json();
    console.log(failureReason);
    
    const cadidate = await Candidate.create({candidateId, result, interviewData, failureReason, nid, name});
    console.log("Created candidate:", cadidate);
    return NextResponse.json({
      success: true,
      data: cadidate,
      message: 'Candidate interview data successfully created'
    }, { status: 201 });
  }
  catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 400 });
  }
    
    
}
