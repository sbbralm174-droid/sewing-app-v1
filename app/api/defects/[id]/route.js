import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Defect from '@/models/Defect';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const defect = await Defect.findById(params.id);
    
    if (!defect) {
      return NextResponse.json({ message: 'Defect not found' }, { status: 404 });
    }
    
    return NextResponse.json(defect);
  } catch (error) {
    console.error('Error fetching defect:', error);
    return NextResponse.json({ message: 'Error fetching defect' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const body = await request.json();
    
    const defect = await Defect.findByIdAndUpdate(
      params.id,
      body,
      { new: true, runValidators: true }
    );
    
    if (!defect) {
      return NextResponse.json({ message: 'Defect not found' }, { status: 404 });
    }
    
    return NextResponse.json(defect);
  } catch (error) {
    console.error('Error updating defect:', error);
    return NextResponse.json({ message: 'Error updating defect' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const defect = await Defect.findByIdAndUpdate(
      params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!defect) {
      return NextResponse.json({ message: 'Defect not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Defect deleted successfully' });
  } catch (error) {
    console.error('Error deleting defect:', error);
    return NextResponse.json({ message: 'Error deleting defect' }, { status: 500 });
  }
}