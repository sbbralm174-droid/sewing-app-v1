import mongoose from 'mongoose';

const { Schema } = mongoose;

const reportSchema = new Schema({
  date: {
    type: String,
    required: true,
  },
  line: {
    type: String,
    required: true,
  },
  floor: {
    type: String,
    default: null,
  },
  supervisor: {
    type: String,
    default: null,
  },
  totalRecords: {
    type: Number,
    required: true,
  },
  allRecords: {
    type: [Object],
    default: [],
  },
  // Change these to store arrays of objects
  matchedProcesses: {
    type: [Object],
    default: [],
  },
  unmatchedProcesses: {
    type: [Object],
    default: [],
  },
  missingProcesses: {
    type: [Object],
    default: [],
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Report = mongoose.models.Report || mongoose.model('Report', reportSchema);

export default Report;
