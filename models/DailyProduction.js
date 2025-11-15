const mongoose = require('mongoose');

const HourlyProductionSchema = new mongoose.Schema({
  hour: { type: String, required: true },
  productionCount: { type: Number, required: true },
  defects: [{
    defectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Defect' },
    name: { type: String },
    code: { type: String },
    count: { type: Number, default: 0 } // ✅ Defect count field যোগ করুন
  }]
});

const DailyProductionSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  operator: { 
    type: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Operator' },
      operatorId: { type: String },
      name: { type: String },
      designation: { type: String },
    },
    required: true 
  },
  supervisor: { type: String, required: true },
  floor: { type: String, required: true },
  line: { type: String, required: true },
  process: { type: String, required: true },
  status: { type: String, enum: ['present', 'absent'], required: true },
  machineType: { type: String },
  uniqueMachine: { type: String },
  target: { type: Number },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Buyer', required: true },
  styleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Style', required: true },
  workAs: { type: String, enum: ['operator', 'helper'], required: true },
  hourlyProduction: [HourlyProductionSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.DailyProduction || mongoose.model('DailyProduction', DailyProductionSchema);