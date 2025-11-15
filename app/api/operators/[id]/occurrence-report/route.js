// File: /api/operators/[id]/occurrence-report/route.js (or similar)

import { connectDB } from '@/lib/db';
import Operator from '@/models/Operator';
import mongoose from 'mongoose'; // Import mongoose for casting

export async function POST(request, { params }) {
    try {
        await connectDB();
        const id = params.id;
        const { date, type, details, reportedBy } = await request.json();

        // 1. Basic validation of incoming data
        if (!date || !type || !details || !reportedBy) {
            return Response.json({ error: 'All report fields (date, type, details, reportedBy) are required' }, { status: 400 });
        }

        // 2. Prepare the new occurrence report object
        const newReport = {
            // Ensure the date is correctly cast to a Date object
            date: new Date(date), 
            type,
            details,
            reportedBy
        };

        // 3. Use findByIdAndUpdate with $push to update the nested array
        // This method avoids triggering full document validation (like your NID/Birth Cert check)
        const updatedOperator = await Operator.findByIdAndUpdate(
            id,
            { 
                $push: { occurrenceReports: newReport } 
            },
            { 
                new: true, // Return the updated document
                runValidators: true, // Still run validators on the new report object being pushed
                // IMPORTANT: Omit 'runValidators' for the entire document 
                // to skip the NID/JoiningDate checks on the existing data.
            }
        );

        // 4. Check if the operator was found
        if (!updatedOperator) {
            return Response.json({ error: 'Operator not found' }, { status: 404 });
        }

        return Response.json({ 
            message: 'Occurrence report added successfully!', 
            operator: updatedOperator 
        });
        
    } catch (error) {
        // Log detailed error for debugging
        console.error("Error in POST /api/operators/[id]/occurrence-report:", error); 
        
        // Handle Mongoose validation errors specific to the PUSH operation
        if (error instanceof mongoose.Error.ValidationError) {
            return Response.json({ 
                error: `Report validation failed: ${error.message}` 
            }, { status: 400 });
        }

        return Response.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}