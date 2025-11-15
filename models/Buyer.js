import mongoose from 'mongoose';

const buyerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

}, {
  timestamps: true
});

export default mongoose.models.Buyer || mongoose.model('Buyer', buyerSchema);