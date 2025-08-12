import mongoose from 'mongoose';

const hourlyReportSchema = new mongoose.Schema({
  floor: {
    type: String,
    required: [true, 'Floor is required'],
  },
  hour: {
    type: String,
    required: [true, 'Hour is required'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Avoide re-creating the model if it already exists
const HourlyReport = mongoose.models.HourlyReport || mongoose.model('HourlyReport', hourlyReportSchema);

export default HourlyReport;
