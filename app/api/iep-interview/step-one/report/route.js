// api/iep-interview/step-one/report
import { connectDB } from '@/lib/db';
import VivaInterviewStep1 from '@/models/IepInterviewStepOne';

export async function GET() {
  try {
    await connectDB();

    // 🗓️ আজকের date range (start → end)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // 📦 আজকের candidate গুলো বের করা
    const candidates = await VivaInterviewStep1.find({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    }).select('name nid birthCertificate candidateId');

    // 🔢 total count (candidateId count)
    const totalCandidates = candidates.length;

    return Response.json({
      success: true,
      totalCandidates,
      data: candidates,
    });

  } catch (error) {
    console.error(error);
    return Response.json(
      { success: false, message: 'Server Error' },
      { status: 500 }
    );
  }
}

// UPDATE (PUT)
export async function PUT(req) {
  try {
    await connectDB();

    const body = await req.json();
    const { candidateId, name, nid } = body;

    if (!candidateId) {
      return Response.json(
        { success: false, message: 'candidateId required' },
        { status: 400 }
      );
    }

    const updated = await VivaInterviewStep1.findOneAndUpdate(
      { candidateId },
      {
        $set: {
          name,
          nid,
        },
      },
      { new: true }
    );

    if (!updated) {
      return Response.json(
        { success: false, message: 'Candidate not found' },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: updated,
    });

  } catch (error) {
    console.error(error);
    return Response.json(
      { success: false, message: 'Server Error' },
      { status: 500 }
    );
  }
}