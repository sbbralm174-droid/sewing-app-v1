import mongoose from 'mongoose';

const resignHistorySchema = new mongoose.Schema({
  operatorId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  nid: {
    type: String,
    required: true
  },
  designation: {
    type: String,
    required: true
  },
  grade: {
    type: String,
    required: true
  },
  joiningDate: {
    type: Date,
    required: true
  },
  resignationDate: {
    type: Date,
    default: Date.now
  },
  department: {
    type: String,
    required: true
  },
  approvedBy: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  performanceMark: {
    type: String,
    enum: ['good', 'bad'],
    required: true
  },
  remarks: {
    type: String,
    default: ''
  },
  picture: {
    type: String,
    default: ''
  },
  allowedProcesses: {
    type: Map,
    of: Number,
    default: {}
  },
  previousProcessScores: {
    type: Array,
    default: []
  },
  occurrenceReports: {
    type: Array,
    default: []
  }
}, {
  timestamps: true
});

export default mongoose.models.ResignHistory || mongoose.model('ResignHistory', resignHistorySchema);