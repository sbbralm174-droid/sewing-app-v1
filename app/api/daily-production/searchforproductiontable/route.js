import DailyProduction from '@/models/DailyProduction';
import { NextResponse } from 'next/server';
import Operator from "@/models/Operator";
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const floor = searchParams.get('floor');
    const line = searchParams.get('line');
    
    if (!date || !floor || !line) {
      return NextResponse.json(
        { error: 'Date, floor, and line are required' },
        { status: 400 }
      );
    }
    
    // Parse date (expecting YYYY-MM-DD format)
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    const productions = await DailyProduction.find({
      date: {
        $gte: startDate,
        $lte: endDate
      },
      floor: floor,
      line: line
    })
    .populate('buyerId', 'name')
    .populate('styleId', 'name styleNo')
    .populate('operator._id', 'name operatorId designation')
    .sort({ rowNo: 1 }) // rowNo অনুযায়ী সাজানো
    .lean();
    
    return NextResponse.json({ data: productions });
    
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search productions' },
      { status: 500 }
    );
  }
}