// app/api/operator-line-transfer/transfer/route.js
import { connectDB } from "@/lib/db";
import DailyProduction from "@/models/DailyProduction";
import HistoryDailyProduction from "@/models/HistoryDailyProduction";
import mongoose from 'mongoose';


export async function POST(request) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    await connectDB();
    
    const body = await request.json();
    const { 
      operatorId, 
      date, 
      newLine, 
      workingHoursInPreviousLine,
      transferredBy 
    } = body;
    console.log("Creating new production data with previousLineWorkingTime:", workingHoursInPreviousLine);

    
    if (!operatorId || !date || !newLine || !workingHoursInPreviousLine) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Missing required fields' 
        }),
        { status: 400 }
      );
    }
    
    const transferDate = new Date(date);
    
    // Step 1: Find existing operator data
    const existingData = await DailyProduction.findOne({
      date: {
        $gte: new Date(transferDate.setHours(0, 0, 0, 0)),
        $lt: new Date(transferDate.setHours(23, 59, 59, 999))
      },
      "operator.operatorId": operatorId
    }).session(session);
    
    if (!existingData) {
      await session.abortTransaction();
      session.endSession();
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Operator data not found' 
        }),
        { status: 404 }
      );
    }
    
    // Step 2: Find common fields from another operator in the new line
    const commonFieldData = await DailyProduction.findOne({
      date: {
        $gte: new Date(transferDate.setHours(0, 0, 0, 0)),
        $lt: new Date(transferDate.setHours(23, 59, 59, 999))
      },
      line: newLine,
      "operator.operatorId": { $ne: operatorId } // অন্য operator
    }).session(session);
    
    if (!commonFieldData) {
      await session.abortTransaction();
      session.endSession();
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No data found in the new line to get common fields' 
        }),
        { status: 404 }
      );
    }
    
    // Step 3: Save to history before deletion
    const historyDoc = new HistoryDailyProduction({
      originalId: existingData._id,
      ...existingData.toObject(),
      action: 'line_change',
      movedToLine: newLine,
      movedAt: new Date(),
      transferredBy: transferredBy || 'system'
    });
    
    await historyDoc.save({ session });
    
    // Step 4: Delete old record
    await DailyProduction.findByIdAndDelete(existingData._id).session(session);
    
    // Step 5: Create new record in new line with common fields
    const newProductionData = new DailyProduction({
      date: existingData.date,
      operator: existingData.operator,
      supervisor: commonFieldData.supervisor,
      floor: commonFieldData.floor,
      line: newLine,
      process: existingData.process,
      jobNo: commonFieldData.jobNo,
      breakdownProcessTitle: existingData.breakdownProcessTitle,
      breakdownProcess: existingData.breakdownProcess,
      status: existingData.status,
      machineType: existingData.machineType,
      uniqueMachine: existingData.uniqueMachine,
      target: existingData.target,
      hourlyTarget: existingData.hourlyTarget,
      buyerId: commonFieldData.buyerId,
      styleId: commonFieldData.styleId,
      workAs: existingData.workAs,
      smv: existingData.smv,
      smvType: existingData.smvType,
      rowNo: existingData.rowNo,
      hourlyProduction: existingData.hourlyProduction,
      
      // New fields
      previousLineWorkingTime: workingHoursInPreviousLine,
      supervisorId: commonFieldData.supervisorId,
      floorId: commonFieldData.floorId,
      lineId: commonFieldData.lineId
    });
    
    await newProductionData.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Operator line transfer completed successfully',
        data: {
          newLine: newLine,
          previousLine: existingData.line,
          transferDate: new Date()
        }
      }),
      { status: 200 }
    );
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Transfer error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Internal server error during transfer' 
      }),
      { status: 500 }
    );
  }
}