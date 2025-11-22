import { connectDB } from '@/lib/db';
import { NextResponse } from 'next/server';
import Process from "@/models/Process";

// Create Process
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    // Extract all fields including machineType
    const {
      name,
      description,
      code,
      smv,
      comments,
      processStatus,
      isAssessment,
      subProcess,
      condition,
      workAid,
      machineType
    } = body;

    // Check for duplicate code
    const codeExists = await Process.findOne({ code });
    if (codeExists) {
      return NextResponse.json(
        { error: "Process code already exists" },
        { status: 400 }
      );
    }

    const process = await Process.create({
      name,
      description,
      code,
      smv: parseFloat(smv) || 0,
      comments,
      processStatus,
      isAssessment: Boolean(isAssessment),
      subProcess,
      condition,
      workAid,
      machineType
    });
    
    return NextResponse.json(process, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// Get all Processes
export async function GET() {
  try {
    await connectDB();
    const processes = await Process.find({})
      .select('name description code smv smvVersion previousSmv previousSmvVersion comments processStatus isAssessment subProcess condition workAid machineType createdAt updatedAt')
      .sort({ createdAt: -1 });
    
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

    // If code is being updated, check for duplicate
    if (updateData.code && updateData.code !== existingProcess.code) {
      const codeDuplicate = await Process.findOne({
        code: updateData.code,
        _id: { $ne: _id }
      });

      if (codeDuplicate) {
        return NextResponse.json(
          { error: "Process code already exists" },
          { status: 400 }
        );
      }
    }

    // Prepare update object with all fields
    const updateObject = {
      name: updateData.name,
      description: updateData.description,
      code: updateData.code,
      comments: updateData.comments,
      processStatus: updateData.processStatus,
      isAssessment: Boolean(updateData.isAssessment),
      subProcess: updateData.subProcess,
      condition: updateData.condition,
      workAid: updateData.workAid,
      machineType: updateData.machineType,
      updatedAt: new Date()
    };

    // Special handling for SMV updates
    if (updateData.smv && parseFloat(updateData.smv) !== existingProcess.smv) {
      const newSMV = parseFloat(updateData.smv);
      const smvComment = updateData.smvChangeComment || `SMV updated from ${existingProcess.smv} to ${newSMV}`;

      // Add SMV history and version tracking
      updateObject.smv = newSMV;
      updateObject.previousSmv = existingProcess.smv;
      updateObject.previousSmvVersion = existingProcess.smvVersion;
      updateObject.smvVersion = existingProcess.smvVersion + 1;
      
      // Add to SMV history
      updateObject.$push = {
        smvHistory: {
          smv: existingProcess.smv,
          smvVersion: existingProcess.smvVersion,
          updatedAt: new Date(),
          comment: smvComment
        }
      };
    } else {
      updateObject.smv = parseFloat(updateData.smv) || existingProcess.smv;
    }

    // Update the process
    const updatedProcess = await Process.findByIdAndUpdate(
      _id,
      updateObject,
      { new: true, runValidators: true }
    );

    return NextResponse.json(updatedProcess, { status: 200 });
  } catch (error) {
    console.error('Error updating process:', error);
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

    const process = await Process.findById(_id)
      .select('smvHistory previousSmv previousSmvVersion smv smvVersion name code machineType');
    
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
      smvHistory: process.smvHistory,
      name: process.name,
      code: process.code,
      machineType: process.machineType
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}