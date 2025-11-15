import { connectDB } from '@/lib/db';
import Operator from '@/models/Operator';

export async function POST(request) {
  try {
    await connectDB();
    const { searchTerm } = await request.json();

    if (!searchTerm) {
      return Response.json({ error: 'Search term is required' }, { status: 400 });
    }

    // Search by operatorId or name
    const operators = await Operator.find({
      $or: [
        { operatorId: { $regex: searchTerm, $options: 'i' } },
        { name: { $regex: searchTerm, $options: 'i' } }
      ]
    }).select('name operatorId designation grade');

    return Response.json({ operators });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}