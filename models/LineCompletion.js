import mongoose from 'mongoose';

const LineCompletionSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true, // Add an index for faster lookups
  },
  floor: {
    type: String,
    required: true,
  },
  line: {
    type: String,
    required: true,
    index: true, // Add an index
  },
  completedAt: {
    type: Date,
    default: Date.now,
  },
  supervisor: {
    type: String, // Or mongoose.Schema.Types.ObjectId if you have a Supervisor model
  },
});

// Create a unique index to prevent duplicate entries for the same line on the same day
LineCompletionSchema.index({ date: 1, line: 1 }, { unique: true });

export default mongoose.models.LineCompletion || mongoose.model('LineCompletion', LineCompletionSchema);