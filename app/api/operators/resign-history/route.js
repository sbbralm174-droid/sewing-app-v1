import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Operator from '@/models/Operator';
import OperatorResignHistory from '@/models/OperatorResignHistory';

export async function POST(request) {
  try {
    await connectDB();

    const { operatorId, department, approvedBy, reason, performanceMark, remarks } = await request.json();

    // Validation
    if (!operatorId || !department || !approvedBy || !reason || !performanceMark) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Find operator by ID or NID
    const operator = await Operator.findOne({
      $or: [
        { operatorId: operatorId.toUpperCase().trim() },
        { nid: operatorId.trim() }
      ]
    });

    if (!operator) {
      return NextResponse.json(
        { success: false, message: 'Operator not found' },
        { status: 404 }
      );
    }

    // Create resignation history record
    const resignationHistory = new OperatorResignHistory({
      name: operator.name,
      operatorId: operator.operatorId,
      nid: operator.nid,
      birthCertificate: operator.birthCertificate,
      joiningDate: operator.joiningDate,
      designation: operator.designation,
      grade: operator.grade,
      allowedProcesses: operator.allowedProcesses,
      department,
      approvedBy,
      reason,
      performanceMark,
      remarks,
      occurrenceReports: operator.occurrenceReports,
      originalResignationHistory: operator.resignationHistory
    });

    // Save to history
    await resignationHistory.save();

    // Delete from active operators
    await Operator.findByIdAndDelete(operator._id);

    return NextResponse.json({
      success: true,
      message: 'Operator resigned successfully and moved to history',
      data: {
        name: operator.name,
        operatorId: operator.operatorId
      }
    });

  } catch (error) {
    console.error('Resignation error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const operatorId = searchParams.get('operatorId');

    if (!operatorId) {
      return NextResponse.json(
        { success: false, message: 'Operator ID is required' },
        { status: 400 }
      );
    }

    // Search operator by ID or NID
    const operator = await Operator.findOne({
      $or: [
        { operatorId: operatorId.toUpperCase().trim() },
        { nid: operatorId.trim() }
      ]
    });

    if (!operator) {
      return NextResponse.json(
        { success: false, message: 'Operator not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        name: operator.name,
        operatorId: operator.operatorId,
        nid: operator.nid,
        designation: operator.designation,
        grade: operator.grade,
        joiningDate: operator.joiningDate
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}