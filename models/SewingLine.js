import mongoose from "mongoose";
const SewingLineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  floor: { type: mongoose.Schema.Types.ObjectId, ref: "Floor", required: true }
});
export default mongoose.models.SewingLine || mongoose.model("SewingLine", SewingLineSchema);
