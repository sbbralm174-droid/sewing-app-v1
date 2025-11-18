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
    }
  }],
  comments: {
    type: String,
    default: '',
  },
  processStatus: {
    type: String,
    enum: ['active', 'inactive', 'draft'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// unique case-insensitive index
ProcessSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

// Pre-save middleware to handle SMV version tracking
ProcessSchema.pre('save', function(next) {
  // Check if smv has been modified AND it's not a new document being created
  if (this.isModified('smv') && !this.isNew) {
    // Determine the SMV value that was just before the change (the original value)
    const oldSmv = this._originalSmv !== undefined ? this._originalSmv : this.smv;
    const oldSmvVersion = this._originalSmvVersion !== undefined ? this._originalSmvVersion : this.smvVersion;

    // Check if the actual numeric value of smv has changed
    // This handles cases where .save() is called but smv value hasn't numerically changed
    // Use .get('smv') to get the current value, and ._originalSmv for the value before modification tracking
    if (this.smv !== this.get('smv')) {
      // The current values in the document are the *new* values (after modification)
      // The values we want to save in history and previous are the *old* values

      // 1. Save the OLD values to history
      this.smvHistory.push({
        smv: oldSmv,
        smvVersion: oldSmvVersion,
        updatedAt: new Date()
      });

      // 2. Keep only the last 10 history entries
      // The new entry is at the end, so we slice the beginning (oldest) entries
      if (this.smvHistory.length > 10) {
        this.smvHistory = this.smvHistory.slice(-10);
      }

      // 3. Set previous SMV values to the OLD values
      this.previousSmv = oldSmv;
      this.previousSmvVersion = oldSmvVersion;

      // 4. Increment SMV version (the new version will be the current version + 1)
      this.smvVersion = oldSmvVersion + 1;
    }
  } else if (this.isNew) {
    // If it's a new document, initialize history with the initial SMV
    this.smvHistory.push({
        smv: this.smv,
        smvVersion: this.smvVersion,
        updatedAt: new Date()
    });
    this.previousSmv = null; // null for the very first entry
    this.previousSmvVersion = null; // null for the very first entry
  }
  next();
});

module.exports = mongoose.models.Process || mongoose.model('Process', ProcessSchema);