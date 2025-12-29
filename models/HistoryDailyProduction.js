// models/HistoryDailyProduction.js
const mongoose = require('mongoose');

const HistoryHourlyProductionSchema = new mongoose.Schema({
  hour: { type: String, required: true },
  productionCount: { type: Number, required: true, min: 0, default: 0 },
  defects: [{
    defectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Defect' },
    name: { type: String },
    code: { type: String },
    count: { type: Number, default: 0, min: 0 }
  }],
  createdAt: { type: Date, default: Date.now }
});

const HistoryDailyProductionSchema = new mongoose.Schema({
  // মূল ডকুমেন্টের সকল fields
  originalId: { type: mongoose.Schema.Types.ObjectId, required: true },
  date: { type: Date, required: true },
  operator: { 
    type: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Operator' },
      operatorId: { type: String, required: true },
      name: { type: String, required: true },
      designation: { type: String, default: "Operator" },
    },
    required: true 
  },
  supervisor: { type: String, required: true },
  floor: { type: String, required: true },
  line: { type: String, required: true },
  process: { type: String, required: false },
  jobNo:{ type: String },
  breakdownProcessTitle:{type: String, default: ""},
  breakdownProcess: { type: String, default: "" },
  status: { 
    type: String, 
    enum: ['present', 'absent', 'idle'], 
    required: true,
    default: 'present'
  },
  machineType: { type: String },
  uniqueMachine: { type: String },
  target: { type: Number, min: 0 },
  hourlyTarget:{ type: Number, min: 0 },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Buyer', required: true },
  styleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Style', required: true },
  workAs: { type: String, enum: ['operator', 'helper'], required: true },
  smv: { type: String, default: "" },
  smvType: { type: String, enum: ['process', 'breakdown', ''], default: "" },
  rowNo: { type: Number, default: 0 },
  hourlyProduction: { type: [HistoryHourlyProductionSchema], default: [] },
  previousLineWorkingTime: { type: Number, default: 0 },
  
  // Common fields
  supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supervisor' },
  floorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Floor' },
  lineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Line' },
  
  // History specific fields
  action: { type: String, enum: ['line_change'], required: true },
  actionDate: { type: Date, default: Date.now },
  movedToLine: { type: String }, // নতুন লাইন নম্বর
  movedAt: { type: Date, default: Date.now },
  transferredBy: { type: String }, // কে transfer করলো
  
  createdAt: { type: Date, default: Date.now }
});

// Indexing
HistoryDailyProductionSchema.index({ originalId: 1 });
HistoryDailyProductionSchema.index({ "operator.operatorId": 1, date: -1 });
HistoryDailyProductionSchema.index({ actionDate: -1 });

module.exports = mongoose.models.HistoryDailyProduction || mongoose.model('HistoryDailyProduction', HistoryDailyProductionSchema);