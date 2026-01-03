import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Machine from '@/models/Machine'; // Apnar model path

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = params;
    const uniqueId = decodeURIComponent(id);

    // ✅ Case-insensitive search use korchi (i flag mane ignore case)
    const machine = await Machine.findOne({ 
      uniqueId: { $regex: new RegExp(`^${uniqueId}$`, 'i') } 
    }).lean();

    if (!machine) {
      return NextResponse.json({ success: false, message: 'Machine not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: machine });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}