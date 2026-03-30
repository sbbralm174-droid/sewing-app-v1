import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import VivaInterview from '@/models/IepInterview';

export async function PUT(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { candidateId, assessmentData } = body;

    console.log('Received update request for candidate:', candidateId);
    console.log('Assessment data structure:', Object.keys(assessmentData));

    if (!candidateId) {
      return NextResponse.json(
        { success: false, message: 'Candidate ID is required' },
        { status: 400 }
      );
    }

    // Validate assessmentData structure
    if (!assessmentData || !assessmentData.rawData) {
      return NextResponse.json(
        { success: false, message: 'Invalid assessment data structure' },
        { status: 400 }
      );
    }

    // Find the candidate by candidateId and update assessment data
    const updatedCandidate = await VivaInterview.findOneAndUpdate(
      { candidateId: candidateId },
      { 
        $set: { 
          assessmentData: assessmentData,
          'processCapacity': assessmentData.processCapacity || {},
          'supplementaryMachines': assessmentData.supplementaryMachines || {},
          'grade': assessmentData.finalAssessment?.grade || 'Unskill',
          'result': 'PASSED',
          updatedAt: new Date()
        } 
      },
      { new: true } // Return the updated document
    );

    if (!updatedCandidate) {
      return NextResponse.json(
        { success: false, message: 'Candidate not found' },
        { status: 404 }
      );
    }

    console.log('Assessment updated successfully for candidate:', candidateId);

    return NextResponse.json({
      success: true,
      message: 'Assessment updated successfully',
      data: {
        candidateId: updatedCandidate.candidateId,
        assessmentData: updatedCandidate.assessmentData,
        grade: updatedCandidate.grade
      }
    });

  } catch (error) {
    console.error('Error updating assessment:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}