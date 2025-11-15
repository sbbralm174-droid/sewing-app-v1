// // components/ProtectedRoute.js
// 'use client';
// import { useSession } from 'next-auth/react';
// import { useRouter } from 'next/navigation';
// import { useEffect } from 'react';

// export default function ProtectedRoute({ children, requiredPage, adminOnly = false }) {
//   const { data: session, status } = useSession();
//   const router = useRouter();

//   useEffect(() => {
//     if (status === 'loading') return;

//     if (!session) {
//       router.push('/auth/signin');
//       return;
//     }

//     if (adminOnly && session.user.role !== 'admin') {
//       router.push('/auth/access-denied');
//       return;
//     }

//     if (requiredPage && session.user.role !== 'admin' && 
//         !session.user.allowedPages?.includes(requiredPage)) {
//       router.push('/auth/access-denied');
//     }
//   }, [session, status, router, requiredPage, adminOnly]);

//   if (status === 'loading') {
//     return (
//       <div className="flex justify-center items-center min-h-screen">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//       </div>
//     );
//   }

//   if (!session || 
//       (adminOnly && session.user.role !== 'admin') ||
//       (requiredPage && session.user.role !== 'admin' && 
//        !session.user.allowedPages?.includes(requiredPage))) {
//     return null;
//   }

//   return children;
// }