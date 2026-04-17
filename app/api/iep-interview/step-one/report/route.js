
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