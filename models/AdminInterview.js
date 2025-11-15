// models/AdminInterview.js


const mongoose = require('mongoose');
// ------------------------------------------

// ------------------------------------------
const AdminInterviewSchema = new mongoose.Schema({
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "VivaInterview", // প্রথম ধাপের Viva interview এর রেফারেন্স
    required: true
  },
  salary: {
    type: Number,
    required: [true, 'Salary must be specified']
  },
  joiningDate: {
    type: Date,
  },
  designation: {
    type: String,
  },
  result: {
    type: String,
    enum: ["PASSED", "FAILED", "PENDING"],
    default: "PENDING"
  },
  remarks: {
    type: String
  },
  canceledReason: {
    type: String // যদি admin পর্যায়ে বাতিল হয়
  },
  promotedToOperator: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.models.AdminInterview || mongoose.model('AdminInterview', AdminInterviewSchema);
