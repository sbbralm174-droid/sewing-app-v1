import { connectDB } from '@/lib/db';
import DailyProduction from '@/models/DailyProduction';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    const entryDate = new Date(body.date);
    if (isNaN(entryDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format provided.' },
        { status: 400 }
      );
    }

    const startOfDay = new Date(entryDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    
    const endOfDay = new Date(entryDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // DUP CHECK: Now checking for the nested operator.operatorId and uniqueMachine string
    const existingEntry = await DailyProduction.findOne({
      date: { $gte: startOfDay, $lte: endOfDay },
      $or: [
        { 'operator.operatorId': body.operator.operatorId }, // Check if operator is already assigned
        { uniqueMachine: body.uniqueMachine } // Check if machine is already in use
      ]
    });

    if (existingEntry) {
      let errorMessage = 'Duplicate entry detected for this date.';
      if (existingEntry.operator.operatorId === body.operator.operatorId) {
        errorMessage = 'This operator already has a production entry for the selected date.';
      } else if (existingEntry.uniqueMachine === body.uniqueMachine) {
        errorMessage = 'This machine already has a production entry for the selected date.';
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    const productionEntry = await DailyProduction.create({
      ...body,
      date: entryDate
    });
    
    return NextResponse.json(productionEntry, { status: 201 });
  } catch (error) {
    console.error('Error creating production entry:', error);
    return NextResponse.json(
      { error: 'Failed to create production entry. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');
    const operatorId = searchParams.get('operatorId'); // Changed to operatorId
    const machine = searchParams.get('machine');

    let query = {};

    if (dateParam) {
      const date = new Date(dateParam);
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format.' },
          { status: 400 }
        );
      }

      const startOfDay = new Date(date);
      startOfDay.setUTCHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setUTCHours(23, 59, 59, 999);

      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    // Now querying the nested field
    if (operatorId) {
      query['operator.operatorId'] = operatorId;
    }
    if (machine) {
      query.uniqueMachine = machine;
    }

    const data = await DailyProduction.find(query);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching production data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch production data.' },
      { status: 500 }
    );
  }
}