import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  userId: { type: String, required: true, unique: true }, // employee/custom id
  password: { type: String, required: true },

  role: {
    type: String,
    enum: ["superadmin", "admin", "editor", "user"], // access control
    default: "user"
  },

  designation: { type: String, required: true }, // job title

  permissions: {
    type: [String],
    default: [] // page access control
  }
});

export default mongoose.models.User || mongoose.model("User", userSchema);
