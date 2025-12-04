import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // 🚫 Skip permissions API to avoid infinite recursion
  if (pathname.startsWith('/api/permissions')) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  const publicRoutes = [
  '/auth/signin',
  '/auth/signup',
  '/api/auth',              // <<< important!
  '/api/auth/session',      // <<< internal NextAuth
  '/api/auth/callback',     // <<< login
  '/api/auth/signin',
  '/api/auth/signout',
];

  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }
  console.log('Authenticated user:', token);

  if (!token.isAdmin && pathname !== '/dashboard') {
    try {
      const response = await fetch(
        `${request.nextUrl.origin}/api/permissions?userId=${token.userId}`,
        { headers: { Cookie: request.headers.get('cookie') || '' } }
      );

      if (response.ok) {
        const { permissions } = await response.json();
        const hasAccess = permissions.some(p => pathname.startsWith(p.path));

        if (!hasAccess) {
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
