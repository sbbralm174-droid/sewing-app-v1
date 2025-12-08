import { connectDB } from '@/lib/db';
import User from '@/models/User';

export const authConfig = {
  providers: [],
  callbacks: {
    async session({ session, token }) {
  // default user fields extend বা overwrite করা
  session.user = {
    userId: token.userId,
    isAdmin: token.isAdmin,
    name: token.name || null,
    email: token.email || null,
    image: token.picture || null,
  };
  return session;
}
,
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.userId;
      }
      return token;
    },
  },
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
  },
};