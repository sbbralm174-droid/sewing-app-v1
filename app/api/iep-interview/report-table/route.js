// app/api/iep-interview/report-table/route.js
import { connectDB } from '@/lib/db';
import VivaInterviewStep1 from '@/models/IepInterviewStepOne';
import Candidate from '@/models/Candidate';
import VivaInterview from '@/models/IepInterview';
import AdminInterview from '@/models/AdminInterview';

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate + 'T23:59:59.999Z')
        }
      };
    } else {
      // Default to today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      dateFilter = {
        createdAt: {
          $gte: today,
          $lt: tomorrow
        }
      };
    }

    // Get all candidates from step 1 (base candidates)
    const step1Candidates = await VivaInterviewStep1.find(dateFilter).lean();
    
    const reportData = await Promise.all(
      step1Candidates.map(async (step1) => {
        const candidateId = step1.candidateId;
        
        // Get data from all steps
        const step2 = await Candidate.findOne({ candidateId }).lean();
        const step3 = await VivaInterview.findOne({ candidateId }).lean();
        let step4 = null;
    if (step3?._id) {
      step4 = await AdminInterview.findOne({ candidateId: step3._id }).lean();
    }

        // Determine current step and results
        const steps = [
          {
            step: 1,
            name: 'Initial Registration',
            result: step1?.result, // Step 1 is always passed since they registered
            failureReason: step1?.failureReason || null,
            date: step1.createdAt
          },
          {
            step: 2,
            name: 'Candidate Screening',
            result: step2?.result || (step2 ? 'PENDING' : 'NOT_REACHED'),
            failureReason: step2?.failureReason || null,
            date: step2?.createdAt
          },
          {
            step: 3,
            name: 'Viva Interview',
            result: step3?.result || (step3 ? 'PENDING' : 'NOT_REACHED'),
            failureReason: step3?.canceledReason || null,
            date: step3?.createdAt
          },
          {
            step: 4,
            name: 'Admin Interview',
            result: step4?.result || (step4 ? 'PENDING' : 'NOT_REACHED'),
            failureReason: step4?.canceledReason || null,
            date: step4?.createdAt
          }
        ];

        // Find current step (last step with data)
        let currentStep = 1;
        for (let i = 4; i >= 1; i--) {
          if ((i === 1 && step1) || (i === 2 && step2) || (i === 3 && step3) || (i === 4 && step4)) {
            currentStep = i;
            break;
          }
        }

        // Overall status
        let overallStatus = 'PENDING';
        if (steps.some(step => step.result === 'FAILED')) {
          overallStatus = 'FAILED';
        } else if (steps.every(step => step.result === 'PASSED' || step.result === 'NOT_REACHED')) {
          if (currentStep === 4 && steps[3].result === 'PASSED') {
            overallStatus = 'PASSED';
          } else {
            overallStatus = 'PENDING';
          }
        }

        return {
          candidateId,
          picture: step1.picture,
          name: step1.name,
          nid: step1.nid,
          currentStep,
          overallStatus,
          steps,
          registeredDate: step1.createdAt
        };
      })
    );

    // Calculate summary
    const totalCandidates = reportData.length;
    const pending = reportData.filter(c => c.overallStatus === 'PENDING').length;
    const passed = reportData.filter(c => c.overallStatus === 'PASSED').length;
    const failed = reportData.filter(c => c.overallStatus === 'FAILED').length;

    const summary = {
      total: totalCandidates,
      pending,
      passed,
      failed
    };

    return Response.json({
      success: true,
      data: {
        summary,
        candidates: reportData
      }
    });

  } catch (error) {
    console.error('Error fetching candidate report:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}