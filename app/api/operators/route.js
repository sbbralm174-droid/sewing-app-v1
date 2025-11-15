import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Operator from "@/models/Operator";

export async function GET() {
  try {
    await connectDB();
    const operators = await Operator.find();
    return NextResponse.json(operators);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch operators" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    // Validate required fields
    if (!body.joiningDate) {
      return NextResponse.json(
        { error: "Joining date is required" },
        { status: 400 }
      );
    }

    // Validate that at least one of NID or Birth Certificate is provided
    if (!body.nid && !body.birthCertificate) {
      return NextResponse.json(
        { error: "Either NID or Birth Certificate must be provided" },
        { status: 400 }
      );
    }

    // -------------------------------
    // Normalize allowedProcesses
    // -------------------------------
    if (body.allowedProcesses) {
      if (Array.isArray(body.allowedProcesses)) {
        // Old array format ["Cutting", "Sewing"] → { Cutting: 0, Sewing: 0 }
        const obj = {};
        body.allowedProcesses.forEach(p => { obj[p] = 0 });
        body.allowedProcesses = obj;
      } else if (body.allowedProcesses instanceof Map) {
        // Convert Map instance → plain object
        body.allowedProcesses = Object.fromEntries(body.allowedProcesses);
      }
      // Otherwise assume it's already plain object { processName: score }
    } else {
      body.allowedProcesses = {};
    }

    const newOperator = new Operator(body);
    await newOperator.save();

    return NextResponse.json(newOperator, { status: 201 });
  } catch (error) {
    console.error("Error creating operator:", error);

    // Handle custom validation error
    if (error.message === 'Either NID or Birth Certificate must be provided') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Handle duplicate key errors
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
