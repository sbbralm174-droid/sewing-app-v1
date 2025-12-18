
// /api/daily-production
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
        status,
        workAs,
        target,

        operatorId,
        operatorCode,
        operatorName,
        designation,

        uniqueMachine,
        machineType
      } = row;

      /* ===== Validation ===== */
      if (
        !date ||
        !buyerId ||
        !styleId ||
        !operatorId ||
        !operatorCode ||
        !operatorName ||
        !process ||
        !workAs ||
        !status
      ) {
        continue; // skip invalid row
      }

      const entryDate = new Date(date);

      const startOfDay = new Date(entryDate);
      startOfDay.setUTCHours(0, 0, 0, 0);

      const endOfDay = new Date(entryDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      /* ===== Duplicate check ===== */
      if (workAs === 'operator') {
        const duplicate = await DailyProduction.findOne({
          date: { $gte: startOfDay, $lte: endOfDay },
          $or: [
            { 'operator.operatorId': operatorCode },
            { uniqueMachine }
          ]
        });

        if (duplicate) continue;
      }

      /* ===== Mapping ===== */
      const payload = {
        date: entryDate,
        buyerId,
        styleId,
        supervisor,
        floor,
        line,
        process,
        status,
        workAs,
        target,

        operator: {
          _id: operatorId,
          operatorId: operatorCode,
          name: operatorName,
          designation
        },

        machineType: workAs === 'operator' ? machineType : undefined,
        uniqueMachine: workAs === 'operator' ? uniqueMachine : undefined,

        hourlyProduction: []
      };

      const saved = await DailyProduction.create(payload);
      savedEntries.push(saved);

      /* ===== Machine location update ===== */
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
    }

    return NextResponse.json(
      {
        message: 'Daily production saved',
        inserted: savedEntries.length
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('DailyProduction POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save daily production' },
      { status: 500 }
    );
  }
}






// export async function POST(req) {
//   try {
//     await connectDB();
//     const body = await req.json();

//     const { date, operator, workAs, uniqueMachine, buyerId, styleId, line, supervisor, floor } = body;

//     // Validation
//     if (!buyerId || !styleId) {
//       return NextResponse.json({ error: 'Buyer and Style are required.' }, { status: 400 });
//     }

//     const entryDate = new Date(date);
//     if (isNaN(entryDate.getTime())) {
//       return NextResponse.json({ error: 'Invalid date format provided.' }, { status: 400 });
//     }

//     const startOfDay = new Date(entryDate);
//     startOfDay.setUTCHours(0, 0, 0, 0);
//     const endOfDay = new Date(entryDate);
//     endOfDay.setUTCHours(23, 59, 59, 999);

//     // Duplicate check for operator
//     if (workAs === 'operator') {
//       const existingEntry = await DailyProduction.findOne({
//         date: { $gte: startOfDay, $lte: endOfDay },
//         $or: [
//           { 'operator.operatorId': operator.operatorId },
//           { uniqueMachine: uniqueMachine }
//         ]
//       });

//       if (existingEntry) {
//         let errorMessage = 'Duplicate entry detected for this date.';
//         if (existingEntry.operator.operatorId === operator.operatorId) {
//           errorMessage = 'This operator already has a production entry for the selected date.';
//         } else if (existingEntry.uniqueMachine === uniqueMachine) {
//           errorMessage = 'This machine already has a production entry for the selected date.';
//         }
//         return NextResponse.json({ error: errorMessage }, { status: 400 });
//       }
//     }

//     // Prepare payload
//     let payload = { ...body, date: entryDate, buyerId, styleId };

//     if (workAs === 'helper') {
//       payload.machineType = undefined;
//       payload.uniqueMachine = undefined;
//     }

//     const productionEntry = await DailyProduction.create(payload);

    
// if (workAs === 'operator' && uniqueMachine && line && supervisor && floor) {
//   console.log("🟢 Attempting to update Machine lastLocation with:", { 
//     uniqueMachine, 
//     line, 
//     supervisor, 
//     floor 
//   });

//   try {
//     // Check if machine exists
//     const machineExists = await Machine.findOne({ uniqueId: uniqueMachine });
//     console.log("🔍 Machine found:", machineExists ? "Yes" : "No");
    
//     if (machineExists) {
//       console.log("📋 Current machine data:", JSON.stringify(machineExists, null, 2));
      
//       // Perform update
//       const updateResult = await Machine.updateOne(
//   { uniqueId: uniqueMachine },
//   {
//     $set: {
//       lastLocation: {
//         date: new Date(entryDate),
//         line,
//         supervisor,
//         floor,
//         updatedAt: new Date()
//       }
//     }
//   },
//   { strict: 'throw' } // এই অপশনটি যোগ করুন
// );
      
//       console.log("📊 Update result:", updateResult);
      
//       // Verify update
//       const updatedMachine = await Machine.findOne({ uniqueId: uniqueMachine });
//       console.log("✅ After update - lastLocation:", updatedMachine.lastLocation);
//     }
//   } catch (updateError) {
//     console.error("❌ Error updating machine lastLocation:", updateError);
//   }
// }

//     return NextResponse.json(productionEntry, { status: 201 });
//   } catch (error) {
//     console.error('Error creating production entry:', error);
//     return NextResponse.json({ error: 'Failed to create production entry. Please try again.' }, { status: 500 });
//   }
// }

// export async function GET(req) {
//   try {
//     await connectDB();
//     const { searchParams } = new URL(req.url);
//     const dateParam = searchParams.get('date');
//     const operatorId = searchParams.get('operatorId');
//     const machine = searchParams.get('machine');
//     const buyerId = searchParams.get('buyerId');
//     const styleId = searchParams.get('styleId');

//     let query = {};

//     if (dateParam) {
//       const date = new Date(dateParam);
//       if (isNaN(date.getTime())) {
//         return NextResponse.json(
//           { error: 'Invalid date format.' },
//           { status: 400 }
//         );
//       }

//       const startOfDay = new Date(date);
//       startOfDay.setUTCHours(0, 0, 0, 0);

//       const endOfDay = new Date(date);
//       endOfDay.setUTCHours(23, 59, 59, 999);

//       query.date = { $gte: startOfDay, $lte: endOfDay };
//     }

//     if (operatorId) {
//       query['operator.operatorId'] = operatorId;
//     }
//     if (machine) {
//       query.uniqueMachine = machine;
//     }
//     if (buyerId) {
//       query.buyerId = buyerId;
//     }
//     if (styleId) {
//       query.styleId = styleId;
//     }

//     const data = await DailyProduction.find(query)
//       .populate('buyerId', 'name email phone')
//       .populate('styleId', 'styleNumber styleName');

//     return NextResponse.json(data);
//   } catch (error) {
//     console.error('Error fetching production data:', error);
//     return NextResponse.json(
//       { error: 'Failed to fetch production data.' },
//       { status: 500 }
//     );
//   }
// }