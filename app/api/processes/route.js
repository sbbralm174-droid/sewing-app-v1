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

    // Check if process exists
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

    // Special handling for SMV updates
    if (updateData.smv && updateData.smv !== existingProcess.smv) {
      // Use the static method for SMV updates
      const smvComment = updateData.smvChangeComment || `SMV updated from ${existingProcess.smv} to ${updateData.smv}`;
      
      // Remove SMV-related fields from updateData as they're handled separately
      const { smv, smvChangeComment, ...otherUpdates } = updateData;
      
      // First update SMV with version tracking
      const processWithUpdatedSMV = await Process.findByIdAndUpdate(
        _id,
        {
          $set: {
            smv: updateData.smv,
            previousSmv: existingProcess.smv,
            previousSmvVersion: existingProcess.smvVersion,
            smvVersion: existingProcess.smvVersion + 1
          },
          $push: {
            smvHistory: {
              smv: existingProcess.smv,
              smvVersion: existingProcess.smvVersion,
              updatedAt: new Date(),
              comment: smvComment
            }
          }
        },
        { new: true, runValidators: true }
      );

      // Apply other updates if any
      if (Object.keys(otherUpdates).length > 0) {
        await Process.findByIdAndUpdate(_id, otherUpdates);
      }

      // Fetch the fully updated process
      const fullyUpdatedProcess = await Process.findById(_id);
      return NextResponse.json(fullyUpdatedProcess, { status: 200 });
    }

    // Regular update for non-SMV changes
    const updatedProcess = await Process.findByIdAndUpdate(
      _id,
      updateData,
      { new: true, runValidators: true }
    );

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

    const process = await Process.findById(_id).select('smvHistory previousSmv previousSmvVersion smv smvVersion');
    
    if (!process) {
      return NextResponse.json(
        { error: "Process not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      currentSmv: process.smv,
      currentSmvVersion: process.smvVersion,
      previousSmv: process.previousSmv,
      previousSmvVersion: process.previousSmvVersion,
      smvHistory: process.smvHistory
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}