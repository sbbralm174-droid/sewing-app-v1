import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Operator from '@/models/Operator';
// নিশ্চিত করুন যে Floor মডেলটি ইম্পোর্ট করা আছে যেন পপুলেশন কাজ করে
import '@/models/Floor'; 

import FloorLine from '@/models/FloorLine';

// ডেট ফরম্যাট করার জন্য হেল্পার ফাংশন
function formatDate(date) {
    if (!date) return "N/A";
    try {
        return new Date(date).toISOString().split('T')[0];
    } catch (err) {
        return "Invalid Date";
    }
}

export async function GET() {
    try {
        await connectDB();

        // .populate() দিয়ে floor-এর ভিতর থেকে 'floorName' ফিল্ডটি নিয়ে আসা হয়েছে
        const operators = await Operator.find({})
            .populate({
                path: 'lastScan.floor',
                select: 'floorName' 
            })
            .lean()
            .populate({
                path: 'lastScan.line',
                select: 'lineNumber' // আপনার FloorLine মডেল অনুযায়ী এখানে 'lineNumber' বা 'name' হবে
            })
            .lean();

        const today = new Date().toISOString().split('T')[0];

        const reportData = operators.map(op => {
            // Running Process logic
            const runningProcess = op.lastScan?.breakdownProcess || op.lastScan?.process || "N/A";
            
            // Allowed Processes (Map/Object to String)
            const allProcesses = op.allowedProcesses ? 
                Object.keys(op.allowedProcesses).join(', ') : "None";

            // Status logic (Today check)
            let status = "Absent";
            if (op.lastScan?.date) {
                const lastScanDate = new Date(op.lastScan.date).toISOString().split('T')[0];
                if (lastScanDate === today) status = "Present";
            }

            return {
                id: op._id.toString(), // MongoDB ID-কে স্ট্রিং এ রূপান্তর
                name: op.name || "Unknown",
                operatorId: op.operatorId || "N/A",
                designation: op.designation || "N/A",
                joiningDate: op.joiningDate,
                floorName: op.lastScan?.floor?.floorName || "N/A",
                line: op.lastScan?.line?.lineNumber || "N/A",
                runningProcess,
                allProcesses,
                status
            };
        });

        // সারাংশ বা সামারি ক্যালকুলেশন
        const summary = {
            total: reportData.length,
            present: reportData.filter(d => d.status === "Present").length,
            absent: reportData.filter(d => d.status === "Absent").length,
        };

        return NextResponse.json({ 
            success: true,
            summary, 
            data: reportData 
        }, { status: 200 });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ 
            success: false,
            error: error.message,
            summary: { total: 0, present: 0, absent: 0 }, // এরর হলেও যেন ফ্রন্টএন্ড না ভাঙে
            data: [] 
        }, { status: 500 });
    }
}