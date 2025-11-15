// models/Defect.js
const mongoose = require('mongoose');

const DefectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, unique: true },
  description: { type: String },
  severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  category: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Defect || mongoose.model('Defect', DefectSchema);