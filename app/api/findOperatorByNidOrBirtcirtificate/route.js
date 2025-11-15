// app/api/search/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import IepInterviewStepOne from '@/models/IepInterviewStepOne';
import IepInterviewDownAdmin from '@/models/iepInterviewDownAdmin';
import IepInterview from '@/models/IepInterview';
import AdminInterview from '@/models/AdminInterview';
import Operator from '@/models/Operator';
import ResignHistory from '@/models/ResignHistory';

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const nidOrBirthCertificate = searchParams.get('nidOrBirthCertificate');
    
    if (!nidOrBirthCertificate) {
      return NextResponse.json(
        { success: false, message: 'NID বা Birth Certificate প্রদান করুন' },
        { status: 400 }
      );
    }

    // সকল মডেল থেকে একসাথে তথ্য সংগ্রহ
    const [
      stepOneResults,
      downAdminResults,
      interviewResults,
      adminInterviewResults,
      operatorResults,
      resignHistoryResults
    ] = await Promise.all([
      // Model 1: IepInterviewStepOne - nid field এ সার্চ
      IepInterviewStepOne.find({ nid: nidOrBirthCertificate }),
      
      // Model 2: IepInterviewDownAdmin - nid এবং interviewData.nid এ সার্চ
      IepInterviewDownAdmin.find({ 
        $or: [
          { nid: nidOrBirthCertificate },
          { 'interviewData.nid': nidOrBirthCertificate }
        ]
      }),
      
      // Model 3: IepInterview - nid field এ সার্চ
      IepInterview.find({ nid: nidOrBirthCertificate }),
      
      // Model 4: AdminInterview - nid এবং candidateId.nid এ সার্চ
      AdminInterview.find({ 
        $or: [
          { nid: nidOrBirthCertificate },
          { 'candidateId.nid': nidOrBirthCertificate }
        ]
      }).populate('candidateId'),
      
      // Model 5: Operator - nid field এ সার্চ
      Operator.find({ nid: nidOrBirthCertificate }),
      
      // Model 6: ResignHistory - nid field এ সার্চ
      ResignHistory.find({ nid: nidOrBirthCertificate })
    ]);

    const responseData = {
      success: true,
      searchValue: nidOrBirthCertificate,
      results: {
        iepInterviewStepOne: {
          model: 'IepInterviewStepOne',
          count: stepOneResults.length,
          data: stepOneResults
        },
        iepInterviewDownAdmin: {
          model: 'IepInterviewDownAdmin',
          count: downAdminResults.length,
          data: downAdminResults
        },
        iepInterview: {
          model: 'IepInterview',
          count: interviewResults.length,
          data: interviewResults
        },
        adminInterview: {
          model: 'AdminInterview',
          count: adminInterviewResults.length,
          data: adminInterviewResults
        },
        operator: {
          model: 'Operator',
          count: operatorResults.length,
          data: operatorResults
        },
        resignHistory: {
          model: 'ResignHistory',
          count: resignHistoryResults.length,
          data: resignHistoryResults
        }
      },
      summary: {
        totalRecords: 
          stepOneResults.length +
          downAdminResults.length +
          interviewResults.length +
          adminInterviewResults.length +
          operatorResults.length +
          resignHistoryResults.length,
        totalModels: 6,
        modelsWithData: [
          ...(stepOneResults.length > 0 ? ['IepInterviewStepOne'] : []),
          ...(downAdminResults.length > 0 ? ['IepInterviewDownAdmin'] : []),
          ...(interviewResults.length > 0 ? ['IepInterview'] : []),
          ...(adminInterviewResults.length > 0 ? ['AdminInterview'] : []),
          ...(operatorResults.length > 0 ? ['Operator'] : []),
          ...(resignHistoryResults.length > 0 ? ['ResignHistory'] : [])
        ]
      }
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'সার্চ করতে সমস্যা হয়েছে',
        error: error.message 
      },
      { status: 500 }
    );
  }
}

// POST method for alternative search
export async function POST(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { nidOrBirthCertificate } = body;
    
    if (!nidOrBirthCertificate) {
      return NextResponse.json(
        { success: false, message: 'NID বা Birth Certificate প্রদান করুন' },
        { status: 400 }
      );
    }

    // Search logic same as GET
    const [
      stepOneResults,
      downAdminResults,
      interviewResults,
      adminInterviewResults,
      operatorResults,
      resignHistoryResults
    ] = await Promise.all([
      IepInterviewStepOne.find({ nid: nidOrBirthCertificate }),
      IepInterviewDownAdmin.find({ 
        $or: [
          { nid: nidOrBirthCertificate },
          { 'interviewData.nid': nidOrBirthCertificate }
        ]
      }),
      IepInterview.find({ nid: nidOrBirthCertificate }),
      AdminInterview.find({ 
        $or: [
          { nid: nidOrBirthCertificate },
          { 'candidateId.nid': nidOrBirthCertificate }
        ]
      }).populate('candidateId'),
      Operator.find({ nid: nidOrBirthCertificate }),
      ResignHistory.find({ nid: nidOrBirthCertificate })
    ]);

    const responseData = {
      success: true,
      searchValue: nidOrBirthCertificate,
      results: {
        iepInterviewStepOne: {
          model: 'IepInterviewStepOne',
          count: stepOneResults.length,
          data: stepOneResults
        },
        iepInterviewDownAdmin: {
          model: 'IepInterviewDownAdmin',
          count: downAdminResults.length,
          data: downAdminResults
        },
        iepInterview: {
          model: 'IepInterview',
          count: interviewResults.length,
          data: interviewResults
        },
        adminInterview: {
          model: 'AdminInterview',
          count: adminInterviewResults.length,
          data: adminInterviewResults
        },
        operator: {
          model: 'Operator',
          count: operatorResults.length,
          data: operatorResults
        },
        resignHistory: {
          model: 'ResignHistory',
          count: resignHistoryResults.length,
          data: resignHistoryResults
        }
      },
      summary: {
        totalRecords: 
          stepOneResults.length +
          downAdminResults.length +
          interviewResults.length +
          adminInterviewResults.length +
          operatorResults.length +
          resignHistoryResults.length,
        totalModels: 6,
        modelsWithData: [
          ...(stepOneResults.length > 0 ? ['IepInterviewStepOne'] : []),
          ...(downAdminResults.length > 0 ? ['IepInterviewDownAdmin'] : []),
          ...(interviewResults.length > 0 ? ['IepInterview'] : []),
          ...(adminInterviewResults.length > 0 ? ['AdminInterview'] : []),
          ...(operatorResults.length > 0 ? ['Operator'] : []),
          ...(resignHistoryResults.length > 0 ? ['ResignHistory'] : [])
        ]
      }
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'সার্চ করতে সমস্যা হয়েছে',
        error: error.message 
      },
      { status: 500 }
    );
  }
}