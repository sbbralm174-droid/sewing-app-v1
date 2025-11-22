// app/api/iep-interview/assessment/route.js
import { connectDB } from '@/lib/db';
import VivaInterview from '@/models/IepInterview';

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get('candidateId');

    if (!candidateId) {
      return new Response(JSON.stringify({ error: 'Candidate ID is required' }), {
        status: 400,
      });
    }

    const candidate = await VivaInterview.findOne({ candidateId })
      .select('assessmentData processCapacity supplementaryMachines grade candidateId name')
      .lean();

    if (!candidate) {
      return new Response(JSON.stringify({ error: 'Candidate not found' }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: candidate
    }), { status: 200 });

  } catch (error) {
    console.error('Assessment fetch error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}



export async function PUT(req) {
  try {
    await connectDB();

    const body = await req.json();
    const { candidateId, assessmentData, processCapacity, supplementaryMachines, grade } = body;

    if (!candidateId) {
      return new Response(JSON.stringify({ error: 'Candidate ID is required' }), {
        status: 400,
      });
    }

    const updatedCandidate = await VivaInterview.findOneAndUpdate(
      { candidateId },
      {
        $set: {
          assessmentData,
          processCapacity,
          supplementaryMachines,
          grade,
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedCandidate) {
      return new Response(JSON.stringify({ error: 'Candidate not found' }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Assessment data updated successfully',
      data: updatedCandidate
    }), { status: 200 });

  } catch (error) {
    console.error('Assessment update error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}
