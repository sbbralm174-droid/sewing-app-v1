// api/buyers/route.js

import { connectDB } from '@/lib/db';
import Buyer from '@/models/Buyer';

// GET - সব buyers নিয়ে আসা
export async function GET() {
  try {
    await connectDB();
    const buyers = await Buyer.find({}).sort({ createdAt: -1 });
    
    return Response.json({
      success: true,
      data: buyers
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// POST - নতুন buyer তৈরি করা
export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    
    const buyer = await Buyer.create(body);
    
    return Response.json({
      success: true,
      data: buyer,
      message: 'Buyer successfully created'
    }, { status: 201 });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 400 });
  }
}