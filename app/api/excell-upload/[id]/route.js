import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Breakdown } from '@/models/Breakdown';
import mongoose from 'mongoose';

// GET single document by ID
export async function GET(req, { params }) {
  try {
    const { id } = await params;
    
    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid document ID' 
      }, { status: 400 });
    }

    await connectDB();
    
    const document = await Breakdown.findById(id).select('-__v');
    
    if (!document) {
      return NextResponse.json({ 
        success: false, 
        message: 'Document not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: document
    });

  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// DELETE document by ID
export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid document ID' 
      }, { status: 400 });
    }

    await connectDB();
    
    const deletedDocument = await Breakdown.findByIdAndDelete(id);
    
    if (!deletedDocument) {
      return NextResponse.json({ 
        success: false, 
        message: 'Document not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
      deletedId: id
    });

  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}