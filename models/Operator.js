const mongoose = require('mongoose');

// ------------------------------------------
// Sub-Schema 3: Operator Last Scan
// ------------------------------------------
const OperatorLastScanSchema = new mongoose.Schema({
    date: {
        type: Date,
        default: Date.now
    },
    machine: { type: String },
    floor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Floor',
    },
    line: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FloorLine',
    },
    process: {
        type: String,
        required: true,
        trim: true
    },
    breakdownProcess: {
        type: String,
        trim: true
    }
}, {
    _id: false
});

// ------------------------------------------
// Sub-Schema 1: Occurrence Report
// ------------------------------------------
const OccurrenceReportSchema = new mongoose.Schema({
    date: { 
        type: Date, 
        required: [true, 'Report date is required'] 
    },
    type: { 
        type: String, 
        required: [true, 'Report type is required'] 
    },
    details: { 
        type: String, 
        required: [true, 'Details are required'] 
    },
    reportedBy: { 
        type: String, 
        required: [true, 'Reporter name is required'] 
    },
}, { 
    _id: true, 
    timestamps: true
});

// ------------------------------------------
// Sub-Schema 2: Resignation/Separation History
// ------------------------------------------
const ResignationSchema = new mongoose.Schema({
    date: { 
        type: Date, 
        required: [true, 'Resignation date is required'] 
    },
    reason: { 
        type: String, 
        required: [true, 'Resignation reason is required'] 
    },
    approvedBy: { 
        type: String 
    },
    department: { 
        type: String 
    },
    remarks: { 
        type: String 
    },
}, { 
    _id: true, 
    timestamps: true 
});

// ------------------------------------------
// Main Operator Schema
// ------------------------------------------
const OperatorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Operator name is required'],
        trim: true
    },
    operatorId: {
        type: String,
        required: [true, 'Operator ID is required'],
        unique: true,
        trim: true,
        uppercase: true
    },
    employeeId: {
        type: String,
        unique: true,
        trim: true,
        uppercase: true
    },
    joiningDate: {
        type: Date,
        required: [true, 'Joining date is required']
    },
    nid: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    birthCertificate: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
     picture: {
      type: String,
      
    },
    videos: [
      {
        name: { type: String, },
        url: { type: String,},
        originalName: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    occurrenceReports: {
        type: [OccurrenceReportSchema],
        default: [],
    },

    lastScan: {
        type: OperatorLastScanSchema,
        default: null
    },
    
    resignationHistory: { 
        type: [ResignationSchema],
        default: []
    },

    designation: {
        type: String,
        required: [true, 'Designation is required'],
        trim: true
    },
    grade: {
        type: String,
        enum: ["A", "A+", "A++", "B+", "B++", "B", "C", "D", "E", "F"],
        required: [true, 'Grade is required']
    },

    // Updated allowedProcesses as Map
    allowedProcesses: {
        type: Map,
        of: Number,  // value = max score
        default: {}, // empty map by default
        required: true
    },
    previousProcessScores: [
    {
      processName: { type: String, required: true },
      previousScore: { type: Number, required: true },
      line: { type: String },
      date: { type: Date, default: Date.now }
    }
  ]

}, { 
    timestamps: true
});

// ------------------------------------------
// Custom Validation (NID or Birth Certificate)
// ------------------------------------------
OperatorSchema.pre('validate', function(next) {
    if (!this.nid && !this.birthCertificate) {
        this.invalidate('nid', 'Either NID or Birth Certificate must be provided', 'required');
    }
    next();
});

// ------------------------------------------
// Export Model
// ------------------------------------------
module.exports = mongoose.models.Operator || mongoose.model('Operator', OperatorSchema);