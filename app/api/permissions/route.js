import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Permission from '@/models/Permission';
import User from '@/models/User';

// Get user permissions
export async function GET(request) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    let queryUserId = session.user.userId;
    
    // If admin is requesting specific user's permissions
    if (userId && session.user.isAdmin) {
      queryUserId = userId;
    }
    
    const permission = await Permission.findOne({ userId: queryUserId });
    
    return NextResponse.json({
      permissions: permission?.allowedPages || [],
    });
  } catch (error) {
    console.error('Get permissions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}

// Update user permissions (Admin only)
export async function POST(request) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    await connectDB();
    
    const { userId, allowedPages } = await request.json();
    
    // Check if user exists
    const user = await User.findOne({ userId });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Update or create permissions
    const permission = await Permission.findOneAndUpdate(
      { userId },
      {
        userId,
        allowedPages: allowedPages.map(page => ({
          path: page.path,
          name: page.name,
          grantedAt: new Date(),
        })),
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );
    
    return NextResponse.json({
      message: 'Permissions updated successfully',
      permissions: permission.allowedPages,
    });
  } catch (error) {
    console.error('Update permissions error:', error);
    return NextResponse.json(
      { error: 'Failed to update permissions' },
      { status: 500 }
    );
  }
}