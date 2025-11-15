import { connectDB } from '@/lib/db';
import IepInterviewStepOne from '@/models/IepInterviewStepOne';

import { NextResponse } from 'next/server';




export async function GET() {
  try {
    await connectDB();
    const IepInterviewStepOnePointOne = await IepInterviewStepOne.find({})
    return NextResponse.json(IepInterviewStepOnePointOne);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}