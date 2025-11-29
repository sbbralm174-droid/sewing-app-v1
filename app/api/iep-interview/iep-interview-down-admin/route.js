import { connectDB } from '@/lib/db';
import Candidate from '@/models/Candidate'; // সঠিক মডেল ইম্পোর্ট
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    console.log('=== STARTING CANDIDATE SAVE PROCESS ===');
    
    // Connect to database
    await connectDB();
    console.log('✅ Database connected');
    
    // Parse request data
    const requestData = await request.json();
    console.log('📥 Received RAW data:', JSON.stringify(requestData, null, 2));
    
    // Validate required fields
    if (!requestData.candidateId) {
      console.log('❌ Validation failed: candidateId is required');
      return NextResponse.json({
        success: false,
        error: 'candidateId is required'
      }, { status: 400 });
    }
    
    if (!requestData.result) {
      console.log('❌ Validation failed: result is required');
      return NextResponse.json({
        success: false,
        error: 'result is required'
      }, { status: 400 });
    }
    
    // Check for duplicate candidate
    const existingCandidate = await Candidate.findOne({ 
      candidateId: requestData.candidateId 
    });
    
    if (existingCandidate) {
      console.log('❌ Duplicate candidate found:', requestData.candidateId);
      return NextResponse.json({
        success: false,
        error: `Candidate ${requestData.candidateId} already exists in database`
      }, { status: 409 });
    }
    
    // DEBUG: Log all incoming fields
    console.log('🔍 DEBUG - Incoming fields:');
    console.log('educationCertificate:', requestData.educationCertificate, typeof requestData.educationCertificate);
    console.log('experienceMachines:', requestData.experienceMachines, typeof requestData.experienceMachines);
    console.log('designation:', requestData.designation, typeof requestData.designation);
    
    // Prepare candidate data with PROPER nested structure
    const candidateData = {
      // Basic information
      candidateId: requestData.candidateId,
      result: requestData.result,
      name: requestData.interviewData?.name || requestData.name || 'Unknown Candidate',
      nid: requestData.interviewData?.nid || requestData.nid || '',
      
      // Certificate information - DIRECT boolean assignment
      chairmanCertificate: Boolean(requestData.chairmanCertificate),
      educationCertificate: Boolean(requestData.educationCertificate),
      
      // Experience machines - PROPER nested object structure
      experienceMachines: {
        SNLS_DNLS: Boolean(requestData.experienceMachines?.SNLS_DNLS),
        OverLock: Boolean(requestData.experienceMachines?.OverLock),
        FlatLock: Boolean(requestData.experienceMachines?.FlatLock)
      },
      
      // Designation - PROPER nested object structure
      designation: {
        ASST_OPERATOR: Boolean(requestData.designation?.ASST_OPERATOR),
        OPERATOR: Boolean(requestData.designation?.OPERATOR)
      },
      
      // Additional fields
      otherInfo: requestData.otherInfo || '',
      failureReason: requestData.failureReason || '',
      picture: requestData.interviewData?.picture || requestData.picture || '',
      birthCertificate: requestData.interviewData?.birthCertificate || requestData.birthCertificate || '',
      stepCompleted: requestData.stepCompleted || 1,
      
      // Interview data
      interviewData: requestData.interviewData || {}
    };
    
    console.log('💾 Prepared candidate data for saving:', JSON.stringify(candidateData, null, 2));
    
    // Create new candidate
    const candidate = await Candidate.create(candidateData);
    
    console.log('✅ Candidate successfully saved:', {
      id: candidate._id,
      candidateId: candidate.candidateId,
      name: candidate.name,
      educationCertificate: candidate.educationCertificate,
      experienceMachines: candidate.experienceMachines,
      designation: candidate.designation
    });
    
    return NextResponse.json({
      success: true,
      data: candidate,
      message: `Candidate ${candidate.candidateId} successfully saved as ${candidate.result}`
    }, { status: 201 });
    
  } catch (error) {
    console.error('❌ Error creating candidate:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return NextResponse.json({
        success: false,
        error: 'Candidate already exists in database (duplicate key)'
      }, { status: 409 });
    }
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      console.log('❌ Validation errors:', errors);
      return NextResponse.json({
        success: false,
        error: 'Data validation failed',
        details: errors
      }, { status: 400 });
    }
    
    // Handle Cast errors (invalid data types)
    if (error.name === 'CastError') {
      return NextResponse.json({
        success: false,
        error: `Invalid data type for field: ${error.path}`
      }, { status: 400 });
    }
    
    // Generic error
    return NextResponse.json({
      success: false,
      error: 'Internal server error: ' + error.message
    }, { status: 500 });
  }
}

// GET all candidates - এখানে সব ফিল্ড দেখাবে
export async function GET() {
  try {
    console.log('=== FETCHING ALL CANDIDATES ===');
    
    await connectDB();
    console.log('✅ Database connected for GET request');
    
    const candidates = await Candidate.find({})
      .sort({ createdAt: -1 });
    
    console.log(`✅ Found ${candidates.length} candidates`);
    
    // DEBUG: Check what fields are actually in the database
    if (candidates.length > 0) {
      console.log('🔍 Sample candidate from DB:', {
        educationCertificate: candidates[0].educationCertificate,
        experienceMachines: candidates[0].experienceMachines,
        designation: candidates[0].designation
      });
    }
    
    return NextResponse.json({
      success: true,
      data: candidates,
      count: candidates.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching candidates:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch candidates: ' + error.message
    }, { status: 500 });
  }
}