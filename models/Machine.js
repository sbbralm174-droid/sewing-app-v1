const mongoose = require('mongoose');

// ✅ Last Location Schema
const LastLocationSchema = new mongoose.Schema({
  date: { type: Date },
  line: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'FloorLine' // FloorLine মডেলের সাথে কানেক্ট
  },
  supervisor: { type: String },
  floor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Floor' // Floor মডেলের সাথে কানেক্ট
  },
  updatedAt: { type: Date, default: Date.now }
}, { _id: false });

// ✅ Part configuration schema
const PartConfigSchema = new mongoose.Schema({
  partName: {
    type: String,
    required: true,
    trim: true
  },
  uniquePartId: {
    type: String,
    required: true
  },
  nextServiceDate: {
    type: Date,
    required: true
  }
}, { _id: false });

// ✅ Machine schema
const MachineSchema = new mongoose.Schema({
  uniqueId: {
    type: String,
    required: true,
    unique: true
  },

  // 🔹 NEW FIELDS
  brandName: {
    type: String,
    trim: true,
    required: true
  },

  companyUniqueNumber: {
    type: String,
    unique: true,
    trim: true
  },

  installationDate: {
    type: Date,
  },

  price: {
    type: Number,
    min: 0
  },

  model: {
    type: String,
    trim: true
  },
  origin: {
    type: String,
    trim: true
  },

  warrantyYears: {
    type: Number
  },

  nextServiceDate: {
    type: Date
  },

  
  machineType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MachineType',
    required: true
  },

  currentStatus: {
    type: String,
    default: 'idle',
    enum: ['idle', 'running', 'maintenance', 'inactive']
  },

  parts: {
    type: [PartConfigSchema],
    default: []
  },

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

// ✅ Pre-save hook to prevent duplicate part IDs
MachineSchema.pre('save', function (next) {
  if (this.parts && this.parts.length > 0) {
    const partIds = this.parts.map(part => part.uniquePartId);
    const duplicateIds = partIds.filter(
      (id, index) => partIds.indexOf(id) !== index
    );

    if (duplicateIds.length > 0) {
      return next(
        new Error(`Duplicate uniquePartId found: ${duplicateIds.join(', ')}`)
      );
    }
  }
  next();
});

module.exports =
  mongoose.models.Machine || mongoose.model('Machine', MachineSchema);
