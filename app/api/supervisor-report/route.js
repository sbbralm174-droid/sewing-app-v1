import { connectDB } from '@/lib/db';
import DailyProduction from '@/models/DailyProduction';

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const supervisor = searchParams.get('supervisor');
    
    console.log('Query params:', { startDate, endDate, supervisor });

    // Validation
    if (!startDate || !endDate) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Start date and end date are required' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Build query
    const query = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    // Add supervisor filter if provided
    if (supervisor && supervisor.trim() !== '') {
      query.supervisor = { $regex: supervisor, $options: 'i' };
    }

    console.log('MongoDB Query:', query);

    // Aggregate to get daily production data
    const productionData = await DailyProduction.aggregate([
      {
        $match: query
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            floor: "$floor",
            line: "$line"
          },
          totalTarget: { $sum: "$target" },
          totalAchievement: { 
            $sum: { 
              $sum: "$hourlyProduction.productionCount" 
            } 
          },
          supervisor: { $first: "$supervisor" }
        }
      },
      {
        $project: {
          _id: 0,
          date: "$_id.date",
          floor: "$_id.floor",
          line: "$_id.line",
          supervisor: 1,
          totalTarget: 1,
          totalAchievement: 1
        }
      },
      {
        $sort: { date: 1, floor: 1, line: 1 }
      }
    ]);

    console.log('Found records:', productionData.length);

    return new Response(
      JSON.stringify({
        success: true,
        data: productionData,
        totalRecords: productionData.length
      }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    );

  } catch (error) {
    console.error('Error in supervisor-report:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error: ' + error.message
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// OPTIONS method for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}