import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Candidate from '@/models/Candidate';

export async function PUT(request, { params }) {
    try {
        await connectDB();
        const { id } = params;
        const body = await request.json();

        const updatedCandidate = await Candidate.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true, runValidators: true }
        );

        if (!updatedCandidate) {
            return NextResponse.json({ message: "Candidate not found" }, { status: 404 });
        }

        return NextResponse.json(
            { message: "Updated successfully", data: updatedCandidate },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { message: "Update failed", error: error.message },
            { status: 500 }
        );
    }
}