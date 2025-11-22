// app/api/iep-interview/update-iep-interview-ass-calculator/candidate/route.js
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db';
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

    const candidate = await VivaInterview.findOne({ candidateId })
      .select('candidateId name nid birthCertificate picture interviewStatus assessmentData')
      .lean()

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: candidate
    })

  } catch (error) {
    console.error('Candidate fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}