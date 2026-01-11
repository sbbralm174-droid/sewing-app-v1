// models/IepInterview.js
import mongoose from "mongoose";
import Counter from "./Counter.js";

const VivaInterviewSchema = new mongoose.Schema(
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
    },
    videos: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        originalName: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    interviewDate: {
      type: Date,
      required: [true, "Interview date is required"],
    },
    interviewer: {
      type: String,
      required: [true, "Interviewer name is required"],
    },
    department: {
      type: String,
      required: [true, "Department is required"],
    },
    vivaDetails: [
      {
        question: { type: String },
        answer: { type: String },
        remark: { type: String },
      },
    ],
    processAndScore: {
      type: Map,
      of: Number,
      default: {},
    },
    processCapacity: {
      type: Map,
      of: Number,
      default: {},
    },
    grade: {
      type: String,
      enum: ["A", "A+", "A++", "B+", "B" ,"Unskill"],
      default: "Unskill",
    },
    result: {
      type: String,
      enum: ["PENDING", "PASSED", "FAILED"],
      default: "PASSED",
    },
    remarks: { type: String },
    promotedToAdmin: { type: Boolean, default: false },
    canceledReason: { type: String },
    assessmentData: { type: mongoose.Schema.Types.Mixed }, // Store full assessment data
    supplementaryMachines: { type: Map, of: Boolean, default: {} } // Store supplementary machines
  },
  { timestamps: true }
);

// ✅ Auto-generate candidateId before save
VivaInterviewSchema.pre('save', async function(next) {
  if (!this.candidateId) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: 'candidateId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.candidateId = `CAN${counter.seq.toString().padStart(5, '0')}`;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

export default mongoose.models.VivaInterview ||
  mongoose.model("VivaInterview", VivaInterviewSchema);