// app/api/iep-interview/search/route.js
import VivaInterview from '@/models/IepInterview';
import { connectDB } from '@/lib/db';

export async function POST(req) {
  try {
    await connectDB();

    const { searchTerm } = await req.json();

    if (!searchTerm || searchTerm.trim() === '') {
      return Response.json({ error: 'Search term is required' }, { status: 400 });
    }

    // Search by candidateId, nid, or birthCertificate
    const searchQuery = {
      $or: [
        { candidateId: { $regex: searchTerm, $options: 'i' } },
        { nid: { $regex: searchTerm, $options: 'i' } },
        { birthCertificate: { $regex: searchTerm, $options: 'i' } },
        { name: { $regex: searchTerm, $options: 'i' } } // Added name search
      ]
    };

    const candidates = await VivaInterview.find(searchQuery)
      .select('candidateId name nid birthCertificate interviewDate department result')
      .sort({ createdAt: -1 })
      .limit(20);

    return Response.json({
      success: true,
      data: candidates,
      count: candidates.length
    });

  } catch (error) {
    console.error('Search error:', error);
    return Response.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}