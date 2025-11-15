// // components/UserManagement.js (updated)
// 'use client';
// import { useState, useEffect } from 'react';
// import Link from 'next/link';

// const availablePages = ['profile', 'settings', 'reports', 'analytics', 'billing'];

// export default function UserManagement() {
//   const [users, setUsers] = useState([]);
//   const [selectedUser, setSelectedUser] = useState(null);

//   useEffect(() => {
//     fetchUsers();
//   }, []);

//   const fetchUsers = async () => {
//     const res = await fetch('/api/admin/users');
//     const data = await res.json();
//     setUsers(data);
//   };

//   const updateUserPages = async (userId, allowedPages) => {
//     await fetch('/api/admin/users', {
//       method: 'PUT',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ userId, allowedPages })
//     });
//     fetchUsers();
//   };

//   const deleteUser = async (userId) => {
//     if (!confirm('Are you sure you want to delete this user?')) return;

//     await fetch(`/api/admin/users?id=${userId}`, {
//       method: 'DELETE'
//     });
//     fetchUsers();
//   };

//   const togglePageAccess = (page) => {
//     if (!selectedUser) return;

//     const newAllowedPages = selectedUser.allowedPages.includes(page)
//       ? selectedUser.allowedPages.filter(p => p !== page)
//       : [...selectedUser.allowedPages, page];

//     setSelectedUser({ ...selectedUser, allowedPages: newAllowedPages });
//     updateUserPages(selectedUser._id, newAllowedPages);
//   };

//   return (
//     <div className="space-y-6">
//       {/* Header with Create Button */}
//       <div className="flex justify-between items-center">
//         <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
//         <Link
//           href="/admin/create-user"
//           className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
//         >
//           Create New User
//         </Link>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* User List */}
//         <div className="bg-white p-6 rounded-lg shadow">
//           <h3 className="text-xl font-semibold mb-4">Users</h3>
//           <div className="space-y-3">
//             {users.map(user => (
//               <div
//                 key={user._id}
//                 className={`p-3 border rounded-lg ${
//                   selectedUser?._id === user._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
//                 }`}
//               >
//                 <div className="flex justify-between items-start">
//                   <div 
//                     className="flex-1 cursor-pointer"
//                     onClick={() => setSelectedUser(user)}
//                   >
//                     <p className="font-medium">{user.name}</p>
//                     <p className="text-sm text-gray-600">{user.email}</p>
//                     <div className="flex items-center mt-1 space-x-2">
//                       <span className={`px-2 py-1 text-xs rounded-full ${
//                         user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
//                       }`}>
//                         {user.role}
//                       </span>
//                       {user.role === 'user' && (
//                         <span className="text-xs text-gray-500">
//                           {user.allowedPages?.length || 0} pages
//                         </span>
//                       )}
//                     </div>
//                   </div>
//                   <button
//                     onClick={() => deleteUser(user._id)}
//                     className="text-red-600 hover:text-red-800 text-sm font-medium"
//                   >
//                     Delete
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Page Access Management */}
//         <div className="bg-white p-6 rounded-lg shadow">
//           <h3 className="text-xl font-semibold mb-4">Page Access Management</h3>
//           {selectedUser ? (
//             <div>
//               <div className="mb-4">
//                 <h4 className="text-lg font-medium">{selectedUser.name}</h4>
//                 <p className="text-sm text-gray-600">{selectedUser.email}</p>
//               </div>
              
//               {selectedUser.role === 'admin' ? (
//                 <p className="text-gray-500">Admin users have access to all pages.</p>
//               ) : (
//                 <div>
//                   <p className="text-sm text-gray-600 mb-3">Select pages this user can access:</p>
//                   <div className="grid grid-cols-2 gap-3">
//                     {availablePages.map(page => (
//                       <label key={page} className="flex items-center space-x-2 p-2 border border-gray-200 rounded-md hover:bg-gray-50">
//                         <input
//                           type="checkbox"
//                           checked={selectedUser.allowedPages.includes(page)}
//                           onChange={() => togglePageAccess(page)}
//                           className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
//                         />
//                         <span className="capitalize text-sm">{page}</span>
//                       </label>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>
//           ) : (
//             <p className="text-gray-500">Select a user to manage page access</p>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }