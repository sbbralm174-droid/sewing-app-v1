import { connectDB } from '@/lib/db';
import Machine from '@/models/Machine';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await connectDB();

    const machines = await Machine.aggregate([
      // =========================
      // 🔥 FIX: machineType string -> ObjectId
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
      // 🔥 TIMEZONE SAFE DATE COMPARE
      // =========================
      {
        $addFields: {
          lastLocationDateOnly: {
            $cond: [
              { $ifNull: ['$lastLocation.date', false] },
              {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$lastLocation.date',
                  timezone: 'Asia/Dhaka'
                }
              },
              null
            ]
          },
          todayDateOnly: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: new Date(),
              timezone: 'Asia/Dhaka'
            }
          }
        }
      },

      // =========================
      // 🔥 RUNNING / IDLE LOGIC (FINAL)
      // =========================
      {
        $addFields: {
          currentStatus: {
            $cond: [
              {
                $and: [
                  { $ne: ['$lastLocationDateOnly', null] },
                  { $eq: ['$lastLocationDateOnly', '$todayDateOnly'] }
                ]
              },
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
          lastLocationDateOnly: 0,
          todayDateOnly: 0
        }
      }
    ]);

    return NextResponse.json(machines);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const machine = await Machine.create(body);
    return NextResponse.json(machine, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
