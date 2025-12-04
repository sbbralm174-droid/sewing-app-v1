import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { authConfig } from '@/lib/auth';

const credentialsProvider = CredentialsProvider({
  name: 'credentials',
  credentials: {
    userId: { label: "User ID", type: "text" },
    password: { label: "Password", type: "password" }
  },
  async authorize(credentials) {
    await connectDB();
    
    const user = await User.findOne({ userId: credentials.userId });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const isPasswordValid = await user.comparePassword(credentials.password);
    
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }
    
    // ✅ Return user info for JWT
    return {
      id: user._id.toString(),
      userId: user.userId,
      name: user.name,
      isAdmin: user.isAdmin,
    };
  }
});

export const handler = NextAuth({
  ...authConfig,
  providers: [credentialsProvider],

  // 🔑 Add callbacks for JWT and session
  callbacks: {
    async jwt({ token, user }) {
      // first login
      if (user) {
        token.userId = user.userId;      // needed in middleware
        token.isAdmin = user.isAdmin;    // needed in middleware
      }
      return token;
    },
    async session({ session, token }) {
      session.user.userId = token.userId;
      session.user.isAdmin = token.isAdmin;
      return session;
    }
  }
});

export { handler as GET, handler as POST };
