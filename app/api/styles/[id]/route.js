import { connectDB } from '@/lib/db';
import Style from '@/models/Style';
import Buyer from '@/models/Buyer';

// GET - single style
export async function GET(request, { params }) {
  try {
    await connectDB();
    const style = await Style.findById(params.id).populate('buyerId', 'name email phone');
    
    if (!style) {
      return Response.json({
        success: false,
        error: 'Style not found'
      }, { status: 404 });
    }
    
    return Response.json({
      success: true,
      data: style
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// PUT - style update করা
export async function PUT(request, { params }) {
  try {
    await connectDB();
    const body = await request.json();

    // If buyer is being updated, verify new buyer exists
    if (body.buyerId) {
      const buyer = await Buyer.findById(body.buyerId);
      if (!buyer) {
        return Response.json({
          success: false,
          error: 'Buyer not found'
        }, { status: 404 });
      }
      body.buyerName = buyer.name;
    }

    const style = await Style.findByIdAndUpdate(
      params.id, 
      body, 
      { new: true, runValidators: true }
    ).populate('buyerId', 'name email phone');
    
    if (!style) {
      return Response.json({
        success: false,
        error: 'Style not found'
      }, { status: 404 });
    }
    
    return Response.json({
      success: true,
      data: style,
      message: 'Style updated successfully'
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 400 });
  }
}

// DELETE - style delete করা
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const style = await Style.findByIdAndDelete(params.id);
    
    if (!style) {
      return Response.json({
        success: false,
        error: 'Style not found'
      }, { status: 404 });
    }
    
    return Response.json({
      success: true,
      message: 'Style deleted successfully'
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}