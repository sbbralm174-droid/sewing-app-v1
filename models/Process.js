const mongoose = require('mongoose');

const ProcessSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// unique case-insensitive index
ProcessSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

module.exports =
  mongoose.models.Process || mongoose.model('Process', ProcessSchema);
