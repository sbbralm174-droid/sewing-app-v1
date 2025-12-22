import DailyProduction from '@/models/DailyProduction';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';

export async function PUT(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    const updateData = await request.json();
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid production ID' },
        { status: 400 }
      );
    }
    
    // Find and update
    const updatedProduction = await DailyProduction.findByIdAndUpdate(
      id,
      { 
        ...updateData,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    )
    .populate('buyerId', 'name')
    .populate('styleId', 'name styleNo')
    .populate('operator._id', 'name operatorId designation');
    
    if (!updatedProduction) {
      return NextResponse.json(
        { error: 'Production not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      data: updatedProduction 
    });
    
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json(
      { error: 'Failed to update production' },
      { status: 500 }
    );
  }
}