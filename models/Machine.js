const mongoose = require('mongoose');

// ✅ Last Location Schema
const LastLocationSchema = new mongoose.Schema({
  date: { type: Date },
  line: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'FloorLine'
  },
  supervisor: { type: String },
  floor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Floor'
  },
  updatedAt: { type: Date, default: Date.now }
}, { _id: false });

// ✅ Part configuration schema
const PartConfigSchema = new mongoose.Schema({
  partName: { type: String, required: true, trim: true },
  uniquePartId: { type: String, required: true },
  nextServiceDate: { type: Date, required: true }
}, { _id: false });

// ✅ Machine schema
const MachineSchema = new mongoose.Schema({
  uniqueId: {
    type: String,
    required: true,
    unique: true,
    index: true // 🚀 সার্চ ফাস্ট করার জন্য ইনডেক্স
  },
  brandName: { type: String, trim: true, required: true },
  companyUniqueNumber: { type: String, unique: true, trim: true },
  installationDate: { type: Date },
  price: { type: Number, min: 0 },
  model: { type: String, trim: true },
  origin: { type: String, trim: true },
  warrantyYears: { type: Number },
  nextServiceDate: { type: Date },
  
  machineType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MachineType',
    required: true,
    index: true // 🚀 $lookup ফাস্ট করার জন্য ইনডেক্স
  },

  currentStatus: {
    type: String,
    default: 'idle',
    enum: ['idle', 'running', 'maintenance', 'inactive'],
    index: true // 🚀 স্ট্যাটাস দিয়ে ফিল্টার করার জন্য
  },

  parts: {
    type: [PartConfigSchema],
    default: []
  },

  lastLocation: {
    type: LastLocationSchema,
    // default value-তে 'N/A' দেয়া যাবে না কারণ এগুলো ObjectId টাইপ। 
    // যদি ডাটা না থাকে তবে null রাখা ভালো।
  },

  createdAt: { type: Date, default: Date.now }
});

// 🔥 Compound Index: লোকেশন ভিত্তিক সার্চ ফাস্ট করার জন্য
MachineSchema.index({ "lastLocation.floor": 1, "lastLocation.line": 1 });

// ✅ Pre-save hook
MachineSchema.pre('save', function (next) {
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



// 01735980944

//01735944844


//  018883040442


