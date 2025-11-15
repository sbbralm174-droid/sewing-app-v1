// // app/api/admin/users/route.js (updated)
// import { getServerSession } from 'next-auth';
// import { authOptions } from '../../auth/[...nextauth]/route';
// import User from '@/models/User';
// import { connectDB } from "@/lib/db";

// export async function GET() {
//   const session = await getServerSession(authOptions);
  
//   if (session?.user?.role !== 'admin') {
//     return new Response('Unauthorized', { status: 401 });
//   }

//   await connectDB();
//   const users = await User.find({}).select('-password');
//   return Response.json(users);
// }

// export async function PUT(request) {
//   const session = await getServerSession(authOptions);
  
//   if (session?.user?.role !== 'admin') {
//     return new Response('Unauthorized', { status: 401 });
//   }

//   const { userId, allowedPages } = await request.json();
  
//   await connectDB();
//   await User.findByIdAndUpdate(userId, { allowedPages });
  
//   return Response.json({ success: true });
// }

// export async function DELETE(request) {
//   const session = await getServerSession(authOptions);
  
//   if (session?.user?.role !== 'admin') {
//     return new Response('Unauthorized', { status: 401 });
//   }

//   const { searchParams } = new URL(request.url);
//   const userId = searchParams.get('id');
  
//   if (!userId) {
//     return new Response('User ID required', { status: 400 });
//   }

//   await connectDB();
  
//   // Prevent admin from deleting themselves
//   if (session.user.id === userId) {
//     return new Response('Cannot delete your own account', { status: 400 });
//   }

//   await User.findByIdAndDelete(userId);
  
//   return Response.json({ success: true });
// }