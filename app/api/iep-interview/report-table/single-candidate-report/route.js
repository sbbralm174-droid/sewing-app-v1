import { connectDB } from '@/lib/db';

import VivaInterviewStep1 from '@/models/IepInterviewStepOne'; // SECURITY
import Candidate from '@/models/Candidate'; // DOWN ADMIN
import VivaInterview from '@/models/IepInterview'; // IEP
import AdminInterview from '@/models/AdminInterview';

export async function GET(req) {
  try {
    await connectDB(); // ✅ DB connect

    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get('candidateId');

    if (!candidateId) {
      return new Response(
        JSON.stringify({ message: 'candidateId is required' }),
        { status: 400 }
      );
    }

    // 🚀 Parallel query (fast)
    const [securityData, downAdminData, iepData] = await Promise.all([
      VivaInterviewStep1.findOne({ candidateId }),
      Candidate.findOne({ candidateId }),
      VivaInterview.findOne({ candidateId }),
    ]);

    // 🔥 Admin Interview (ObjectId case)
    let adminData = null;

    if (iepData) {
      adminData = await AdminInterview.findOne({
        candidateId: iepData._id,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          security: securityData,
          downAdmin: downAdminData,
          iepInterview: iepData,
          adminInterview: adminData,
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error(error);

    return new Response(
      JSON.stringify({ message: 'Server error' }),
      { status: 500 }
    );
  }
}