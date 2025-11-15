import { NextResponse } from 'next/server';
import { connectDB } from "@/lib/db";
import Operator from '@/models/Operator'; // ✅ মডেলটি Operator নামে ইমপোর্ট করা হয়েছে

export async function POST(req) {
    await connectDB(); // ✅ MongoDB কানেকশন কল করুন (ধরে নিলাম connectToDatabase আপনার কানেকশন ফাংশন)

    try {
        const body = await req.json();
        
        const { operatorId, date, type, details, reportedBy } = body;

        const newReport = {
            date: new Date(date), 
            type,
            details,
            reportedBy
        };

        // 🟢 সংশোধন: OperatorModel-এর পরিবর্তে Operator ব্যবহার করুন 
        const updatedOperator = await Operator.findOneAndUpdate(
            { operatorId: operatorId }, 
            { 
                $push: { occurrenceReport: newReport } 
            },
            { 
                new: true,
                runValidators: true
            }
        );

        if (!updatedOperator) {
            return NextResponse.json({ message: "Operator not found" }, { status: 404 });
        }

        return NextResponse.json(updatedOperator, { status: 200 });

    } catch (error) {
        console.error("Error adding occurrence report:", error);
        
        return NextResponse.json(
            { message: "Failed to add occurrence report", error: error.message },
            { status: 500 }
        );
    }
}