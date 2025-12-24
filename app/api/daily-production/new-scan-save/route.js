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

    // Validate and convert ObjectId fields
    const buyerId = productionInfo.buyerId;
    const styleId = productionInfo.styleId;
    const supervisorId = productionInfo.supervisorId;
    const floorId = productionInfo.floorId;
    const lineId = productionInfo.lineId;

    // Check if IDs are valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(buyerId)) {
      return Response.json(
        { success: false, message: 'Invalid buyerId format' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(styleId)) {
      return Response.json(
        { success: false, message: 'Invalid styleId format' },
        { status: 400 }
      );
    }

    // Validate each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      if (!row.operatorId || !row.operatorName) {
        return Response.json(
          { 
            success: false, 
            message: `Row ${i + 1}: operatorId and operatorName are required` 
          },
          { status: 400 }
        );
      }
      
      // Check if operatorId is valid ObjectId
      if (row.operatorId && !mongoose.Types.ObjectId.isValid(row.operatorId)) {
        return Response.json(
          { 
            success: false, 
            message: `Row ${i + 1}: Invalid operatorId format` 
          },
          { status: 400 }
        );
      }
    }

    // Prepare daily production documents
    const dailyProductions = rows.map((row, index) => {
      // Determine SMV type based on breakdownProcess
      let smvType = '';
      if (row.smv) {
        if (row.breakdownProcess && row.breakdownProcess.trim() !== '') {
          smvType = 'breakdown';
        } else if (row.process && row.process.trim() !== '') {
          smvType = 'process';
        }
      }

      // Create document
      const productionDoc = {
        date: new Date(productionInfo.date),
        operator: {
          _id: row.operatorId || null,
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
        buyerId: new mongoose.Types.ObjectId(buyerId), // Convert to ObjectId
        buyerName: productionInfo.buyerName || '',
        styleId: new mongoose.Types.ObjectId(styleId), // Convert to ObjectId
        styleName: productionInfo.styleName || '',
        supervisorId: new mongoose.Types.ObjectId(supervisorId),
        floorId: new mongoose.Types.ObjectId(floorId),
        lineId: new mongoose.Types.ObjectId(lineId),
        workAs: row.workAs || 'operator',
        smv: row.smv?.toString() || '',
        smvType: smvType,
        rowNo: index + 1,
        hourlyProduction: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Log each document for debugging
      console.log(`Document ${index + 1}:`, {
        operator: productionDoc.operator,
        buyerId: productionDoc.buyerId,
        styleId: productionDoc.styleId,
        supervisor: productionDoc.supervisor,
        floor: productionDoc.floor,
        line: productionDoc.line
      });

      return productionDoc;
    });

    console.log(`Attempting to save ${dailyProductions.length} documents`);

    // Save to database
    const savedProductions = await DailyProduction.insertMany(dailyProductions);

    console.log(`Successfully saved ${savedProductions.length} documents`);

    return Response.json({
      success: true,
      message: `Successfully saved ${savedProductions.length} production records`,
      data: savedProductions,
      count: savedProductions.length
    }, { status: 201 });

  } catch (error) {
    console.error('=== ERROR DETAILS ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.errors) {
      console.error('Validation errors:', Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message,
        value: error.errors[key].value
      })));
    }
    
    console.error('=== END ERROR ===');
    
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