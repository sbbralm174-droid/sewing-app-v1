import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Operator from "@/models/Operator";

export async function GET() {
  try {
    await connectDB();
    const operators = await Operator.find();
    return NextResponse.json(operators);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch operators" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const newOperator = new Operator(body);
    await newOperator.save();
    return NextResponse.json(newOperator, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create operator" },
      { status: 500 }
    );
  }
}
