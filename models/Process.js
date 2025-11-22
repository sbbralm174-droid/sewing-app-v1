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
    comment: String
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
    default: false,
  },
  subProcess: {
    type: String,
  },
  condition: {
    type: String,
    default: '',
  },
  workAid: {
    type: String,
    default: '',
  },
  machineType: {
    type: String,
    enum: [
      'Over Lock',
      'Flat Lock', 
      'SNLS/DNLS',
      'Kansai',
      'F/Sleamer',
      'FOA',
      'BH',
      'BS',
      'Eyelet',
      'BTK'
    ],
    default: 'Over Lock'
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
    this.smvHistory.push({
      smv: this.smv,
      smvVersion: this.smvVersion,
      updatedAt: new Date(),
      comment: `SMV updated to ${this.smv} (v${this.smvVersion})`
    });
    
    if (this.smvHistory.length > 10) {
      this.smvHistory = this.smvHistory.slice(-10);
    }
    
    this.previousSmv = this.smv;
    this.previousSmvVersion = this.smvVersion;
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

  const currentSMV = process.smv;
  const currentVersion = process.smvVersion;

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