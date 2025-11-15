import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Operator from '@/models/Operator';

export async function PATCH(request, { params }) {
    try {
        await connectDB();
        
        const { id } = params;
        const body = await request.json();
        
        const operator = await Operator.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true, runValidators: true }
        );
        
        if (!operator) {
            return NextResponse.json(
                { error: 'Operator not found' },
                { status: 404 }
            );
        }
        
        return NextResponse.json(operator);
    } catch (error) {
        console.error('Error updating operator:', error);
        return NextResponse.json(
            { error: 'Failed to update operator' },
            { status: 500 }
        );
    }
}