import { connectDB } from '@/lib/db';
import Machine from '@/models/Machine';
import { NextResponse } from 'next/server';
import '@/models/MachineType'

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const machine = await Machine.create(body);
    return NextResponse.json(machine, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET() {
  try {
    await connectDB();
    const machines = await Machine.find({}).populate('machineType');
    return NextResponse.json(machines);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}