// models/Candidate.js

import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema({
  candidateId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
  },
  nid: {
    type: String
  },
  birthCertificate: {
    type: String
  },
  picture: {
    type: String
  },
  stepCompleted: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['passed', 'failed'],
    
  },
  result: {
    type: String,
    enum: ['PASSED', 'FAILED'],
  },
  failureReason:{
    type: String
  },
  interviewData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

export default mongoose.models.Candidate || mongoose.model('Candidate', candidateSchema);