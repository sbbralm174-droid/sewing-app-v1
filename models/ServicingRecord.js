// models/ServicingRecord.js

const mongoose = require('mongoose');

const ServicingRecordSchema = new mongoose.Schema({
  machine: { // কোন মেশিনের সার্ভিসিং হচ্ছে
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine',
    required: true
  },
  servicedBy: { // কে সার্ভিসিং করলেন
    type: String, 
    default: 'Unknown Technician'
  },
  servicingDate: { // কবে সার্ভিসিং করা হলো
    type: Date,
    default: Date.now
  },
  notes: { // সার্ভিসিং এর নোটস বা বর্ণনা
    type: String
  },
  // ভবিষ্যতে এখানে 'cost', 'partsUsed' ইত্যাদি যোগ করা যেতে পারে
});

module.exports = mongoose.models.ServicingRecord || mongoose.model('ServicingRecord', ServicingRecordSchema);