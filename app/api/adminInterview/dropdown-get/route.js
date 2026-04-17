// api/adminInterview/dropdown-get
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import VivaInterview from '@/models/IepInterview';
import AdminInterview from '@/models/AdminInterview';

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const floor = searchParams.get('floor');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let pipeline = [
      {
        $match: {
          result: { $in: ['PASSED', 'FAILED'] }
        }
      },
      {
        $lookup: {
          from: 'admininterviews', 
          localField: '_id',
          foreignField: 'candidateId',
          as: 'admin_record'
        }
      },
      {
        $match: {
          admin_record: { $size: 0 }
        }
      }
    ];

    if (floor) {
      pipeline.push({
        $match: { floor: floor }
      });
    }

    if (startDate || endDate) {
      let dateFilter = {};

      if (startDate) {
        
        const start = new Date(startDate);
        start.setUTCHours(0, 0, 0, 0); 
        dateFilter.$gte = start;
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999); 
        dateFilter.$lte = end;
      } else if (startDate) {
        const endOfDay = new Date(startDate);
        endOfDay.setUTCHours(23, 59, 59, 999);
        dateFilter.$lte = endOfDay;
      }

      pipeline.push({
        $match: { interviewDate: dateFilter }
      });
    }

    pipeline.push({
      $project: {
        admin_record: 0
      }
    });

    const candidates = await VivaInterview.aggregate(pipeline);

    return NextResponse.json({ success: true, data: candidates }, { status: 200 });
  } catch (error) {
    console.error("Aggregation Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}