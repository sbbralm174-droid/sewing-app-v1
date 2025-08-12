const mongoose = require('mongoose');

const MachineSchema = new mongoose.Schema({
  uniqueId: {
    type: String,
    required: true,
    unique: true
  },
  machineType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MachineType',
    required: true
  },
  lineNumber: {
    type: String,
    required: true
  },
  floor: {
    type: String,
    required: true
  },
  currentStatus: {
    type: String,
    default: 'idle'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.Machine || mongoose.model('Machine', MachineSchema);