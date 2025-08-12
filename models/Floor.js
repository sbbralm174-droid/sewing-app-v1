const mongoose = require('mongoose');

const floorSchema = new mongoose.Schema({
  floorName: {
    type: String,
    required: [true, 'Floor name is required'],
    unique: true,
  },
  available: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.models.Floor || mongoose.model('Floor', floorSchema);