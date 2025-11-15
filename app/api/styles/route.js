// app/api/styles/route.js


import { connectDB } from '@/lib/db';
import Style from '@/models/Style';
import Buyer from '@/models/Buyer';

// GET - সব styles নিয়ে আসা (with filtering by buyer)
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const buyerId = searchParams.get('buyerId');

    let query = {};
    if (buyerId) {
      query.buyerId = buyerId;
    }

    const styles = await Style.find(query)
      .populate('buyerId', 'name email phone')
      .sort({ createdAt: -1 });

    return Response.json({
      success: true,
      data: styles
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// POST - নতুন style তৈরি করা
export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();

    // Check if buyer exists
    const buyer = await Buyer.findById(body.buyerId);
    if (!buyer) {
      return Response.json({
        success: false,
        error: 'Buyer not found'
      }, { status: 404 });
    }

    // Check if style name already exists for this buyer
    const existingStyle = await Style.findOne({
      name: body.name,
      buyerId: body.buyerId
    });

    if (existingStyle) {
      return Response.json({
        success: false,
        error: 'Style name already exists for this buyer'
      }, { status: 400 });
    }

    const style = await Style.create({
      ...body,
      buyerName: buyer.name
    });

    return Response.json({
      success: true,
      data: style,
      message: 'Style created successfully'
    }, { status: 201 });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 400 });
  }
}