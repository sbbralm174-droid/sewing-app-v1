import mongoose from 'mongoose';

const lineSchema = new mongoose.Schema({
  lineNumber: { type: String, required: true, unique: true },
  floorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Floor', required: true },
  target: Number
});

export default mongoose.models.Line || mongoose.model('Line', lineSchema);