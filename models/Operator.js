const mongoose = require('mongoose');

const OperatorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  operatorId: {
    type: String,
    required: true,
    unique: true
  },
  designation: {
    type: String,
    required: true
  },
  allowedProcesses: [{
    type: String,
    required: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.Operator || mongoose.model('Operator', OperatorSchema);