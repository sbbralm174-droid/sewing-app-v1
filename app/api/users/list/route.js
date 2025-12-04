import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    await connectDB();
    
    const users = await User.find({}, 'userId name isAdmin createdAt')
      .sort({ createdAt: -1 });
    
    return NextResponse.json({
      users: users.map(user => ({
        userId: user.userId,
        name: user.name,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}