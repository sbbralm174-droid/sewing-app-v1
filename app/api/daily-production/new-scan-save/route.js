import { connectDB } from '@/lib/db';
import DailyProduction from '@/models/DailyProduction';
import Machine from '@/models/Machine';
import Operator from '@/models/Operator';
import mongoose from 'mongoose';

export async function POST(request) {
  console.log('\n================ API HIT ================');

  try {
    await connectDB();
    console.log('✅ DB Connected');

    const data = await request.json();
    const { productionInfo, rows } = data;

    console.log('📦 ProductionInfo:', productionInfo);
    console.log('📦 Rows length:', rows?.length);

    if (!productionInfo || !rows || rows.length === 0) {
      console.log('❌ Missing productionInfo or rows');
      return Response.json(
        { success: false, message: 'Invalid payload' },
        { status: 400 }
      );
    }

    // -------------------------
    // Required field validation
    // -------------------------
    const requiredFields = [
      'supervisor',
      'floor',
      'line',
      'buyerId',
      'styleId',
      'supervisorId',
      'floorId',
      'lineId',
      'jobNo',
      'date'
    ];

    const missingFields = requiredFields.filter(f => !productionInfo[f]);
    if (missingFields.length > 0) {
      console.log('❌ Missing fields:', missingFields);
      return Response.json(
        { success: false, message: `Missing fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // -------------------------
    // ObjectId conversion
    // -------------------------
    const buyerId = new mongoose.Types.ObjectId(productionInfo.buyerId);
    const styleId = new mongoose.Types.ObjectId(productionInfo.styleId);
    const supervisorId = new mongoose.Types.ObjectId(productionInfo.supervisorId);
    const floorId = new mongoose.Types.ObjectId(productionInfo.floorId);
    const lineId = new mongoose.Types.ObjectId(productionInfo.lineId);
    const date = new Date(productionInfo.date);

    const dailyProductions = [];
    const machineUpdates = [];
    const operatorLastScanUpdates = [];

    // =========================
    // MAIN ROW LOOP
    // =========================
    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      console.log(`\n➡️ Processing row ${index + 1}`, row);

      if (!row.operatorId) {
        console.log('⚠️ operatorId missing, skipping row');
        continue;
      }

      const operatorId = row.operatorId.trim().toUpperCase();

      // -------------------------
      // Duplicate check
      // -------------------------
      const exists = await DailyProduction.findOne({
        date,
        'operator.operatorId': operatorId
      });

      if (exists) {
        console.log(`⚠️ Duplicate DailyProduction for ${operatorId}`);
        continue;
      }

      // -------------------------
      // SMV Type
      // -------------------------
      let smvType = '';
      if (row.smv) {
        if (row.breakdownProcess?.trim()) smvType = 'breakdown';
        else if (row.process?.trim()) smvType = 'process';
      }

      // -------------------------
      // DailyProduction push
      // -------------------------
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

      // -------------------------
      // Machine lastLocation update
      // -------------------------
      if (row.machineUniqueId?.trim()) {
        console.log('🛠 Preparing machine update:', row.machineUniqueId);
        machineUpdates.push({
          uniqueId: row.machineUniqueId,
          lastLocation: {
            date,
            line: lineId,
            floor: floorId,
            supervisor: productionInfo.supervisor,
            updatedAt: new Date()
          }
        });
      }

      // -------------------------
      // Operator lastScan update
      // -------------------------
      
        console.log('🧠 Preparing operator lastScan for:', operatorId);
        operatorLastScanUpdates.push({
          operatorId,
          lastScan: {
            date,
            machine: new mongoose.Types.ObjectId(row.machineMongoId),
            floor: floorId,
            line: lineId,
            process: row.process || '',
            breakdownProcess: row.breakdownProcess || ''
          }
        });
      
        
    }

    console.log('\n📊 SUMMARY');
    console.log('DailyProductions:', dailyProductions.length);
    console.log('MachineUpdates:', machineUpdates.length);
    console.log('OperatorLastScans:', operatorLastScanUpdates.length);

    if (dailyProductions.length === 0) {
      return Response.json(
        { success: false, message: 'No new production data' },
        { status: 400 }
      );
    }

    // =========================
    // SAVE DAILY PRODUCTION
    // =========================
    const savedProductions = await DailyProduction.insertMany(dailyProductions);
    console.log('✅ DailyProduction saved:', savedProductions.length);

    // =========================
    // MACHINE UPDATE
    // =========================
    await Promise.allSettled(
      machineUpdates.map(update =>
        Machine.findOneAndUpdate(
          { uniqueId: update.uniqueId },
          { $set: { lastLocation: update.lastLocation } }
        )
      )
    );
    console.log('✅ Machine updates done');

    // =========================
    // OPERATOR LAST SCAN UPDATE
    // =========================
    const operatorResults = await Promise.allSettled(
      operatorLastScanUpdates.map(op => {
        console.log('🔄 Updating lastScan for operatorId:', op.operatorId);
        return Operator.findOneAndUpdate(
          { operatorId: op.operatorId },
          { $set: { lastScan: op.lastScan } },
          { new: true }
        );
      })
    );

    console.log('📊 Operator update results:', operatorResults);

    return Response.json(
      {
        success: true,
        message: 'Production saved, machine & operator lastScan updated',
        saved: savedProductions.length,
        operatorsUpdated: operatorResults.length
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('🔥 API ERROR:', error);
    return Response.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
