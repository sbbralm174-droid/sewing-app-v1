import DailyProduction from '@/models/DailyProduction';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';

export async function PUT(request) {
  try {
    await connectDB();
    
    const updates = await request.json();
    
    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Expected array of updates' },
        { status: 400 }
      );
    }
    
    const results = [];
    const errors = [];
    
    for (const update of updates) {
      try {
        const { id, ...updateData } = update;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
          errors.push({ id, error: 'Invalid ID' });
          continue;
        }
        
        const updated = await DailyProduction.findByIdAndUpdate(
          id,
          { 
            ...updateData,
            updatedAt: new Date()
          },
          { new: true, runValidators: true }
        );
        
        if (updated) {
          results.push(updated);
        } else {
          errors.push({ id, error: 'Not found' });
        }
      } catch (error) {
        errors.push({ id: update.id, error: error.message });
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      updatedCount: results.length,
      errorCount: errors.length,
      results: results,
      errors: errors
    });
    
  } catch (error) {
    console.error('Bulk update error:', error);
    return NextResponse.json(
      { error: 'Failed to bulk update' },
      { status: 500 }
    );
  }
}