import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Defect from '@/models/Defect';

export async function GET() {
  try {
    await connectDB();
    const defects = await Defect.find({ isActive: true }).sort({ name: 1 });
    return NextResponse.json(defects);
  } catch (error) {
    console.error('Error fetching defects:', error);
    return NextResponse.json({ message: 'Error fetching defects' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    
    const defect = new Defect(body);
    await defect.save();
    
    return NextResponse.json(defect, { status: 201 });
  } catch (error) {
    console.error('Error creating defect:', error);
    
    return NextResponse.json({ message: 'Error creating defect' }, { status: 500 });
  }
}