// app/api/security-search/route.js
import { connectDB } from '@/lib/db';
import Operator from '@/models/Operator';
import VivaInterview from '@/models/IepInterview';
import OperatorResignHistory from '@/models/OperatorResignHistory';

import IepInterviewStepOne from '@/models/IepInterviewStepOne';
import iepInterviewDownAdmin from '@/models/iepInterviewDownAdmin';
import AdminInterview from '@/models/AdminInterview';

export async function POST(request) {
  try {
    await connectDB();

    const { searchTerm } = await request.json();

    if (!searchTerm) {
      return Response.json({ error: 'Search term is required' }, { status: 400 });
    }

    // একসাথে সব collection-এ খোঁজ চালানো
    const [
      operators,
      vivaInterviews,
      resignHistory,
      stepOne,
      downAdmin,
      adminInterviews
    ] = await Promise.all([
      // Operator
      Operator.find({
        $or: [{ nid: searchTerm }, { birthCertificate: searchTerm }]
      }).lean(),

      // VivaInterview
      VivaInterview.find({
        $or: [{ nid: searchTerm }, { birthCertificate: searchTerm }]
      }).lean(),

      // OperatorResignHistory
      OperatorResignHistory.find({
        $or: [{ nid: searchTerm }, { birthCertificate: searchTerm }]
      }).lean(),

      // IepInterviewStepOne
      IepInterviewStepOne.find({
        $or: [{ nid: searchTerm }, { birthCertificate: searchTerm }]
      }).lean(),

      // iepInterviewDownAdmin
      iepInterviewDownAdmin.find({
        $or: [{ nid: searchTerm }, { birthCertificate: searchTerm }]
      }).lean(),

      // AdminInterview
      AdminInterview.find({
        $or: [{ nid: searchTerm }, { birthCertificate: searchTerm }]
      }).lean()
    ]);

    // সব ফলাফল একত্রিত করা
    const results = [
      ...operators.map(item => ({
        ...item,
        source: 'Operator',
        _id: item._id.toString()
      })),
      ...vivaInterviews.map(item => ({
        ...item,
        source: 'VivaInterview',
        _id: item._id.toString()
      })),
      ...resignHistory.map(item => ({
        ...item,
        source: 'OperatorResignHistory',
        _id: item._id.toString()
      })),
      ...stepOne.map(item => ({
        ...item,
        source: 'IepInterviewStepOne',
        _id: item._id.toString()
      })),
      ...downAdmin.map(item => ({
        ...item,
        source: 'iepInterviewDownAdmin',
        _id: item._id.toString()
      })),
      ...adminInterviews.map(item => ({
        ...item,
        source: 'AdminInterview',
        _id: item._id.toString()
      }))
    ];

    return Response.json({
      success: true,
      results,
      count: results.length
    });

  } catch (error) {
    console.error('Search error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
