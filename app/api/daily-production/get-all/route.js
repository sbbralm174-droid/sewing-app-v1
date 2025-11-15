// app/api/daily-productions/all/route.js
import { connectDB } from '@/lib/db';
import DailyProduction from '@/models/DailyProduction';
import Style from '@/models/Style';




export async function GET() {
  try {
    await connectDB();

    const allProductions = await DailyProduction.find({})
      .populate('buyerId', 'name code')
      .populate('styleId', 'styleName styleNumber')
      .sort({ date: -1, createdAt: -1 })
      .lean();

    return new Response(JSON.stringify({
      success: true,
      data: allProductions,
      count: allProductions.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching all daily productions:', error);
    
    return new Response(JSON.stringify({
      success: false,
      message: 'Failed to fetch daily productions',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}