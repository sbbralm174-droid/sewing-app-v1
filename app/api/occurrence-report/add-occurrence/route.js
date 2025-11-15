import { NextResponse } from 'next/server';
import { connectDB } from "@/lib/db";
import Operator from '@/models/Operator';

export async function POST(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    console.log("📥 Incoming body:", body);

    const { operatorId, date, type, details, reportedBy } = body;

    // Validation
    if (!operatorId || !date || !type || !details || !reportedBy) {
      console.log("❌ Missing field(s)");
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Find operator
    const operator = await Operator.findOne({ operatorId });
    console.log("🔍 Found operator:", operator ? operator.operatorId : "Not found");

    if (!operator) {
      return NextResponse.json(
        { error: 'Operator not found' },
        { status: 404 }
      );
    }

    // Prepare new report
    const newReport = {
      date: new Date(date),
      type,
      details,
      reportedBy,
    };
    console.log("🆕 New report:", newReport);

    // Push new occurrence report
    const updateResult = await Operator.updateOne(
      { operatorId },
      { $push: { occurrenceReport: newReport } }
    );

    console.log("📤 Update result:", updateResult);

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to update operator occurrence report' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Occurrence report added successfully',
        report: newReport 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("🔥 Error adding occurrence report:", error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
