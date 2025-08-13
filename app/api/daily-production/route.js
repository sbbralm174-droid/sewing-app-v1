import { connectDB } from '@/lib/db';
import DailyProduction from '@/models/DailyProduction';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    const { date, operator, workAs, uniqueMachine } = body;

    const entryDate = new Date(date);
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

    // Conditional duplicate check for operators only
    if (workAs === 'operator') {
      const existingEntry = await DailyProduction.findOne({
        date: { $gte: startOfDay, $lte: endOfDay },
        $or: [
          { 'operator.operatorId': operator.operatorId },
          { uniqueMachine: uniqueMachine }
        ]
      });

      if (existingEntry) {
        let errorMessage = 'Duplicate entry detected for this date.';
        if (existingEntry.operator.operatorId === operator.operatorId) {
          errorMessage = 'This operator already has a production entry for the selected date.';
        } else if (existingEntry.uniqueMachine === uniqueMachine) {
          errorMessage = 'This machine already has a production entry for the selected date.';
        }
        return NextResponse.json(
          { error: errorMessage },
          { status: 400 }
        );
      }
    } else if (workAs === 'helper') {
      // For a helper, we only need to check if the operator has an entry for the date.
      const existingOperatorEntry = await DailyProduction.findOne({
        date: { $gte: startOfDay, $lte: endOfDay },
        'operator.operatorId': operator.operatorId
      });
      if (existingOperatorEntry) {
        return NextResponse.json(
          { error: 'This operator already has a production entry for the selected date.' },
          { status: 400 }
        );
      }
    }
    
    // Prepare the payload based on the role
    let payload = {
        ...body,
        date: entryDate,
    };
    
    // Remove operator-specific fields for helper role to prevent schema validation issues
    if (workAs === 'helper') {
        payload.machineType = undefined;
        payload.uniqueMachine = undefined;
        payload.target = undefined;
    }

    const productionEntry = await DailyProduction.create(payload);

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
    const operatorId = searchParams.get('operatorId');
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