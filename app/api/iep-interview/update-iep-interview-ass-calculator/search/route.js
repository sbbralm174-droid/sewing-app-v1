// app/api/iep-interview/search/route.js
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db';
import VivaInterview from '@/models/IepInterview'

export async function GET(request) {
  await connectDB()

  try {
    const { searchParams } = new URL(request.url)
    const candidateId = searchParams.get('candidateId')
    const name = searchParams.get('name')
    const nid = searchParams.get('nid')
    const birthCertificate = searchParams.get('birthCertificate')

    let query = {}

    if (candidateId) {
      query.candidateId = { $regex: candidateId, $options: 'i' }
    } else if (name) {
      query.name = { $regex: name, $options: 'i' }
    } else if (nid) {
      query.nid = { $regex: nid, $options: 'i' }
    } else if (birthCertificate) {
      query.birthCertificate = { $regex: birthCertificate, $options: 'i' }
    } else {
      return NextResponse.json(
        { error: 'No search criteria provided' },
        { status: 400 }
      )
    }

    const candidates = await VivaInterview.find(query)
      .select('candidateId name nid birthCertificate picture interviewStatus createdAt')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()

    return NextResponse.json({
      success: true,
      data: candidates
    })

  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}