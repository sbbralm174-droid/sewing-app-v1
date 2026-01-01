import { connectDB } from '@/lib/db';
import DailyProduction from '@/models/DailyProduction';
import Machine from '@/models/Machine'; // Machine model import করুন
import mongoose from 'mongoose';

export async function POST(request) {
  try {
    await connectDB();
    
    const data = await request.json();
    const { productionInfo, rows } = data;

    console.log('=== RECEIVED DATA ===');
    console.log('Production Info:', productionInfo);
    console.log('Rows:', rows);
    console.log('=== END ===');

    if (!productionInfo || !rows || rows.length === 0) {
      return Response.json(
        { success: false, message: 'Production info and rows are required' },
        { status: 400 }
      );
    }

    // Validate required fields from productionInfo
    const requiredFields = ['supervisor', 'floor', 'line', 'buyerId', 'styleId', 'supervisorId', 'floorId', 'lineId', 'jobNo', 'date'];
    const missingFields = requiredFields.filter(field => !productionInfo[field]);
    
    if (missingFields.length > 0) {
      return Response.json(
        { 
          success: false, 
          message: `Missing required fields in productionInfo: ${missingFields.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Convert IDs to ObjectId
    const buyerId = new mongoose.Types.ObjectId(productionInfo.buyerId);
    const styleId = new mongoose.Types.ObjectId(productionInfo.styleId);
    const supervisorId = new mongoose.Types.ObjectId(productionInfo.supervisorId);
    const floorId = new mongoose.Types.ObjectId(productionInfo.floorId);
    const lineId = new mongoose.Types.ObjectId(productionInfo.lineId);

    const date = new Date(productionInfo.date);

    const dailyProductions = [];
    const machineUpdates = []; // Machine update তথ্য রাখার জন্য

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];

      if (!row.operatorMongoId && !row.operatorId) continue; // skip if no operator

      // Check if this operator already has a record for this date
      const exists = await DailyProduction.findOne({
        date: date,
        'operator._id': row.operatorMongoId ? new mongoose.Types.ObjectId(row.operatorMongoId) : undefined
      });

      if (exists) {
        console.log(`Skipping duplicate operator: ${row.operatorName || row.operatorId} on ${date.toDateString()}`);
        continue; // skip duplicate
      }

      let smvType = '';
      if (row.smv) {
        if (row.breakdownProcess && row.breakdownProcess.trim() !== '') {
          smvType = 'breakdown';
        } else if (row.process && row.process.trim() !== '') {
          smvType = 'process';
        }
      }

      dailyProductions.push({
        date,
        operator: {
          _id: row.operatorMongoId ? new mongoose.Types.ObjectId(row.operatorMongoId) : undefined,
          operatorId: row.operatorId || '',
          name: row.operatorName || '',
          designation: row.operatorDesignation || 'Operator'
        },
        supervisor: productionInfo.supervisor,
        floor: productionInfo.floor,
        line: productionInfo.line,
        jobNo: productionInfo.jobNo,
        process: row.process || '',
        breakdownProcessTitle: productionInfo.breakdownProcessTitle || '',
        breakdownProcess: row.breakdownProcess || '',
        status: 'present',
        machineType: row.machineType || '',
        uniqueMachine: row.machineUniqueId || '',
        target: row.target ? parseInt(row.target) : 0,
        buyerId,
        buyerName: productionInfo.buyerName || '',
        styleId,
        styleName: productionInfo.styleName || '',
        supervisorId,
        floorId,
        lineId,
        workAs: row.workAs || 'operator',
        smv: row.smv?.toString() || '',
        smvType,
        rowNo: index + 1,
        hourlyProduction: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Machine last location update করতে হবে যদি machineUniqueId থাকে
      if (row.machineUniqueId && row.machineUniqueId.trim() !== '') {
        machineUpdates.push({
          uniqueId: row.machineUniqueId,
          lastLocation: {
            date: date,
            line: productionInfo.line,
            supervisor: productionInfo.supervisor,
            floor: productionInfo.floor,
            updatedAt: new Date()
          }
        });
      }
    }

    if (dailyProductions.length === 0) {
      return Response.json({
        success: false,
        message: 'No new production records to save. All operators already exist for this date.'
      }, { status: 400 });
    }

    console.log(`Attempting to save ${dailyProductions.length} documents`);

    // Step 1: Machine collection এ last location update করুন
    const machineUpdatePromises = machineUpdates.map(async (update) => {
      try {
        const result = await Machine.findOneAndUpdate(
          { uniqueId: update.uniqueId },
          { 
            $set: { 
              lastLocation: update.lastLocation,
              updatedAt: new Date()
            } 
          },
          { new: true, upsert: false } // upsert false, কারণ machine আগে থেকে থাকতে হবে
        );
        
        if (!result) {
          console.log(`Machine with uniqueId ${update.uniqueId} not found`);
          return { uniqueId: update.uniqueId, status: 'not_found' };
        }
        
        console.log(`Updated last location for machine ${update.uniqueId}`);
        return { uniqueId: update.uniqueId, status: 'updated' };
      } catch (error) {
        console.error(`Error updating machine ${update.uniqueId}:`, error.message);
        return { uniqueId: update.uniqueId, status: 'error', error: error.message };
      }
    });

    // Step 2: Daily production save করুন
    const savedProductions = await DailyProduction.insertMany(dailyProductions);

    // Step 3: Machine update execute করুন
    const machineUpdateResults = await Promise.allSettled(machineUpdatePromises);

    // Machine update results লগ করুন
    console.log('Machine update results:', machineUpdateResults);

    console.log(`Successfully saved ${savedProductions.length} documents`);

    return Response.json({
      success: true,
      message: `Successfully saved ${savedProductions.length} production records and updated ${machineUpdates.length} machine locations`,
      data: savedProductions,
      machineUpdates: machineUpdateResults,
      count: savedProductions.length
    }, { status: 201 });

  } catch (error) {
    console.error('=== ERROR DETAILS ===', error);

    return Response.json(
      { 
        success: false, 
        message: 'Failed to save production data',
        error: error.message,
        details: error.errors ? Object.keys(error.errors) : []
      },
      { status: 500 }
    );
  }
}