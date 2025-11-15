import { NextResponse } from 'next/server';
import { connectDB } from "@/lib/db";
import Operator from '@/models/Operator';

export async function POST(request) {
  try {
    await connectDB();
    
    const { searchType, searchValue } = await request.json();

    if (!searchType || !searchValue) {
      return NextResponse.json(
        { error: 'Search type and value are required' },
        { status: 400 }
      );
    }

    let query = {};
    
    switch (searchType) {
      case 'operatorId':
        query = { operatorId: searchValue };
        break;
      case 'nid':
        query = { nid: searchValue };
        break;
      case 'birthCertificate':
        query = { birthCertificate: searchValue };
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid search type' },
          { status: 400 }
        );
    }

    const operator = await Operator.findOne(query);

    if (!operator) {
      return NextResponse.json(
        { error: 'Operator not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      operator: {
        name: operator.name,
        operatorId: operator.operatorId,
        nid: operator.nid,
        birthCertificate: operator.birthCertificate,
        designation: operator.designation,
        grade: operator.grade
      },
      occurrenceReports: operator.occurrenceReports || []
    });

  } catch (error) {
    console.error('Error searching occurrence reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}