// /api/daily-production/route.js
import { connectDB } from '@/lib/db';
import DailyProduction from '@/models/DailyProduction';
import Machine from '@/models/Machine';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json(
        { error: 'Payload must be a non-empty array' },
        { status: 400 }
      );
    }

    const savedEntries = [];

    for (const row of body) {
      const {
        date,
        buyerId,
        styleId,
        supervisor,
        floor,
        line,
        process,
        breakdownProcess,
        workAs = 'operator',
        target = 0,
        operatorId,
        operatorCode,
        operatorName,
        designation,
        uniqueMachine,
        machineType,
        smv,
        smvType,
        rowNo,
        hourlyProduction = []
      } = row;

      // ✅ ONLY REQUIRED VALIDATION (OPERATOR ONLY)
      if (!operatorId || !operatorCode || !operatorName) {
        console.log('Skipping row - operator missing:', {
          operatorId,
          operatorCode,
          operatorName
        });
        continue;
      }

      const entryDate = date ? new Date(date) : new Date();

      const startOfDay = new Date(entryDate);
      startOfDay.setUTCHours(0, 0, 0, 0);

      const endOfDay = new Date(entryDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      // 🔴 PUT DUPLICATE CHECK HERE
  const duplicate = await DailyProduction.findOne({
    date: { $gte: startOfDay, $lte: endOfDay },
    'operator.operatorId': operatorCode,
    uniqueMachine: uniqueMachine
  });

  if (duplicate) {
    return NextResponse.json(
      {
        success: false,
        message: `Operator "${duplicate.operator.name}" (ID: ${duplicate.operator.operatorId}) এবং machine "${duplicate.uniqueMachine}" ইতিমধ্যে আজ ${duplicate.floor || 'একটি'} floor এর ${duplicate.line || 'একটি'} line এ entry করা আছে`
      },
      { status: 409 }
    );
  }




      // ✅ FINAL PAYLOAD (SAFE + OPTIONAL FIELDS)
      const payload = {
        date: entryDate,

        buyerId: buyerId || null,
        styleId: styleId || null,
        supervisor: supervisor || null,
        floor: floor || null,
        line: line || null,

        process: process || null,
        breakdownProcess: breakdownProcess || null,

        workAs,
        status: process || breakdownProcess ? 'present' : 'idle',
        target: Number(target) || 0,

        operator: {
          _id: operatorId,
          operatorId: operatorCode,
          name: operatorName,
          designation: designation || 'Operator'
        },

        machineType: workAs === 'operator' ? machineType || null : null,
        uniqueMachine: workAs === 'operator' ? uniqueMachine || null : null,

        smv: smv || null,
        smvType: smvType || null,

        rowNo: rowNo || 0,

        hourlyProduction: hourlyProduction.map(h => ({
          hour: h.hour,
          productionCount: Number(h.productionCount) || 0,
          defects: h.defects || []
        }))
      };

      try {
        const saved = await DailyProduction.create(payload);
        savedEntries.push(saved);

        // ✅ Machine location update (optional)
        if (workAs === 'operator' && uniqueMachine) {
          await Machine.updateOne(
            { uniqueId: uniqueMachine },
            {
              $set: {
                lastLocation: {
                  date: entryDate,
                  line,
                  supervisor,
                  floor,
                  updatedAt: new Date()
                }
              }
            }
          );
        }
      } catch (saveError) {
        console.error('Error saving row:', saveError.message);
        continue;
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Daily production saved successfully',
        inserted: savedEntries.length
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('DailyProduction POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save daily production',
        details: error.message
      },
      { status: 500 }
    );
  }
}
