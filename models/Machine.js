// models/Machine.js
const mongoose = require('mongoose');

// ✅ Last Location Schema (এটি একটি স্বতন্ত্র স্কিমা হতে হবে)
const LastLocationSchema = new mongoose.Schema({
    date: { type: Date },
    line: { type: String },
    supervisor: { type: String },
    floor: { type: String },
    updatedAt: { type: Date, default: Date.now }
}, { _id: false }); // সাব-ডকুমেন্টের _id প্রয়োজন নেই

// Part configuration schema (যেমন আছে তেমনই রাখুন)
const PartConfigSchema = new mongoose.Schema({
// ... (পার্ট কনফিগ স্কিমা) ...
}, { _id: false });

// ✅ Machine schema
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
    currentStatus: {
        type: String,
        default: 'idle'
    },
    parts: {
        type: [PartConfigSchema],
        default: []
    },
    // ✅ এখানে LastLocationSchema কে Type হিসাবে সঠিকভাবে ব্যবহার করা হচ্ছে
    lastLocation: {
        type: LastLocationSchema, 
        default: () => ({ 
             
             line: 'N/A',
             supervisor: 'N/A',
             floor: 'N/A',
             updatedAt: new Date('2000-01-01T00:00:00.000Z')
        })
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save hook to prevent duplicate part IDs
MachineSchema.pre('save', function(next) {
  if (this.parts && this.parts.length > 0) {
    const partIds = this.parts.map(part => part.uniquePartId);
    const duplicateIds = partIds.filter((id, index) => partIds.indexOf(id) !== index);
    
    if (duplicateIds.length > 0) {
      return next(new Error(`Duplicate uniquePartId found: ${duplicateIds.join(', ')}`));
    }
  }
  next();
});


module.exports = mongoose.models.Machine || mongoose.model('Machine', MachineSchema);