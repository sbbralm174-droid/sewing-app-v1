import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Machine from '@/models/Machine';

/**
 * POST handler to add a new part configuration to a machine.
 * Route: /api/machines/[machineId]/parts-upload
 */
export async function POST(request, { params }) {
    await connectDB();

    const { machineId } = params;

    if (!machineId) {
        return NextResponse.json({ error: 'Machine ID is required in the path.' }, { status: 400 });
    }

    try {
        const partData = await request.json();
        
        const {
            partName,
            uniquePartId,
            nextServiceDate,
        } = partData;

        // Basic validation
        if (!partName || !uniquePartId || !nextServiceDate) {
            return NextResponse.json({ 
                error: 'Missing required fields: partName, uniquePartId, and nextServiceDate are required.' 
            }, { status: 400 });
        }

        // Validate uniquePartId format
        const expectedUniqueId = `${machineId}-${partName}`;
        if (uniquePartId !== expectedUniqueId) {
            return NextResponse.json({ 
                error: `Invalid uniquePartId. Expected: ${expectedUniqueId}, Received: ${uniquePartId}` 
            }, { status: 400 });
        }

        // Normalize the nextServiceDate to start of day for consistent comparison
        const normalizedNextServiceDate = new Date(nextServiceDate);
        normalizedNextServiceDate.setHours(0, 0, 0, 0);
        
        const newPart = {
            partName,
            uniquePartId,
            nextServiceDate: normalizedNextServiceDate,
        };

        // Normalize uniquePartId for case-insensitive and space-insensitive comparison
        const normalizedUniquePartId = uniquePartId
            .toLowerCase()
            .replace(/\s+/g, ''); // Remove all spaces

        // Check if part with same normalized uniquePartId already exists in this machine
        const existingMachine = await Machine.findOne({ 
            uniqueId: machineId 
        });

        if (existingMachine) {
            const duplicatePart = existingMachine.parts.find(part => {
                const existingPartNormalized = part.uniquePartId
                    .toLowerCase()
                    .replace(/\s+/g, '');
                return existingPartNormalized === normalizedUniquePartId;
            });

            if (duplicatePart) {
                return NextResponse.json({ 
                    error: `A part with similar Unique ID already exists in machine ${machineId}. 
                    Existing: "${duplicatePart.uniquePartId}", 
                    New: "${uniquePartId}"` 
                }, { status: 409 }); // 409 Conflict
            }
        }

        // Find the machine by its uniqueId and push the new part into the 'parts' array
        const updatedMachine = await Machine.findOneAndUpdate(
            { uniqueId: machineId },
            { $push: { parts: newPart } },
            { new: true, runValidators: true } // Return the updated document
        );

        if (!updatedMachine) {
            return NextResponse.json({ error: `Machine with ID ${machineId} not found.` }, { status: 404 });
        }

        return NextResponse.json({ 
            message: 'Part added successfully.', 
            part: newPart,
            machineUniqueId: updatedMachine.uniqueId
        }, { status: 201 });

    } catch (error) {
        console.error('Error adding part to machine:', error);
        return NextResponse.json({ error: 'Internal server error while processing the request.' }, { status: 500 });
    }
}