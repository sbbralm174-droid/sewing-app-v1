import { NextResponse } from 'next/server';
import Candidate from '@/models/Candidate';
import { connectDB } from '@/lib/db';



export async function GET(request) {
  try {
    // Connect to database
    await connectDB();

    // Get search params from URL
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidateId');

    // Validate candidateId
    if (!candidateId) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Candidate ID is required' 
        },
        { status: 400 }
      );
    }

    // Search for candidate by candidateId
    const candidate = await Candidate.findOne({ candidateId });

    if (!candidate) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Candidate not found' 
        },
        { status: 404 }
      );
    }

    // Return candidate data
    return NextResponse.json({
      success: true,
      message: 'Candidate found successfully',
      data: candidate
    });

  } catch (error) {
    console.error('Search API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error.message 
      },
      { status: 500 }
    );
  }
}