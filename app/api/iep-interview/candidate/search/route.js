// app/api/iep-interview/candidate/search/route.js

import { NextResponse } from 'next/server';
import VivaInterview from '@/models/IepInterview';
import { connectDB } from '@/lib/db';

export async function POST(request) {
  try {
    await connectDB();
    
    const { searchTerm } = await request.json();
    
    if (!searchTerm || searchTerm.trim().length < 3) {
      return NextResponse.json(
        { error: 'Search term must be at least 3 characters long' },
        { status: 400 }
      );
    }

    const candidates = await VivaInterview.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { candidateId: { $regex: searchTerm, $options: 'i' } },
        { nid: { $regex: searchTerm, $options: 'i' } },
        { birthCertificate: { $regex: searchTerm, $options: 'i' } }
      ]
    }).select('candidateId name nid birthCertificate interviewDate department result')
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({ candidates });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}