// models/IepInterview.js


import mongoose from "mongoose";
import Counter from "./Counter.js";

const VivaInterviewSchema = new mongoose.Schema(
  {
    candidateId: {
      type: String,
      unique: true, // এইটা অবশ্যই থাকবে
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
        question: { type: String, },
        answer: { type: String,  },
        remark: { type: String },
      },
    ],
    processAndScore: {
      type: Map,
      of: Number,
      default: {},
    },
    grade: {
      type: String,
      enum: ["A", "A+", "A++", "B+", "B++", "B", "C", "D", "E", "F"],
      default: "C",
    },
    result: {
      type: String,
      enum: ["PENDING", "PASSED", "FAILED",],
      default: "PASSED",
    },
    remarks: { type: String },
    promotedToAdmin: { type: Boolean, default: false },
    canceledReason: { type: String },
  },
  { timestamps: true }
);

// ✅ Auto-generate candidateId before save


export default mongoose.models.VivaInterview ||
  mongoose.model("VivaInterview", VivaInterviewSchema);
