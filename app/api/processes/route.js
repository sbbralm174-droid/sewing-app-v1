import { connectDB } from '@/lib/db';
import { NextResponse } from 'next/server';
import Process from "@/models/Process";

// Create Process
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    // case-insensitive check
    const exists = await Process.findOne({
      name: { $regex: `^${body.name}$`, $options: "i" }
    });

    if (exists) {
      return NextResponse.json(
        { error: "Process already exists (case-insensitive)" },
        { status: 400 }
      );
    }

    const process = await Process.create(body);
    return NextResponse.json(process, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// Get all Processes
export async function GET() {
  try {
    await connectDB();
    const processes = await Process.find({}).sort({ createdAt: -1 });
    return NextResponse.json(processes, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update Process
// Update Process
export async function PUT(req) {
  try {
    await connectDB();
    const { _id, ...updateData } = await req.json();

    if (!_id) {
      return NextResponse.json(
        { error: "Process ID is required" },
        { status: 400 }
      );
    }

    // 1. Fetch the existing process
    const existingProcess = await Process.findById(_id);
    if (!existingProcess) {
      return NextResponse.json(
        { error: "Process not found" },
        { status: 404 }
      );
    }

    // If name is being updated, check for duplicate (case-insensitive)
    if (updateData.name && updateData.name !== existingProcess.name) {
      const duplicate = await Process.findOne({
        name: { $regex: `^${updateData.name}$`, $options: "i" },
        _id: { $ne: _id }
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "Process name already exists (case-insensitive)" },
          { status: 400 }
        );
      }
    }

    // 2. Prepare for pre('save') middleware (store old values if SMV is modified)
    const isSmvModifiedInRequest = updateData.smv !== undefined && parseFloat(updateData.smv) !== existingProcess.smv;
    if (isSmvModifiedInRequest) {
        // Store old SMV and Version directly on the document for pre-save access
        // This is a custom way to pass old values to pre-save logic
        existingProcess._originalSmv = existingProcess.smv;
        existingProcess._originalSmvVersion = existingProcess.smvVersion;
    }

    // 3. Apply updates to the document
    Object.assign(existingProcess, updateData);

    // 4. Save the document (this triggers the pre('save') middleware)
    const updatedProcess = await existingProcess.save();
    
    // The previousSmv and smvVersion fields will be updated by the pre-save hook

    return NextResponse.json(updatedProcess, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// Get SMV History for a process
export async function PATCH(req) {
  try {
    await connectDB();
    const { _id } = await req.json();

    if (!_id) {
      return NextResponse.json(
        { error: "Process ID is required" },
        { status: 400 }
      );
    }

    const process = await Process.findById(_id).select('smvHistory previousSmv previousSmvVersion');
    
    if (!process) {
      return NextResponse.json(
        { error: "Process not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      smvHistory: process.smvHistory,
      previousSmv: process.previousSmv,
      previousSmvVersion: process.previousSmvVersion
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}