import mongoose from 'mongoose';

const styleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Buyer',
    required: true
  },
  buyerName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Compound index for unique style name per buyer
styleSchema.index({ name: 1, buyerId: 1 }, { unique: true });

export default mongoose.models.Style || mongoose.model('Style', styleSchema);