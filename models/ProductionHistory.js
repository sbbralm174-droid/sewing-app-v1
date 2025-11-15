const mongoose = require('mongoose');

const HourlyProductionSchema = new mongoose.Schema({
  hour: { type: String },
  productionCount: { type: Number },
});

const ProductionHistorySchema = new mongoose.Schema({
  // মূল ডকুমেন্টের রেফারেন্স
  dailyProductionRef: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'DailyProduction', 
    required: true 
  },

  // তারিখ অনুযায়ী
  date: { type: Date, required: true },

  // অপারেটর তথ্য (snapshot)
  operator: { 
    type: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Operator' },
      operatorId: { type: String },
      name: { type: String },
      designation: { type: String },
    },
    required: true,
  },

  // ✅ DailyProduction এর পুরো snapshot
  supervisor: { type: String },
  floor: { type: String },
  line: { type: String },
  process: { type: String },
  status: { type: String, enum: ['present', 'absent'] },
  machineType: { type: String },
  uniqueMachine: { type: String },
  target: { type: Number },
  workAs: { type: String, enum: ['operator', 'helper'] },
  hourlyProduction: [HourlyProductionSchema],

  // কে আপডেট করেছে
  updatedBy: { type: String, default: 'system' },

  // কখন আপডেট হয়েছে
  updatedAt: { type: Date, default: Date.now },
});

module.exports =
  mongoose.models.ProductionHistory ||
  mongoose.model('ProductionHistory', ProductionHistorySchema);
