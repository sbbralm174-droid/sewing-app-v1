import { connectDB } from '@/lib/db';
import Supervisor from '@/models/Supervisor';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const supervisor = await Supervisor.create(body);
    return NextResponse.json(supervisor, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET() {
  try {
    await connectDB();
    const supervisors = await Supervisor.find({});
    return NextResponse.json(supervisors);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}