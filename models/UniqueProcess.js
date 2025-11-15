import mongoose from 'mongoose';

const ProcessSchema = new mongoose.Schema({
  processName: {
    type: String,
    required: true,
    trim: true
  },
  buyerName: {
    type: String,
    required: true,
    trim: true
  },
  uniqueId: {
    type: String,
    required: true,
    unique: true
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Buyer',
    required: true
  }
}, {
  timestamps: true
});

// Index for better performance
ProcessSchema.index({ uniqueId: 1 });
ProcessSchema.index({ processName: 1 });
ProcessSchema.index({ buyerId: 1 });

export default mongoose.models.uniqueProcess || mongoose.model('uniqueProcess', ProcessSchema);