// models/iepInterviewDownAdmin.js

import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  nid: {
    type: String,
    required: true
  },
  picture: String,
  birthCertificate: String,
  stepCompleted: {
    type: Number,
    default: 1
  },
  candidateId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'passed', 'failed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

export default mongoose.models.Candidate || mongoose.model('Candidate', candidateSchema);