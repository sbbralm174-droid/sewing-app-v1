// app/api/iep-interview/update-status/route.js
import VivaInterview from '@/models/IepInterview';
import { connectDB } from '@/lib/db';

export async function PUT(req) {
  try {
    await connectDB();

    const { candidateId, result, promotedToAdmin, canceledReason } = await req.json();

    if (!candidateId) {
      return Response.json({ error: 'Candidate ID is required' }, { status: 400 });
    }

    if (!result) {
      return Response.json({ error: 'Result is required' }, { status: 400 });
    }

    // Find the existing candidate
    const existingCandidate = await VivaInterview.findOne({ candidateId });
    if (!existingCandidate) {
      return Response.json({ error: 'Candidate not found' }, { status: 404 });
    }

    // Check if current status is PENDING
    if (existingCandidate.result !== 'PENDING') {
      return Response.json({ 
        error: 'Only candidates with PENDING status can be updated',
        currentStatus: existingCandidate.result 
      }, { status: 400 });
    }

    // Prepare update data
    const updateData = {
      result,
      updatedAt: new Date()
    };

    // Add promotedToAdmin only if result is PASSED
    if (result === 'PASSED') {
      updateData.promotedToAdmin = promotedToAdmin || false;
    }

    // Add canceledReason only if result is FAILED
    if (result === 'FAILED' && canceledReason) {
      updateData.canceledReason = canceledReason;
    }

    // Update the candidate status
    const updatedCandidate = await VivaInterview.findOneAndUpdate(
      { candidateId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return Response.json({
      success: true,
      message: 'Candidate status updated successfully',
      data: updatedCandidate
    });

  } catch (error) {
    console.error('Status update error:', error);
    return Response.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}