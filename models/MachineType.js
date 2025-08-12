const mongoose = require('mongoose');

const MachineTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.MachineType || mongoose.model('MachineType', MachineTypeSchema);