import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

export async function GET(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    console.log('🔥 API token:', token);

    if (!token?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const users = await User.find({}, 'userId name isAdmin createdAt').sort({ createdAt: -1 });

    return NextResponse.json({
      users: users.map(u => ({
        userId: u.userId,
        name: u.name,
        isAdmin: u.isAdmin,
        createdAt: u.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
