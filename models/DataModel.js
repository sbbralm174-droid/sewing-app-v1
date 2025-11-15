import mongoose from "mongoose";

const DataSchema = new mongoose.Schema(
  {
    temperature: Number,
    humidity: Number,
    current: Number,   // ✅ ESP32 current sensor value
    deviceId: String,
  },
  { timestamps: true }
);

export default mongoose.models.Data || mongoose.model("Data", DataSchema);
