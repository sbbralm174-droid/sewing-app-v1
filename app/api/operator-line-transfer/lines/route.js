// app/api/operator-line-transfer/lines/route.js
import { connectDB } from "@/lib/db";
import DailyProduction from "@/models/DailyProduction";

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    
    if (!date) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Date is required' 
        }),
        { status: 400 }
      );
    }
    
    const searchDate = new Date(date);
    
    // Get all active lines for the date
    const lines = await DailyProduction.distinct('line', {
      date: {
        $gte: new Date(searchDate.setHours(0, 0, 0, 0)),
        $lt: new Date(searchDate.setHours(23, 59, 59, 999))
      }
    });
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: lines 
      }),
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Lines fetch error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Internal server error' 
      }),
      { status: 500 }
    );
  }
}