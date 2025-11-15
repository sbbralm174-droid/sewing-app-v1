// // lib/auth.js
// import { auth } from '@/app/api/auth/[...nextauth]/route';

// export async function getCurrentUser() {
//   const session = await auth();
//   return session?.user;
// }

// export async function hasAccess(page) {
//   const user = await getCurrentUser();
//   if (!user) return false;
//   if (user.role === 'admin') return true;
//   return user.allowedPages?.includes(page);
// }

// export async function isAdmin() {
//   const user = await getCurrentUser();
//   return user?.role === 'admin';
// }