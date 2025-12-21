// /api/daily-production/route.js
import { connectDB } from '@/lib/db';
import DailyProduction from '@/models/DailyProduction';
import Machine from '@/models/Machine';
import { NextResponse } from 'next/server';


// GET method to fetch existing data
export async function GET(req) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const floor = searchParams.get('floor');
    const line = searchParams.get('line');
    
    if (!date || !floor || !line) {
      return NextResponse.json(
        { error: 'Date, floor, and line are required' },
        { status: 400 }
      );
    }
    
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);
    
    const records = await DailyProduction.find({
      date: { $gte: startOfDay, $lte: endOfDay },
      floor: floor,
      line: line
    })
    .populate('buyerId', 'name')
    .populate('styleId', 'name styleNo')
    .sort({ rowNo: 1 });
    
    return NextResponse.json({
      success: true,
      data: records,
      count: records.length
    });
    
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

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
        status = 'present',
        workAs,
        target,
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

      // Validation
      if (
        !date ||
        !buyerId ||
        !styleId ||
        !operatorId ||
        !operatorCode ||
        !operatorName ||
        (!process && !breakdownProcess) ||
        !workAs
      ) {
        console.log('Skipping invalid row - missing required fields:', {
          operatorName,
          process,
          breakdownProcess,
          hasBuyerId: !!buyerId,
          hasStyleId: !!styleId,
          hasOperatorCode: !!operatorCode
        });
        continue;
      }

      const entryDate = new Date(date);
      const startOfDay = new Date(entryDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(entryDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      // Duplicate check - শুধু operator দিয়েই চেক করুন
      const duplicate = await DailyProduction.findOne({
        date: { $gte: startOfDay, $lte: endOfDay },
        'operator.operatorId': operatorCode,
        floor: floor,
        line: line
      });

      if (duplicate) {
        console.log('Duplicate found for today, skipping:', {
          operator: operatorCode,
          floor,
          line
        });
        continue;
      }

      // Prepare payload
      const payload = {
        date: entryDate,
        buyerId,
        styleId,
        supervisor,
        floor,
        line,
        process: process || "",
        breakdownProcess: breakdownProcess || "",
        status,
        workAs,
        target: Number(target) || 0,
        operator: {
          _id: operatorId,
          operatorId: operatorCode,
          name: operatorName,
          designation: designation || "Operator"
        },
        machineType: workAs === 'operator' ? machineType : undefined,
        uniqueMachine: workAs === 'operator' ? uniqueMachine : undefined,
        smv: smv || "",
        smvType: smvType || "",
        rowNo: rowNo || 0,
        hourlyProduction: hourlyProduction.map(hourly => ({
          hour: hourly.hour,
          productionCount: Number(hourly.productionCount) || 0,
          defects: hourly.defects || []
        }))
      };

      console.log('Saving row:', {
        operator: operatorName,
        process: process || breakdownProcess,
        hourlyCount: hourlyProduction.length,
        hourlyData: hourlyProduction.map(h => ({ hour: h.hour, count: h.productionCount }))
      });

      try {
        const saved = await DailyProduction.create(payload);
        savedEntries.push(saved);

        // Machine location update
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
        inserted: savedEntries.length,
        details: savedEntries.map(entry => ({
          id: entry._id,
          operator: entry.operator.name,
          hourlyCount: entry.hourlyProduction.length
        }))
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



// PUT method for updating existing records
export async function PUT(req) {
  try {
    await connectDB();
    const body = await req.json();

    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json(
        { error: 'Payload must be a non-empty array' },
        { status: 400 }
      );
    }

    const updatedEntries = [];
    const errors = [];

    for (const row of body) {
      try {
        const {
          _id,
          date,
          buyerId,
          styleId,
          supervisor,
          floor,
          line,
          process,
          breakdownProcess,
          status = 'present',
          workAs,
          target,
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

        // If _id exists, update the record
        if (_id) {
          const updateData = {
            date: new Date(date),
            buyerId,
            styleId,
            supervisor,
            floor,
            line,
            process: process || "",
            breakdownProcess: breakdownProcess || "",
            status,
            workAs,
            target: Number(target) || 0,
            operator: {
              _id: operatorId,
              operatorId: operatorCode,
              name: operatorName,
              designation: designation || "Operator"
            },
            machineType: workAs === 'operator' ? machineType : undefined,
            uniqueMachine: workAs === 'operator' ? uniqueMachine : undefined,
            smv: smv || "",
            smvType: smvType || "",
            rowNo: rowNo || 0,
            hourlyProduction: hourlyProduction.map(hourly => ({
              hour: hourly.hour,
              productionCount: Number(hourly.productionCount) || 0,
              defects: hourly.defects || []
            })),
            updatedAt: new Date()
          };

          // Remove undefined fields
          Object.keys(updateData).forEach(key => 
            updateData[key] === undefined && delete updateData[key]
          );

          const updated = await DailyProduction.findByIdAndUpdate(
            _id,
            updateData,
            { new: true, runValidators: true }
          );

          if (updated) {
            updatedEntries.push(updated);
            
            // Update machine location if changed
            if (workAs === 'operator' && uniqueMachine) {
              await Machine.updateOne(
                { uniqueId: uniqueMachine },
                {
                  $set: {
                    lastLocation: {
                      date: new Date(date),
                      line,
                      supervisor,
                      floor,
                      updatedAt: new Date()
                    }
                  }
                }
              );
            }
          } else {
            errors.push(`Record not found: ${_id}`);
          }
        } else {
          // If no _id, create new record (for mixed updates)
          const newRecord = await DailyProduction.create({
            date: new Date(date),
            buyerId,
            styleId,
            supervisor,
            floor,
            line,
            process: process || "",
            breakdownProcess: breakdownProcess || "",
            status,
            workAs,
            target: Number(target) || 0,
            operator: {
              _id: operatorId,
              operatorId: operatorCode,
              name: operatorName,
              designation: designation || "Operator"
            },
            machineType: workAs === 'operator' ? machineType : undefined,
            uniqueMachine: workAs === 'operator' ? uniqueMachine : undefined,
            smv: smv || "",
            smvType: smvType || "",
            rowNo: rowNo || 0,
            hourlyProduction: hourlyProduction.map(hourly => ({
              hour: hourly.hour,
              productionCount: Number(hourly.productionCount) || 0,
              defects: hourly.defects || []
            }))
          });
          
          updatedEntries.push(newRecord);
        }
      } catch (rowError) {
        console.error(`Error updating row:`, rowError);
        errors.push(rowError.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Records updated successfully',
      updated: updatedEntries.length,
      errors: errors.length > 0 ? errors : undefined,
      details: updatedEntries.map(entry => ({
        id: entry._id,
        operator: entry.operator.name,
        hourlyCount: entry.hourlyProduction.length
      }))
    }, { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update records', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}