// app/api/daily-production/update-hourly-target/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import DailyProduction from '@/models/DailyProduction';

// Hourly Target update করার API (PUT)
export async function PUT(request) {
  try {
    await connectDB();
    const body = await request.json();
    
    const { data } = body;
    
    if (!Array.isArray(data)) {
      return NextResponse.json({ 
        success: false, 
        message: "Data must be an array" 
      }, { status: 400 });
    }
    
    const updateOperations = data.map((item) => ({
      updateOne: {
        filter: { _id: item._id },
        update: { 
          $set: {
            hourlyTarget: item.hourlyTarget || '',
            updatedAt: new Date()
          } 
        }
      }
    }));

    const result = await DailyProduction.bulkWrite(updateOperations);

    return NextResponse.json({ 
      success: true, 
      message: `Hourly target updated for ${result.modifiedCount} items successfully!`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error("Hourly Target Update Error:", error);
    return NextResponse.json({ 
      success: false, 
      message: error.message 
    }, { status: 500 });
  }
}