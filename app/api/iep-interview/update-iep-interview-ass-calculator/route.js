// app/api/iep-interview/update-iep-interview-ass-calculator/route.js
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import VivaInterview from '@/models/IepInterview'

export async function PUT(request) {
  try {
    await connectDB()

    const { candidateId, assessmentData } = await request.json()

    if (!candidateId) {
      return NextResponse.json(
        { success: false, message: 'Candidate ID is required' },
        { status: 400 }
      )
    }

    // Find and update the candidate
    const updatedCandidate = await VivaInterview.findOneAndUpdate(
      { candidateId },
      { 
        $set: { 
          assessmentData,
          // Additional fields you might want to update
          processCapacity: assessmentData.processCapacity || {},
          supplementaryMachines: assessmentData.supplementaryMachines || {},
          grade: assessmentData.finalAssessment?.grade || 'C',
          result: 'PASSED' // Or calculate based on assessment
        }
      },
      { new: true, runValidators: true }
    )

    if (!updatedCandidate) {
      return NextResponse.json(
        { success: false, message: 'Candidate not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Assessment data updated successfully',
      data: updatedCandidate
    })

  } catch (error) {
    console.error('Error updating assessment data:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}