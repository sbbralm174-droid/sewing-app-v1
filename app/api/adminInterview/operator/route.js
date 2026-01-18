// app/api/adminInterview/operator/route.js

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import AdminInterview from "@/models/AdminInterview";
import VivaInterview from "@/models/IepInterview";
import Operator from "@/models/Operator";

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    console.log("SAVING RESULT:", body.result);


    // Validate required fields
    if (!body.adminInterviewId) {
      return NextResponse.json(
        { error: "Admin Interview ID is required" },
        { status: 400 }
      );
    }

    if (!body.operatorId) {
      return NextResponse.json(
        { error: "Operator ID is required" },
        { status: 400 }
      );
    }

    // Find the admin interview
    const adminInterview = await AdminInterview.findById(body.adminInterviewId)
      .populate('candidateId');

    if (!adminInterview) {
      return NextResponse.json(
        { error: "Admin interview not found" },
        { status: 404 }
      );
    }

    // Check if candidate passed the admin interview
    if (adminInterview.result !== "PASSED") {
      return NextResponse.json(
        { error: "Candidate did not pass admin interview" },
        { status: 400 }
      );
    }

    // Check if operator already exists with this operatorId
    const existingOperator = await Operator.findOne({
      operatorId: body.operatorId
    });

    if (existingOperator) {
      return NextResponse.json(
        { error: "Operator ID already exists" },
        { status: 400 }
      );
    }

    // Get viva interview data for candidate details
    const vivaInterview = await VivaInterview.findById(adminInterview.candidateId._id);
    if (!vivaInterview) {
      return NextResponse.json(
        { error: "Candidate viva data not found" },
        { status: 404 }
      );
    }

    // Prepare operator data
    const operatorData = {
      operatorId: body.operatorId,
      name: vivaInterview.name,
      employeeId: body.operatorId,
      nid: vivaInterview.nid,
      birthCertificate: vivaInterview.birthCertificate,
      picture: vivaInterview.picture,
      videos: vivaInterview.videos || [],
      joiningDate: body.joiningDate ? new Date(body.joiningDate) : new Date(),
      designation: body.designation || "Operator",
      grade: vivaInterview.grade || "C",
      allowedProcesses: vivaInterview.processAndScore || {},
      salary: adminInterview.salary // Admin interview থেকে salary নেওয়া
    };

    // Validate operator data
    if (!operatorData.nid && !operatorData.birthCertificate) {
      return NextResponse.json(
        { error: "Either NID or Birth Certificate must be provided" },
        { status: 400 }
      );
    }

    // Normalize allowedProcesses
    if (operatorData.allowedProcesses) {
      if (Array.isArray(operatorData.allowedProcesses)) {
        const obj = {};
        operatorData.allowedProcesses.forEach(p => { obj[p] = 0 });
        operatorData.allowedProcesses = obj;
      } else if (operatorData.allowedProcesses instanceof Map) {
        operatorData.allowedProcesses = Object.fromEntries(operatorData.allowedProcesses);
      }
    } else {
      operatorData.allowedProcesses = {};
    }

    // Create new operator
    const newOperator = new Operator(operatorData);
    await newOperator.save();

    // Update admin interview with operator reference
    adminInterview.promotedToOperator = true;
    adminInterview.operatorId = newOperator._id;
    adminInterview.joiningDate = operatorData.joiningDate;
    adminInterview.designation = operatorData.designation;
    await adminInterview.save();

    return NextResponse.json({
      success: true,
      operator: newOperator,
      adminInterview: adminInterview,
      message: "Operator created successfully and admin interview updated"
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating operator from admin interview:", error);

    if (error.message === 'Either NID or Birth Certificate must be provided') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return NextResponse.json(
        { error: `${field} already exists` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create operator" },
      { status: 500 }
    );
  }
}