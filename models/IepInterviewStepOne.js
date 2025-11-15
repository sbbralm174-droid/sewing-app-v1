// models/IepInterviewStepOne.js
import mongoose from "mongoose";
import Counter from "./Counter.js";

const VivaInterviewStep1Schema = new mongoose.Schema(
  {
    candidateId: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
      required: [true, "Candidate name is required"],
      trim: true,
    },
    nid: {
      type: String,
      trim: true,
    },
    birthCertificate: {
      type: String,
      trim: true,
    },
    picture: {
      type: String,
      required: [true, "Candidate picture is required"],
    },
    stepCompleted: {
      type: Number,
      default: 1,
    },
    failureReason:{
    type: String
  },
    result: {
      type: String,
      enum: ["PASSED", "FAILED",],
      required: true,
    },
  },
  { timestamps: true }
);

// ✅ Auto-generate candidateId before save
VivaInterviewStep1Schema.pre("save", async function (next) {
  if (this.candidateId) return next();

  try {
    const counter = await Counter.findOneAndUpdate(
      { name: "vivaInterview" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    this.candidateId = "GMST-" + counter.seq.toString().padStart(8, "0");
    next();
  } catch (error) {
    next(error);
  }
});

export default mongoose.models.VivaInterviewStep1 ||
  mongoose.model("VivaInterviewStep1", VivaInterviewStep1Schema);