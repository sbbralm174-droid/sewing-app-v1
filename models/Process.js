const mongoose = require('mongoose');

const ProcessSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  code: {
    type: String,
    unique: true,
  },
  smv: {
    type: Number,
    required: true,
  },
  smvVersion: {
    type: Number,
    default: 1,
  },
  previousSmv: {
    type: Number,
  },
  previousSmvVersion: {
    type: Number,
  },
  smvHistory: [{
    smv: Number,
    smvVersion: Number,
    updatedAt: {
      type: Date,
      default: Date.now
    },
    comment: String // Added comment for history tracking
  }],
  comments: {
    type: String,
    default: '',
  },
  processStatus: {
    type: String,
    enum: ['Basic', 'Critical', 'Semi-Critical'],
    default: 'Critical',
  },
  isAssessment: {
    type: Boolean,
    default: false, // নতুন field যোগ করা হয়েছে
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

// unique case-insensitive index
ProcessSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

// Pre-save middleware to handle SMV version tracking
ProcessSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  if (this.isModified('smv') && !this.isNew) {
    // Save current SMV to history before updating
    this.smvHistory.push({
      smv: this.smv,
      smvVersion: this.smvVersion,
      updatedAt: new Date(),
      comment: `SMV updated to ${this.smv} (v${this.smvVersion})`
    });
    
    // Keep only the last 10 history entries
    if (this.smvHistory.length > 10) {
      this.smvHistory = this.smvHistory.slice(-10);
    }
    
    // Set previous SMV values
    this.previousSmv = this.smv;
    this.previousSmvVersion = this.smvVersion;
    
    // Increment SMV version
    this.smvVersion += 1;
  }
  next();
});

// Static method to update SMV with proper tracking
ProcessSchema.statics.updateSMV = async function(processId, newSMV, comment = '') {
  const process = await this.findById(processId);
  if (!process) {
    throw new Error('Process not found');
  }

  // Store current values before update
  const currentSMV = process.smv;
  const currentVersion = process.smvVersion;

  // Update the process
  const updatedProcess = await this.findByIdAndUpdate(
    processId,
    { 
      smv: newSMV,
      previousSmv: currentSMV,
      previousSmvVersion: currentVersion,
      $push: {
        smvHistory: {
          smv: currentSMV,
          smvVersion: currentVersion,
          updatedAt: new Date(),
          comment: comment || `SMV changed from ${currentSMV} to ${newSMV}`
        }
      }
    },
    { new: true, runValidators: true }
  );

  return updatedProcess;
};

module.exports = mongoose.models.Process || mongoose.model('Process', ProcessSchema);