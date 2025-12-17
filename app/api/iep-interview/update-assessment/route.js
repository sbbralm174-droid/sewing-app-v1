import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import VivaInterview from "@/models/IepInterview";

export async function PUT(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { candidateId, assessmentData } = body;

    if (!candidateId || !assessmentData) {
      return NextResponse.json(
        { success: false, message: "Candidate ID and assessment data are required" },
        { status: 400 }
      );
    }

    // সার্চ করুন candidateId দিয়ে
    const existingRecord = await VivaInterview.findOne({ candidateId });

    if (!existingRecord) {
      return NextResponse.json(
        { success: false, message: "Candidate not found" },
        { status: 404 }
      );
    }

    // আপডেট করুন assessmentData
    existingRecord.assessmentData = assessmentData;
    existingRecord.processCapacity = assessmentData.processCapacity || {};
    existingRecord.supplementaryMachines = assessmentData.supplementaryMachines || {};
    
    // স্কোর আপডেট করুন
    if (assessmentData.scores) {
      existingRecord.processCapacity = {
        machineScore: assessmentData.scores.machineScore || 0,
        dopScore: assessmentData.scores.dopScore || 0,
        practicalScore: assessmentData.scores.practicalScore || 0,
        qualityScore: assessmentData.scores.averageQualityScore || 0,
        educationScore: assessmentData.scores.educationScore || 0,
        attitudeScore: assessmentData.scores.attitudeScore || 0,
        totalScore: assessmentData.scores.totalScore || 0
      };
    }

    // গ্রেড আপডেট করুন
    if (assessmentData.finalAssessment) {
      existingRecord.grade = assessmentData.finalAssessment.grade;
    }

    await existingRecord.save();

    return NextResponse.json({
      success: true,
      message: "Assessment updated successfully",
      data: existingRecord
    });
  } catch (error) {
    console.error("❌ Error updating assessment:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}