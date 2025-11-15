// app/api/operators/search-for-update/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Operator from '@/models/Operator';

// GET: Operator ID দিয়ে অপারেটর খুঁজে বের করা
export async function GET(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const operatorId = searchParams.get('operatorId');

        if (!operatorId) {
            return NextResponse.json(
                { success: false, message: 'Operator ID is required for search' },
                { status: 400 }
            );
        }

        // operatorId কে case-insensitive search করার জন্য regex ব্যবহার
        const operator = await Operator.findOne({ 
            operatorId: new RegExp(`^${operatorId}$`, 'i') 
        });

        if (!operator) {
            return NextResponse.json(
                { success: false, message: 'Operator not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: operator }, { status: 200 });
    } catch (error) {
        console.error('Error fetching operator:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}