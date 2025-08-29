import { connectDB } from '@/lib/db';
import { NextResponse } from 'next/server';
import "@/models/MachineType";
import Process from "@/models/Process";

// Create Process
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    // case-insensitive check
    const exists = await Process.findOne({
      name: { $regex: `^${body.name}$`, $options: "i" }
    });

    if (exists) {
      return NextResponse.json(
        { error: "Process already exists (case-insensitive)" },
        { status: 400 }
      );
    }

    const process = await Process.create(body);
    return NextResponse.json(process, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}


// Get all Processes
export async function GET() {
  try {
    await connectDB();
    const processes = await Process.find({});
    return NextResponse.json(processes, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
