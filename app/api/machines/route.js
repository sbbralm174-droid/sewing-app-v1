// app/api/machines/route.js
import { connectDB } from '@/lib/db';
import Machine from '@/models/Machine';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await connectDB();

    // 🔹 AUTO TODAY
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const machines = await Machine.aggregate([
      // =========================
      // 🔥 FIX: string -> ObjectId
      // =========================
      {
        $addFields: {
          machineTypeObjectId: {
            $cond: [
              { $eq: [{ $type: '$machineType' }, 'string'] },
              { $toObjectId: '$machineType' },
              '$machineType'
            ]
          }
        }
      },

      // =========================
      // machineType populate
      // =========================
      {
        $lookup: {
          from: 'machinetypes',
          localField: 'machineTypeObjectId',
          foreignField: '_id',
          as: 'machineType'
        }
      },
      {
        $unwind: {
          path: '$machineType',
          preserveNullAndEmptyArrays: true
        }
      },

      // =========================
      // floor populate
      // =========================
      {
        $lookup: {
          from: 'floors',
          localField: 'lastLocation.floor',
          foreignField: '_id',
          as: 'lastLocationFloor'
        }
      },
      {
        $unwind: {
          path: '$lastLocationFloor',
          preserveNullAndEmptyArrays: true
        }
      },

      // =========================
      // line populate
      // =========================
      {
        $lookup: {
          from: 'floorlines',
          localField: 'lastLocation.line',
          foreignField: '_id',
          as: 'lastLocationLine'
        }
      },
      {
        $unwind: {
          path: '$lastLocationLine',
          preserveNullAndEmptyArrays: true
        }
      },

      // =========================
      // rebuild lastLocation
      // =========================
      {
        $addFields: {
          'lastLocation.floor': '$lastLocationFloor',
          'lastLocation.line': '$lastLocationLine'
        }
      },

      // =========================
      // DailyProduction check
      // =========================
      {
        $lookup: {
          from: 'dailyproductions',
          let: { machineId: '$uniqueId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$uniqueMachine', '$$machineId'] },
                    { $gte: ['$date', start] },
                    { $lte: ['$date', end] }
                  ]
                }
              }
            },
            { $limit: 1 }
          ],
          as: 'todayProduction'
        }
      },

      // =========================
      // status set
      // =========================
      {
        $addFields: {
          currentStatus: {
            $cond: [
              { $gt: [{ $size: '$todayProduction' }, 0] },
              'running',
              'idle'
            ]
          }
        }
      },

      // =========================
      // cleanup
      // =========================
      {
        $project: {
          machineTypeObjectId: 0,
          lastLocationFloor: 0,
          lastLocationLine: 0,
          todayProduction: 0
        }
      }
    ]);

    return NextResponse.json(machines);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
