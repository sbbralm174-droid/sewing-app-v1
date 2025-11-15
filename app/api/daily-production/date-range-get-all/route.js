import { connectDB } from '@/lib/db';
import DailyProduction from '@/models/DailyProduction';
import { NextResponse } from 'next/server';
import Buyer from '@/models/Buyer';
import Style from '@/models/Style';
import Operator from '@/models/Operator';


export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    console.log('🔍 API Called with dates:', { startDate, endDate });
    
    // Validate dates
    if (!startDate || !endDate) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Start date and end date are required',
          example: '/api/daily-production/date-range-get-all?startDate=2024-01-01&endDate=2024-01-31'
        },
        { status: 400 }
      );
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include the entire end date
    
    // Validate date format
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid date format. Please use YYYY-MM-DD format' 
        },
        { status: 400 }
      );
    }
    
    console.log('📅 Querying database with range:', { start, end });
    
    // Build query with date range
    const query = {
      date: {
        $gte: start,
        $lte: end
      }
    };
    
    console.log('🔍 MongoDB Query:', JSON.stringify(query, null, 2));
    
    // Fetch data from database
    const reports = await DailyProduction.find(query)
      .populate('buyerId', 'name')
      .populate('styleId', 'styleName styleNumber')
      .populate('operator._id', 'name operatorId')
      .sort({ date: -1, createdAt: -1 })
      .lean(); // Use lean() for better performance
    
    console.log(`📊 Found ${reports.length} records`);
    
    // Format the response data
    const formattedReports = reports.map(report => ({
      id: report._id.toString(),
      date: report.date,
      operator: report.operator,
      supervisor: report.supervisor,
      floor: report.floor,
      line: report.line,
      process: report.process,
      status: report.status,
      machineType: report.machineType,
      uniqueMachine: report.uniqueMachine,
      target: report.target,
      buyer: report.buyerId,
      style: report.styleId,
      workAs: report.workAs,
      hourlyProduction: report.hourlyProduction || [],
      totalProduction: (report.hourlyProduction || []).reduce((sum, hour) => sum + (hour.productionCount || 0), 0),
      totalDefects: (report.hourlyProduction || []).reduce((sum, hour) => 
        sum + (hour.defects || []).reduce((defectSum, defect) => defectSum + (defect.count || 0), 0), 0
      ),
      createdAt: report.createdAt
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedReports,
      total: formattedReports.length,
      dateRange: {
        startDate: startDate,
        endDate: endDate
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching reports:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch reports',
        details: error.message 
      },
      { status: 500 }
    );
  }
}