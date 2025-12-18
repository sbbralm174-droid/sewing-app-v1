import mongoose from 'mongoose';

const ExcelDataSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  data: [
    {
      sno: String,
      process: String,
      mcTypeHp: String,
      smv: Number,
      capacity: Number,
      manPower: Number,
      balanceCapacity: Number,
      supportOperation: String,
      adjustTarget: Number,
      remarks: String
    }
  ],
  totalRecords: {
    type: Number,
    required: true,
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
ExcelDataSchema.index({ fileName: 1 });
ExcelDataSchema.index({ 'uploadedAt': -1 });

export const Breakdown = mongoose.models.Breakdown || mongoose.model('Breakdown', ExcelDataSchema);