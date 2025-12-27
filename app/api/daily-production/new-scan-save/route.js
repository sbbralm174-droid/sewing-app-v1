

import { connectDB } from '@/lib/db';
import DailyProduction from '@/models/DailyProduction';
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
    const requiredFields = ['supervisor', 'floor', 'line', 'buyerId', 'styleId', 'supervisorId', 'floorId', 'lineId'];
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

    // Prepare daily production documents (operator validation removed)
    const dailyProductions = rows.map((row, index) => {
      let smvType = '';
      if (row.smv) {
        if (row.breakdownProcess && row.breakdownProcess.trim() !== '') {
          smvType = 'breakdown';
        } else if (row.process && row.process.trim() !== '') {
          smvType = 'process';
        }
      }

      return {
        date: new Date(productionInfo.date),
        operator: {
          _id: row.operatorMongoId ? new mongoose.Types.ObjectId(row.operatorMongoId) : undefined,
          operatorId: row.operatorId || '',
          name: row.operatorName || '',
          designation: row.operatorDesignation || 'Operator'
        },
        supervisor: productionInfo.supervisor,
        floor: productionInfo.floor,
        line: productionInfo.line,
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
      };
    });

    console.log(`Attempting to save ${dailyProductions.length} documents`);

    const savedProductions = await DailyProduction.insertMany(dailyProductions);

    console.log(`Successfully saved ${savedProductions.length} documents`);

    return Response.json({
      success: true,
      message: `Successfully saved ${savedProductions.length} production records`,
      data: savedProductions,
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
