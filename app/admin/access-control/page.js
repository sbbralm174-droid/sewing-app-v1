'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UI_API_MAPPING, getApisForPage, getApisForPages } from '@/utils/uiApiMapping';

// Define all available pages in the system
const ALL_PAGES = [
  { path: '/admin', name: 'Admin Dashboard' },
  { path: '/admin/floor', name: 'Add Floor' },
  { path: '/admin/floor-lines', name: 'Floor Lines' },
  { path: '/admin/buyers', name: 'Buyers' },
  { path: '/admin/machine-types', name: 'Machine Types' },
  { path: '/admin/machines', name: 'Machines' },
  { path: '/admin/operators', name: 'Operators' },
  { path: '/admin/operators/update', name: 'Operator Update' },
  { path: '/admin/iep-interview/1st-step', name: 'Security' },
  { path: '/admin/iep-interview/2nd-step', name: 'Down Admin' },
  { path: '/admin/iep-interview/3rd-step', name: 'IEP' },
  { path: '/admin/iep-interview/3rd-step/search-assessment', name: 'Update IEP Assessment' },
  { path: '/admin/iep-interview/4th-step', name: 'Admin Interview' },
  { path: '/admin/iep-interview/report-table', name: 'Interview Tracker' },
  { path: '/admin/supervisors', name: 'Supervisors' },
  { path: '/admin/security-search', name: 'Security Search' },
  { path: '/admin/resign', name: 'Resign' },
  { path: '/admin/defects/search', name: 'Defects Search' },
  { path: '/admin/defects', name: 'Defects' },



  { path: '/operator-assessment', name: 'Operator Assessment' },
  { path: '/supervisor', name: 'Supervisor Dashboard' },
  { path: '/supervisor/processes', name: 'Add Process' },
  { path: '/supervisor/daily-production-by-qrcode', name: 'Daily Production' },
  { path: '/supervisor/update-pro', name: 'Hourly Production Entry' },
  { path: '/supervisor/line-completion', name: 'Line Completion' },
  { path: '/supervisor/delete-daily-production-entry', name: 'Delete Daily Production Entry' },
  { path: '/reports/heighest-process-score', name: 'Highest Process Score' },
  { path: '/reports/top-process-scorer', name: 'Top Process Scorer' },
  { path: '/admin/occurrence-report/search', name: 'Occurrence Report' },
  { path: '/reports/operator-work', name: 'Line Wise Working Days' },
  { path: '/reports/line-report', name: 'Line Report' },
  { path: '/reports/machine-report', name: 'Machine Report' },
  { path: '/reports/machine-last-location-02', name: 'Machine Last Location' },
  { path: '/reports/search-by-process', name: 'Search By Process' },
  { path: '/reports/supervisor-report', name: 'Supervisor Report' },
  { path: '/reports/breackdown-check-1', name: 'Breakdown Check' },
  { path: '/reports/operator-pressent-absent-report', name: 'Operator Present Absent Report' },
  { path: '/reports/floor-wise-breakdown-matching', name: 'Floor Wise Breakdown Matching' },
];

export default function AccessControl() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [userPermissions, setUserPermissions] = useState({
    pages: [],
    apis: []
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showApiDetails, setShowApiDetails] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (status === 'authenticated' && !session?.user?.isAdmin) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  // Fetch all users
  useEffect(() => {
    if (session?.user?.isAdmin) {
      fetchUsers();
    }
  }, [session]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users/list');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleUserSelect = async (userId) => {
  setSelectedUser(userId);
  setLoading(true);

  try {
    const response = await fetch(`/api/permissions?userId=${userId}`);
    if (response.ok) {
      const data = await response.json();
      setUserPermissions({
        pages: data.permissions?.map(p => p.path) || [], // ✅ normalize
        apis: data.allowedApis || []
      });
    }
  } catch (error) {
   // console.error('Error fetching permissions:', error);
  } finally {
    setLoading(false);
  }
};


  const togglePageAccess = (pagePath) => {
    setUserPermissions(prev => {
      const pageApis = getApisForPage(pagePath);
      const isAdding = !prev.pages.includes(pagePath);
      
      let newPages;
      let newApis = [...prev.apis];
      
      if (isAdding) {
        // Add page and its APIs
        newPages = [...prev.pages, pagePath];
        pageApis.forEach(api => {
          const exists = newApis.some(a => 
            a.method === api.method && a.path === api.path
          );
          if (!exists) {
            newApis.push(api);
          }
        });
      } else {
        // Remove page
        newPages = prev.pages.filter(path => path !== pagePath);
        
        // Find all APIs from remaining pages
        const remainingApis = getApisForPages(newPages);
        newApis = remainingApis;
      }
      
      return {
        pages: newPages,
        apis: newApis
      };
    });
  };

  const toggleAllPages = (grantAll) => {
    if (grantAll) {
      // Grant all pages and collect all APIs
      const allApis = getApisForPages(ALL_PAGES.map(p => p.path));
      setUserPermissions({
        pages: ALL_PAGES.map(p => p.path),
        apis: allApis
      });
    } else {
      // Remove all permissions
      setUserPermissions({
        pages: [],
        apis: []
      });
    }
  };

  const savePermissions = async () => {
    if (!selectedUser) {
      setMessage({ type: 'error', text: 'Please select a user first' });
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser,
          allowedPages: userPermissions.pages.map(path => ({
            path,
            name: ALL_PAGES.find(p => p.path === path)?.name || path,
          })),
          allowedApis: userPermissions.apis
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        
        // Auto-hide success message
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save permissions' });
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session?.user?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Access Control Panel
          </h1>
          <p className="text-gray-600 mt-2">
            Manage page and API access permissions for users
          </p>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Select User
              </h2>
              
              <div className="space-y-4">
                <select
                  value={selectedUser}
                  onChange={(e) => handleUserSelect(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">Choose a user...</option>
                  {users.map(user => (
                    <option key={user.userId} value={user.userId}>
                      {user.name} ({user.userId}) {user.isAdmin && '(Admin)'}
                    </option>
                  ))}
                </select>

                {selectedUser && (
                  <div className="mt-6 space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-medium text-blue-800 mb-2">
                        Page Permissions
                      </h3>
                      <div className="text-sm text-blue-600">
                        {userPermissions.pages.length === 0 ? (
                          <p>No pages granted yet</p>
                        ) : (
                          <ul className="space-y-1">
                            {userPermissions.pages.slice(0, 5).map((path) => (
                              <li key={path} className="truncate">
                                • {ALL_PAGES.find(p => p.path === path)?.name || path}
                              </li>
                            ))}

                            {userPermissions.pages.length > 5 && (
                              <li className="text-blue-500">
                                + {userPermissions.pages.length - 5} more...
                              </li>
                            )}
                          </ul>
                        )}
                      </div>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium text-green-800">
                          API Permissions
                        </h3>
                        <button
                          onClick={() => setShowApiDetails(!showApiDetails)}
                          className="text-sm text-green-600 hover:text-green-800"
                        >
                          {showApiDetails ? 'Hide' : 'Show'} Details
                        </button>
                      </div>
                      <div className="text-sm text-green-600">
                        <p>{userPermissions.apis.length} APIs granted</p>
                        {showApiDetails && userPermissions.apis.length > 0 && (
                          <div className="mt-2 max-h-40 overflow-y-auto">
                            {userPermissions.apis.map((api, index) => (
                              <div key={index} className="mt-1 p-2 bg-green-100 rounded text-xs">
                                <span className="font-mono bg-green-200 px-1 rounded">
                                  {api.method}
                                </span>
                                <span className="ml-2">{api.path}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => toggleAllPages(true)}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition"
                      >
                        Grant All
                      </button>
                      <button
                        onClick={() => toggleAllPages(false)}
                        className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium transition"
                      >
                        Revoke All
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Page Access Control */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  Page Access Control
                </h2>
                {selectedUser && (
                  <button
                    onClick={savePermissions}
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : 'Save Permissions'}
                  </button>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : selectedUser ? (
                <div className="space-y-4">
                  {ALL_PAGES.map((page) => {
                    const hasAccess = userPermissions.pages.includes(page.path);
                    const pageApis = getApisForPage(page.path);
                    
                    return (
                      <div
                        key={page.path}
                        className={`p-4 border rounded-lg transition ${
                          hasAccess 
                            ? 'border-blue-200 bg-blue-50' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <h3 className="font-medium text-gray-800">
                                {page.name}
                              </h3>
                              {hasAccess && (
                                <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                  {pageApis.length} APIs
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {page.path}
                            </p>
                            
                            {hasAccess && pageApis.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs font-medium text-gray-500 mb-1">
                                  Associated APIs:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {pageApis.slice(0, 3).map((api, index) => (
                                    <span 
                                      key={index}
                                      className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded"
                                    >
                                      {api.method} {api.path.split('/')[2] || api.path}
                                    </span>
                                  ))}
                                  {pageApis.length > 3 && (
                                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                      +{pageApis.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <label className="relative inline-flex items-center cursor-pointer ml-4">
                            <input
                              type="checkbox"
                              checked={hasAccess}
                              onChange={() => togglePageAccess(page.path)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <p className="text-gray-500">
                    Select a user to manage their page access permissions
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}