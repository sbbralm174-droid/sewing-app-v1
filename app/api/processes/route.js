import { connectDB } from '@/lib/db';
//import Process from '@/models/Process';
import { NextResponse } from 'next/server';
import "@/models/MachineType";
import Process from "@/models/Process";


export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const process = await Process.create(body);
    return NextResponse.json(process, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET() {
  try {
    await connectDB();
    const processes = await Process.find({})
    return NextResponse.json(processes);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}