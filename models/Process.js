const mongoose = require('mongoose');

const ProcessSchema = new mongoose.Schema({
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

module.exports = mongoose.models.Process || mongoose.model('Process', ProcessSchema);