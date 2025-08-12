const mongoose = require('mongoose');

const FloorLineSchema = new mongoose.Schema({
  floor: {
    type: mongoose.Schema.Types.ObjectId, // Changed to ObjectId
    ref: 'Floor', // Added reference to the 'Floor' model
    required: true
  },
  lineNumber: {
    type: String,
    required: true
  },
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supervisor'
  },
  operators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Operator'
  }],
  machines: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine'
  }],
  currentProcess: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.FloorLine || mongoose.model('FloorLine', FloorLineSchema);