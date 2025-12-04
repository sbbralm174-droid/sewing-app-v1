import mongoose from 'mongoose';

const PermissionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User',
  },
  allowedPages: [{
    path: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    grantedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

PermissionSchema.index({ userId: 1 }, { unique: true });

export default mongoose.models.Permission || mongoose.model('Permission', PermissionSchema);