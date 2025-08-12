const mongoose = require('mongoose');

const SupervisorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  supervisorId: {
    type: String,
    required: true,
    unique: true
  },
  designation: {
    type: String,
    required: true
  },
  assignedLines: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.Supervisor || mongoose.model('Supervisor', SupervisorSchema);