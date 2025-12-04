import { connectDB } from '@/lib/db';
import User from '@/models/User';

export const authConfig = {
  providers: [],
  callbacks: {
    async session({ session, token }) {
      if (token.sub) {
        await connectDB();
        const user = await User.findOne({ userId: token.sub });
        
        if (user) {
          session.user = {
            id: user._id,
            userId: user.userId,
            name: user.name,
            isAdmin: user.isAdmin,
          };
        }
      }
      return session;
    },
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