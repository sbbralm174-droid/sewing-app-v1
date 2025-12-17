import mongoose from 'mongoose';

const BreakdownSchema = new mongoose.Schema(
  {
    sno: {
      type: String,
      required: true
    },
    process: {
      type: String,
      required: true
    },
    mcTypeHp: {
      type: String,
      required: true
    },
    smv: {
      type: Number,
      required: true
    },
    capacity: {
      type: Number,
      required: true
    },
    manPower: {
      type: Number,
      required: true
    },
    balanceCapacity: {
      type: Number,
      required: true
    },
    supportOperation: {
      type: String
    },
    adjustTarget: {
      type: Number,
      required: true
    },
    remarks: {
      type: String
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    fileName: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Check if model already exists to prevent OverwriteModelError
const Breakdown = mongoose.models.Breakdown || mongoose.model('Breakdown', BreakdownSchema);

export default Breakdown;