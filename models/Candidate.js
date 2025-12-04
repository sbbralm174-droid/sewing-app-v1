import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema({
  // Basic candidate information
  name: {
    type: String,
    required: [true, 'Candidate name is required'],
    trim: true
  },
  nid: {
    type: String,
    trim: true
  },
  picture: {
    type: String,
    default: ''
  },
  birthCertificate: {
    type: String,
    default: ''
  },
  stepCompleted: {
    type: Number,
    default: 1
  },
  candidateId: {
    type: String,
    required: [true, 'Candidate ID is required'],
    unique: true,
    trim: true,
    index: true
  },
  
  // Status and result
  status: {
    type: String,
    enum: ['pending', 'passed', 'failed'],
    default: 'pending'
  },
  result: {
    type: String,
    enum: ['PASSED', 'FAILED'],
    required: [true, 'Result is required']
  },
  
  // Certificate information
  chairmanCertificate: {
    type: Boolean,
    default: false
  },
  educationCertificate: {
    type: Boolean,
    default: false
  },
  
  // Experience with machines
  experienceMachines: {
    SNLS_DNLS: {
      type: Boolean,
      default: false
    },
    OverLock: {
      type: Boolean,
      default: false
    },
    FlatLock: {
      type: Boolean,
      default: false
    }
  },
  
  // Designation preferences
  designation: {
    ASST_OPERATOR: {
      type: Boolean,
      default: false
    },
    OPERATOR: {
      type: Boolean,
      default: false
    }
  },
  
  // Additional information
  otherInfo: {
    type: String,
    default: '',
    trim: true
  },
  failureReason: {
    type: String,
    default: '',
    trim: true
  },
  
  // Complete interview data from step one
  interviewData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
candidateSchema.index({ candidateId: 1 });
candidateSchema.index({ result: 1 });
candidateSchema.index({ createdAt: -1 });

// Virtual for formatted created date
candidateSchema.virtual('formattedCreatedAt').get(function() {
  return this.createdAt.toLocaleDateString('en-BD');
});

// Pre-save middleware to sync status with result
candidateSchema.pre('save', function(next) {
  if (this.result === 'PASSED') {
    this.status = 'passed';
  } else if (this.result === 'FAILED') {
    this.status = 'failed';
  }
  next();
});

// Static method to find by candidateId
candidateSchema.statics.findByCandidateId = function(candidateId) {
  return this.findOne({ candidateId });
};

// Static method to find passed candidates
candidateSchema.statics.findPassed = function() {
  return this.find({ result: 'PASSED' });
};

// Static method to find failed candidates
candidateSchema.statics.findFailed = function() {
  return this.find({ result: 'FAILED' });
};

// Instance method to mark as passed
candidateSchema.methods.markAsPassed = function() {
  this.result = 'PASSED';
  this.status = 'passed';
  return this.save();
};

// Instance method to mark as failed
candidateSchema.methods.markAsFailed = function(reason) {
  this.result = 'FAILED';
  this.status = 'failed';
  this.failureReason = reason || '';
  return this.save();
};

// Check if model already exists to prevent OverwriteModelError
const Candidate = mongoose.models.Candidate || mongoose.model('Candidate', candidateSchema);

export default Candidate;