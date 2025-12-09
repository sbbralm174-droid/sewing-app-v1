// models/Permission.js
import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  allowedPages: [{
    path: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    grantedAt: {
      type: Date,
      default: Date.now
    }
  }],
  allowedApis: [{
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      required: true
    },
    path: {
      type: String,
      required: true
    },
    description: String,
    grantedAt: {
      type: Date,
      default: Date.now
    }
  }],
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-update updatedAt
permissionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create index for faster queries
permissionSchema.index({ userId: 1 });

export default mongoose.models.Permission || 
  mongoose.model('Permission', permissionSchema);