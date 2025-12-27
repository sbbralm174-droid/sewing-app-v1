const mongoose = require('mongoose');

const HourlyProductionSchema = new mongoose.Schema({
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

const DailyProductionSchema = new mongoose.Schema({
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
  hourlyProduction: { type: [HourlyProductionSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// --- INDEXING STRATEGY ---

// ১. মেইন সার্চ ইনডেক্স: UI-তে যখন ডেট, ফ্লোর এবং লাইন দিয়ে ফিল্টার করবেন
DailyProductionSchema.index({ date: -1, floor: 1, line: 1 });

// ২. সুপারভাইজার এবং প্রসেস ভিত্তিক সার্চের জন্য (রিপোর্টিং সহজ করবে)
DailyProductionSchema.index({ supervisor: 1, process: 1, breakdownProcess: 1 });

// ৩. অপারেটর ভিত্তিক দ্রুত সার্চের জন্য
DailyProductionSchema.index({ "operator.operatorId": 1, date: -1 });


// Update the updatedAt field before saving
DailyProductionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.models.DailyProduction || mongoose.model('DailyProduction', DailyProductionSchema);