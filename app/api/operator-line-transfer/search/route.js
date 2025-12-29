// app/api/operator-line-transfer/search/route.js
import { connectDB } from "@/lib/db";
import DailyProduction from "@/models/DailyProduction";

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const operatorId = searchParams.get('operatorId');
    
    if (!date || !operatorId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Date and operatorId are required' 
        }),
        { status: 400 }
      );
    }
    
    const searchDate = new Date(date);
    
    // Find operator's current production data
    const currentData = await DailyProduction.findOne({
      date: {
        $gte: new Date(searchDate.setHours(0, 0, 0, 0)),
        $lt: new Date(searchDate.setHours(23, 59, 59, 999))
      },
      "operator.operatorId": operatorId
    });
    
    if (!currentData) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No production data found for this operator on the selected date' 
        }),
        { status: 404 }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          operator: currentData.operator,
          currentLine: currentData.line,
          workingHours: 8, // এইটা calculation করা লাগবে আপনার logic অনুযায়ী
          date: currentData.date,
          existingData: currentData
        }
      }),
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Search error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Internal server error' 
      }),
      { status: 500 }
    );
  }
}