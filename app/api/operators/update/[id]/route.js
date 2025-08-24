import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Operator from "@/models/Operator";

// ✅ Operator Update by ID
export async function PUT(req, { params }) {
  try {
    await connectDB();
    const body = await req.json();
    const { id } = params;

    const updatedOperator = await Operator.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedOperator) {
      return NextResponse.json({ error: "Operator not found" }, { status: 404 });
    }

    return NextResponse.json(updatedOperator);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update operator" },
      { status: 500 }
    );
  }
}
