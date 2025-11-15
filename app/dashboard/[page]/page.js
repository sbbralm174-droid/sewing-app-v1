// // app/dashboard/[page]/page.js
// import ProtectedRoute from '@/components/ProtectedRoute';

// export default function DashboardPage({ params }) {
//   return (
//     <ProtectedRoute requiredPage={params.page}>
//       <div className="p-6">
//         <h1 className="text-2xl font-bold capitalize">{params.page} Page</h1>
//         <p className="mt-4">Welcome to your {params.page} page!</p>
//       </div>
//     </ProtectedRoute>
//   );
// }