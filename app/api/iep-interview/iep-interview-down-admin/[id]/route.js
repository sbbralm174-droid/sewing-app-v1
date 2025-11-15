import { connectDB } from '@/lib/db';
import InterviewStatus from '@/models/iepInterviewDownAdmin';

export async function PATCH(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    const { status } = await request.json();
    
    if (!['passed', 'failed'].includes(status)) {
      return Response.json({ error: 'Invalid status' }, { status: 400 });
    }
    
    // Find and update the candidate status in our database
    const updatedStatus = await InterviewStatus.findOneAndUpdate(
      { _id: id },
      { status },
      { new: true, upsert: false }
    );
    
    if (!updatedStatus) {
      return Response.json({ error: 'Candidate not found in database' }, { status: 404 });
    }
    
    return Response.json({
      success: true,
      message: `Candidate status updated to ${status}`,
      candidate: updatedStatus
    });
    
  } catch (error) {
    console.error('Error updating candidate:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}