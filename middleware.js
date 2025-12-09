import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Skip permissions API itself
  if (pathname.startsWith('/api/permissions')) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const publicRoutes = [
    '/auth/signin',
    '/auth/signup',
    '/auth/signout',
    '/api/auth',
    '/api/auth/session',
    '/api/auth/callback',
    '/api/auth/signin',
    '/api/auth/signout',
    '/api/users/list',
  ];

  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  if (!token.isAdmin && pathname !== '/dashboard') {
    try {
      const response = await fetch(
        `${request.nextUrl.origin}/api/permissions?userId=${token.userId}`,
        { headers: { Cookie: request.headers.get('cookie') || '' } }
      );

      if (response.ok) {
        const { permissions, allowedApis } = await response.json();

        // Page access check
        const hasPageAccess = permissions.some(p => pathname.startsWith(p.path));

        // API access check (যদি URL /api/ দিয়ে শুরু হয়)
        const isApiRoute = pathname.startsWith('/api/');
        let hasApiAccess = true; // default true for non-api

        if (isApiRoute) {
          hasApiAccess = allowedApis.some(api => pathname.startsWith(api.path));
        }

        if ((!hasPageAccess && !isApiRoute) || (isApiRoute && !hasApiAccess)) {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }
    } catch (error) {
      console.error('Permission check error:', error);
    }
  }

  return NextResponse.next();
}


export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
