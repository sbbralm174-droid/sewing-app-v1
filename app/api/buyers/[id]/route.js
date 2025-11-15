import { connectDB } from '@/lib/db';
import Buyer from '@/models/Buyer';

// GET - single buyer
export async function GET(request, { params }) {
  try {
    await connectDB();
    const buyer = await Buyer.findById(params.id);
    
    if (!buyer) {
      return Response.json({
        success: false,
        error: 'Buyer not found'
      }, { status: 404 });
    }
    
    return Response.json({
      success: true,
      data: buyer
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// PUT - buyer update করা
export async function PUT(request, { params }) {
  try {
    await connectDB();
    const body = await request.json();
    
    const buyer = await Buyer.findByIdAndUpdate(
      params.id, 
      body, 
      { new: true, runValidators: true }
    );
    
    if (!buyer) {
      return Response.json({
        success: false,
        error: 'Buyer not found'
      }, { status: 404 });
    }
    
    return Response.json({
      success: true,
      data: buyer,
      message: 'Buyer updated successfully'
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 400 });
  }
}

// DELETE - buyer delete করা
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const buyer = await Buyer.findByIdAndDelete(params.id);
    
    if (!buyer) {
      return Response.json({
        success: false,
        error: 'Buyer not found'
      }, { status: 404 });
    }
    
    return Response.json({
      success: true,
      message: 'Buyer deleted successfully'
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}