// app/api/iep-interview/update-iep-interview-ass-calculator/candidate-iep-data/route.js
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import VivaInterview from '@/models/IepInterview'

export async function GET(request) {
  await connectDB()

  try {
    const { searchParams } = new URL(request.url)
    const candidateId = searchParams.get('candidateId')

    if (!candidateId) {
      return NextResponse.json(
        { error: 'Candidate ID is required' },
        { status: 400 }
      )
    }

    // Candidate এর পূর্বের IEP interview ডেটা খুঁজুন
    const previousInterview = await VivaInterview.findOne({ 
      candidateId 
    }).sort({ createdAt: -1 })

    if (!previousInterview) {
      return NextResponse.json(
        { 
          success: true,
          data: null,
          message: 'No previous interview data found'
        }
      )
    }

    // Process measurements ডেটা এক্সট্র্যাক্ট করুন
    const processMeasurements = previousInterview.assessmentData?.processes || []

    return NextResponse.json({
      success: true,
      data: {
        processMeasurements,
        previousInterviewDate: previousInterview.interviewDate,
        previousGrade: previousInterview.grade,
        supplementaryMachines: previousInterview.supplementaryMachines || {}
      }
    })

  } catch (error) {
    console.error('Error fetching candidate IEP data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}