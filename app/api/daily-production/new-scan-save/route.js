import { connectDB } from '@/lib/db';
import DailyProduction from '@/models/DailyProduction';
import Machine from '@/models/Machine';
import Operator from '@/models/Operator';
import mongoose from 'mongoose';

export async function POST(request) {
  try {
    await connectDB();
    const data = await request.json();
    const { productionInfo, rows } = data;

    if (!productionInfo || !rows || rows.length === 0) {
      return Response.json({ success: false, message: 'Invalid payload' }, { status: 400 });
    }

    const date = new Date(productionInfo.date);
    
    // ১. একবারে এই তারিখের সব বিদ্যমান প্রোডাকশন ডাটা নিয়ে আসা (Duplicate check-এর জন্য)
    const existingEntries = await DailyProduction.find({ date }, 'operator.operatorId');
    const existingOperatorIds = new Set(existingEntries.map(e => e.operator.operatorId));

    const dailyProductions = [];
    const machineBulkOps = [];
    const operatorBulkOps = [];

    // ২. লুপের ভেতরে কোনো await নেই (High Speed Processing)
    rows.forEach((row, index) => {
      const operatorId = row.operatorId?.trim().toUpperCase();
      if (!operatorId) return;

      // ডুপ্লিকেট হলে স্কিপ করবে
      if (existingOperatorIds.has(operatorId)) return;

      // SMV Type নির্ধারণ
      let smvType = '';
      if (row.smv) {
        if (row.breakdownProcess?.trim()) smvType = 'breakdown';
        else if (row.process?.trim()) smvType = 'process';
      }

      // প্রোডাকশন ডাটা তৈরি
      dailyProductions.push({
        date,
        operator: {
          operatorId,
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
        buyerId: new mongoose.Types.ObjectId(productionInfo.buyerId),
        buyerName: productionInfo.buyerName || '',
        styleId: new mongoose.Types.ObjectId(productionInfo.styleId),
        styleName: productionInfo.styleName || '',
        supervisorId: new mongoose.Types.ObjectId(productionInfo.supervisorId),
        floorId: new mongoose.Types.ObjectId(productionInfo.floorId),
        lineId: new mongoose.Types.ObjectId(productionInfo.lineId),
        workAs: row.workAs || 'operator',
        smv: row.smv?.toString() || '',
        smvType,
        rowNo: index + 1
      });

      // মেশিন আপডেট প্রিপারেশন (Bulk Write)
      if (row.machineUniqueId?.trim()) {
        machineBulkOps.push({
          updateOne: {
            filter: { uniqueId: row.machineUniqueId },
            update: {
              $set: {
                lastLocation: {
                  date,
                  line: new mongoose.Types.ObjectId(productionInfo.lineId),
                  floor: new mongoose.Types.ObjectId(productionInfo.floorId),
                  supervisor: productionInfo.supervisor,
                  updatedAt: new Date()
                }
              }
            }
          }
        });
      }

      // অপারেটর আপডেট প্রিপারেশন (Bulk Write)
      // row.operatorMongoId চেক করা হয়েছে যাতে ক্রাশ না করে
      if (operatorId) {
        const updateData = {
          'lastScan.date': date,
          'lastScan.floor': new mongoose.Types.ObjectId(productionInfo.floorId),
          'lastScan.line': new mongoose.Types.ObjectId(productionInfo.lineId),
          'lastScan.process': row.process || '',
          'lastScan.breakdownProcess': row.breakdownProcess || ''
        };

        // যদি machineMongoId থাকে তবেই সেটি এড হবে
        if (row.machineMongoId && mongoose.Types.ObjectId.isValid(row.machineMongoId)) {
          updateData['lastScan.machine'] = new mongoose.Types.ObjectId(row.machineMongoId);
        }

        operatorBulkOps.push({
          updateOne: {
            filter: { operatorId: operatorId },
            update: { $set: updateData }
          }
        });
      }
    });

    if (dailyProductions.length === 0) {
      return Response.json({ success: false, message: 'All rows already exist or invalid' }, { status: 400 });
    }

    // ৩. ডাটাবেসে একবারে সব ডাটা পাঠানো (Bulk Execution)
    const [savedResults] = await Promise.all([
      DailyProduction.insertMany(dailyProductions),
      machineBulkOps.length > 0 ? Machine.bulkWrite(machineBulkOps) : Promise.resolve(),
      operatorBulkOps.length > 0 ? Operator.bulkWrite(operatorBulkOps) : Promise.resolve()
    ]);

    return Response.json({
      success: true,
      message: 'Successfully processed all records',
      count: dailyProductions.length
    }, { status: 201 });

  } catch (error) {
    console.error('🔥 CRITICAL ERROR:', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}