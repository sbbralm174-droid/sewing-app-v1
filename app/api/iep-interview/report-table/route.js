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

    // Date filter (same as before)
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate + 'T23:59:59.999Z')
        }
      };
    } else {
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

    // 🔥 STEP 1: Get base candidates
    const step1Candidates = await VivaInterviewStep1.find(dateFilter).lean();

    const candidateIds = step1Candidates.map(c => c.candidateId);

    // 🔥 STEP 2: Bulk fetch সব data
    const step2Data = await Candidate.find({
      candidateId: { $in: candidateIds }
    }).lean();

    const step3Data = await VivaInterview.find({
      candidateId: { $in: candidateIds }
    }).lean();

    const step3Ids = step3Data.map(s => s._id);

    const step4Data = await AdminInterview.find({
      candidateId: { $in: step3Ids }
    }).lean();

    // 🔥 STEP 3: Map তৈরি (O(1) lookup)
    const step2Map = new Map(
      step2Data.map(item => [item.candidateId, item])
    );

    const step3Map = new Map(
      step3Data.map(item => [item.candidateId, item])
    );

    const step4Map = new Map(
      step4Data.map(item => [item.candidateId.toString(), item])
    );

    // 🔥 STEP 4: Build report (NO DB CALL HERE)
    const reportData = step1Candidates.map((step1) => {
      const candidateId = step1.candidateId;

      const step2 = step2Map.get(candidateId);
      const step3 = step3Map.get(candidateId);
      const step4 = step3 ? step4Map.get(step3._id.toString()) : null;

      // Same steps logic (unchanged)
      const steps = [
        {
          step: 1,
          name: 'Initial Registration',
          result: step1?.result,
          failureReason: step1?.failureReason || null,
          date: step1.createdAt
        },
        {
          step: 2,
          name: 'Candidate Screening',
          result: step2?.result || (step2 ? 'PENDING' : 'NOT_REACHED'),
          failureReason: step2?.failureReason || null,
          floor: step2?.floor,
          date: step2?.createdAt
        },
        {
          step: 3,
          name: 'Viva Interview',
          result: step3?.result || (step3 ? 'PENDING' : 'NOT_REACHED'),
          grade: step3?.grade,
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

      // currentStep logic (unchanged)
      let currentStep = 1;
      for (let i = 4; i >= 1; i--) {
        if (
          (i === 1 && step1) ||
          (i === 2 && step2) ||
          (i === 3 && step3) ||
          (i === 4 && step4)
        ) {
          currentStep = i;
          break;
        }
      }

      // overallStatus logic (unchanged)
      let overallStatus = 'PENDING';

      if (steps.some(step => step.result === 'FAILED')) {
        overallStatus = 'FAILED';
      } else if (
        steps.every(step =>
          step.result === 'PASSED' || step.result === 'NOT_REACHED'
        )
      ) {
        if (currentStep === 4 && steps[3].result === 'PASSED') {
          overallStatus = 'PASSED';
        } else {
          overallStatus = 'PENDING';
        }
      }

      return {
        candidateId,
        picture: step1.picture,
        date: step1.createdAt,
        name: step1.name,
        nid: step1.nid,
        currentStep,
        birthCertificate: step1.birthCertificate,
        grade: step3?.grade,
        floor: step2?.floor,
        overallStatus,
        steps,
        registeredDate: step1.createdAt
      };
    });

    // Summary (same)
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