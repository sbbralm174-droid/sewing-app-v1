import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  machineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Machine",
    required: true,
  },
  uniqueId: { 
    type: String, 
    required: true, 
    // This is the Machine's unique identifier (MC-101-A)
  },
  partName: { 
    type: String, 
    required: true, 
    // New field: Specifies which part needs service (e.g., 'Oil Filter', 'Belt Drive')
  },
  message: { 
    type: String, 
    required: true 
  },
  date: { 
    type: Date, 
    default: Date.now 
  },
  seen: { 
    type: Boolean, 
    default: false 
  },
});

export default mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
