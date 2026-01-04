import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Machine from '@/models/Machine';

export async function GET(request, { params }) {
    try {
        await connectDB();
        // URL থেকে আসা uniqueId ডি-কোড করা (যেমন: GT%2FLS -> GT/LS)
        const uniqueId = decodeURIComponent(params.uniqueId);
        
        const machine = await Machine.findOne({ uniqueId });

        if (!machine) {
            return NextResponse.json({ message: "Machine not found" }, { status: 404 });
        }
        return NextResponse.json(machine);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        await connectDB();
        const uniqueId = decodeURIComponent(params.uniqueId);
        const body = await request.json();

        // ডাটাবেস আপডেট (নেস্টেড অবজেক্ট সহ)
        const updatedMachine = await Machine.findOneAndUpdate(
            { uniqueId },
            { $set: body },
            { new: true, runValidators: true }
        );

        if (!updatedMachine) {
            return NextResponse.json({ message: "Update failed" }, { status: 404 });
        }

        return NextResponse.json(updatedMachine);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}