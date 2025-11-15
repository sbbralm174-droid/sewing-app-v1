const mongoose = require('mongoose');

const OperatorResignHistorySchema = new mongoose.Schema({
    // Operator এর মূল ডেটা
    name: {
        type: String,
        required: true,
        trim: true
    },
    operatorId: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },
    nid: {
        type: String,
        trim: true
    },
    birthCertificate: {
        type: String,
        trim: true
    },
    joiningDate: {
        type: Date,
    },
    designation: {
        type: String,
        trim: true
    },
    grade: {
        type: String,
        enum: ["A", "A+", "A++", "B+", "B++", "B", "C", "D", "E", "F"],
    },
    allowedProcesses: {
        type: [String],
        default: []
    },
    
    // Resignation এর সময়ের ডেটা
    resignationDate: {
        type: Date,
        default: Date.now
    },
    department: {
        type: String,
    },
    approvedBy: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    performanceMark: {
        type: String,
        enum: ["good", "bad"],
        required: true
    },
    remarks: {
        type: String
    },
    
    // Occurrence Reports সংরক্ষণ
    occurrenceReports: {
        type: [{
            date: Date,
            type: String,
            details: String,
            reportedBy: String,
            createdAt: Date,
            updatedAt: Date
        }],
        default: []
    },
    
    // Original resignation history (যদি থাকে)
    originalResignationHistory: {
        type: [{
            date: Date,
            reason: String,
            approvedBy: String,
            department: String,
            remarks: String,
            createdAt: Date,
            updatedAt: Date
        }],
        default: []
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.models.OperatorResignHistory || mongoose.model('OperatorResignHistory', OperatorResignHistorySchema);