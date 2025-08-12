import { connectDB } from '@/lib/db';
import MachineType from '@/models/MachineType';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const machineType = await MachineType.create(body);
    return NextResponse.json(machineType, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET() {
  try {
    await connectDB();
    const machineTypes = await MachineType.find({});
    return NextResponse.json(machineTypes);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}