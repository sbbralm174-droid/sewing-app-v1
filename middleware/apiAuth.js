// middleware/apiAuth.js
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import Permission from '@/models/Permission';
import { connectDB } from '@/lib/db';

export async function apiAuthMiddleware(req) {
  try {
    // Connect to database
    await connectDB();
    
    // Get the token
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get user permissions
    const permission = await Permission.findOne({ 
      userId: token.userId 
    });
    
    const currentPath = req.nextUrl.pathname;
    const method = req.method;
    
    // Check if user has access to this API
    if (permission?.allowedApis) {
      const hasAccess = permission.allowedApis.some(api => 
        api.method === method && 
        currentPath.startsWith(api.path.replace(/:\w+/g, '[^/]+'))
      );
      
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'API access denied' },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.next();
  } catch (error) {
    console.error('API auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Usage in API routes:
/*
import { apiAuthMiddleware } from '@/middleware/apiAuth';

export async function middleware(req) {
  return apiAuthMiddleware(req);
}

export const config = {
  matcher: '/api/:path*'
};
*/