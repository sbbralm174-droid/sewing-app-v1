
import Operator from '@/models/Operator';
import ResignHistory from '@/models/ResignHistory';
import { connectDB } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const {
      operatorId,
      department,
      approvedBy,
      reason,
      performanceMark,
      remarks
    } = body;

    // Validate required fields
    if (!operatorId || !department || !approvedBy || !reason || !performanceMark) {
      return NextResponse.json(
        { success: false, message: 'All required fields must be filled' },
        { status: 400 }
      );
    }

    // Find operator
    const operator = await Operator.findOne({
      $or: [
        { operatorId: operatorId },
        { nid: operatorId }
      ]
    });

    if (!operator) {
      return NextResponse.json(
        { success: false, message: 'Operator not found' },
        { status: 404 }
      );
    }

    // Create resign history record
    const resignHistoryData = {
      operatorId: operator.operatorId,
      name: operator.name,
      nid: operator.nid,
      designation: operator.designation,
      grade: operator.grade,
      joiningDate: operator.joiningDate,
      department,
      approvedBy,
      reason,
      performanceMark,
      remarks: remarks || '',
      picture: operator.picture || '',
      allowedProcesses: operator.allowedProcesses || {},
      previousProcessScores: operator.previousProcessScores || [],
      occurrenceReports: operator.occurrenceReports || []
    };

    const resignHistory = new ResignHistory(resignHistoryData);
    await resignHistory.save();

    // ✅ CORRECTION: Delete operator from main collection
    await Operator.findByIdAndDelete(operator._id);

    return NextResponse.json({
      success: true,
      message: 'Operator resigned successfully and moved to history',
      data: {
        resignedOperator: {
          name: operator.name,
          operatorId: operator.operatorId,
          resignationDate: new Date()
        }
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



export async function GET() {
  try {
    await connectDB();
    const resignHistory = await ResignHistory.find();
    return NextResponse.json(resignHistory);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch operators" },
      { status: 500 }
    );
  }
}

