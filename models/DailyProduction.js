const mongoose = require('mongoose');


const HourlyProductionSchema = new mongoose.Schema({
  hour: { type: String, required: true },
  productionCount: { type: Number, required: true },
  // Add any other fields relevant to a single hourly entry
});

const DailyProductionSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  
  // operator ফিল্ডটি পরিবর্তন করা হয়েছে
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
  machineType: { type: String, required: true }, 
  uniqueMachine: { type: String, required: true }, 
  target: { type: Number, required: true },
  workAs: { type: String, enum: ['operator', 'helper'], required: true },
  hourlyProduction: [HourlyProductionSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.DailyProduction || mongoose.model('DailyProduction', DailyProductionSchema);