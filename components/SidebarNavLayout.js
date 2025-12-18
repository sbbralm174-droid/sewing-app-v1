'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import io from 'socket.io-client';

const SOCKET_SERVER_URL = "http://localhost:3000";

// --- Notifications Dropdown Component ---
function NotificationsDropdown({ notifications, isLoading, error }) {
  if (isLoading) {
    return (
      <div className="absolute right-0 mt-2 w-72 md:w-80 bg-white border border-gray-200 shadow-xl rounded-lg p-4 z-50 transform origin-top-right animate-fadeIn">
        <p className="text-gray-500 text-sm">Loading notifications...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="absolute right-0 mt-2 w-72 md:w-80 bg-white border border-red-200 shadow-xl rounded-lg p-4 z-50 transform origin-top-right animate-fadeIn">
        <p className="text-red-600 text-sm">Error fetching notifications.</p>
      </div>
    );
  }
  
  return (
    <div className="absolute right-0 mt-2 w-72 md:w-96 bg-white border border-gray-200 shadow-xl rounded-lg max-h-96 overflow-y-auto z-50 transform origin-top-right animate-fadeIn">
      <h3 className="text-lg font-bold p-4 border-b text-gray-700 sticky top-0 bg-white z-10">
        🚨 Service Notifications
      </h3>
      {notifications.length === 0 ? (
        <p className="text-gray-500 text-sm p-4">No new notifications 🎉</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {notifications.map((n) => (
            <li key={n._id || `${n.uniqueId}-${n.partName}-${n.date}`} className="p-4 hover:bg-gray-50 transition duration-150">
              <p className="text-sm font-semibold text-red-600 mb-1">
                {n.message}
              </p>
              <div className="flex justify-between items-center text-xs text-gray-600 mb-2">
                <span className="font-medium">
                  Part: <span className="text-gray-900">{n.partName}</span>
                </span>
                <span>Machine: {n.uniqueId}</span>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">
                  {new Date(n.date).toLocaleString()}
                </p>
                <Link href={`/admin/servicing/${n.uniqueId}?partName=${encodeURIComponent(n.partName)}`}>
                  <button
                    className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs transition duration-150 ease-in-out shadow-md"
                  >
                    View Service
                  </button>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Helper function to group permissions by category
const groupPermissionsByCategory = (permissions) => {
  const grouped = {
    admin: [],
    supervisor: [],
    reports: [],
    other: []
  };

  permissions.forEach(permission => {
    const { path, name } = permission;
    
    if (path.startsWith('/admin')) {
      if (path.includes('/reports') || path.includes('/report')) {
        grouped.reports.push(permission);
      } else {
        grouped.admin.push(permission);
      }
    } else if (path.startsWith('/supervisor')) {
      grouped.supervisor.push(permission);
    } else if (path.startsWith('/reports')) {
      grouped.reports.push(permission);
    } else {
      grouped.other.push(permission);
    }
  });

  return grouped;
};

// ----------------------------------------------------
// --- Main FloatingLayout Component ---
export default function FloatingLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const [notifications, setNotifications] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const pathname = usePathname();
  const notifRef = useRef(null);

  // Scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch permissions from API
  useEffect(() => {
    //console.log("🛠️ Fetching permissions...");
    fetch("/api/permissions")
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch permissions');
        return res.json();
      })
      .then((data) => {
        // console.log("✅ Permissions loaded:", data.permissions);
        setPermissions(data.permissions || []);
      })
      .catch((err) => {
        console.error("❌ Failed to fetch permissions:", err);
        setError(err.message);
      });
  }, []);

  // Fetch notifications from API (Initial Load)
  useEffect(() => {
   // console.log("🛠️ Initial fetch of notifications started.");
    fetch("/api/socket")
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        const notifData = Array.isArray(data) ? data : data.notifications || [];
        setNotifications(notifData);
        // console.log(`🎉 Initial notifications loaded: ${notifData.length} items.`);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("❌ Failed to fetch notifications:", err);
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

  // Socket.IO Live Update Setup
  useEffect(() => {
    let socket;
    try {
      socket = io(SOCKET_SERVER_URL);

      socket.on('connect', () => {
      //  console.log("🟢 Socket Client Connected for Live Updates:", socket.id);
      });
      
      socket.on('notifications-deleted', (payload) => {
        console.log("🔔 Socket Event Received: notifications-deleted");
        console.log("Payload:", payload);
        
        const { uniqueId, partName } = payload;
        
        setNotifications(prevNotifications => {
          const newNotifications = prevNotifications.filter(n => 
            !(n.uniqueId === uniqueId && n.partName === partName)
          );
          console.log(`✨ Live Update: ${payload.deletedCount} notifications for machine ${uniqueId} part ${partName} removed from UI.`);
          return newNotifications;
        });
      });

      socket.on('new-notification', (newNotif) => {
        console.log("🌟 Socket Event Received: new-notification", newNotif);
        setNotifications(prev => {
          if (prev.some(n => n._id === newNotif._id)) return prev;
          return [newNotif, ...prev];
        });
      });
      
      socket.on('disconnect', () => {
        console.log("🔴 Socket Client Disconnected.");
      });

      return () => {
        socket.disconnect();
        console.log("🧹 Socket client connection cleaned up on component unmount.");
      };
    } catch (error) {
      console.error("❌ Error setting up Socket.IO connection:", error);
    }
    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notifRef]);

  // Group permissions for sidebar menu
  const groupedPermissions = groupPermissionsByCategory(permissions);

  // Create dynamic menu items from permissions
  const menuItems = [
    {
      name: 'Admin',
      icon: '🚀',
      href: '/admin',
      submenu: groupedPermissions.admin.map(perm => ({
        name: perm.name,
        icon: '📋',
        href: perm.path
      }))
    },
    {
      name: 'Supervisor',
      icon: '👥',
      href: '/supervisor',
      submenu: groupedPermissions.supervisor.map(perm => ({
        name: perm.name,
        icon: '👤',
        href: perm.path
      }))
    },
    {
      name: 'Reports',
      icon: '📊',
      href: '/reports',
      submenu: groupedPermissions.reports.map(perm => ({
        name: perm.name,
        icon: '📈',
        href: perm.path
      }))
    }
  ];

  // Add standalone permissions (non-grouped) as individual menu items
  const standaloneItems = groupedPermissions.other.map(perm => ({
    name: perm.name,
    icon: '🔗',
    href: perm.path,
    submenu: []
  }));

  // Combine menu items with standalone items
  const allMenuItems = [...menuItems, ...standaloneItems];

  const navItems = [
    { name: 'Home', href: '/dashboard' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
    { name: 'Features', href: '/features' },
  ];

  const [openSubmenus, setOpenSubmenus] = useState({});

  const toggleSubmenu = (index) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const isActiveLink = (href) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  // Filter out empty categories
  const filteredMenuItems = allMenuItems.filter(item => 
    item.submenu.length > 0 || item.href
  );

  return (
    <>
      {/* Navbar - Full Width Top - No Border Radius */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-lg shadow-xl border-b border-gray-200/50' 
          : 'bg-white/90 backdrop-blur-md border-b border-gray-200/30'
        }`}>
        <div className="px-6 py-3">
          <div className="flex justify-between items-center">
            {/* Left side - Menu button and logo */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-md bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-200/50"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <Link href="/" className="flex items-center">
                <div className="relative w-32 h-8 md:w-40 md:h-10">
                  <div className="hidden text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Your Logo
                  </div>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation & Actions */}
            <div className="flex items-center space-x-4">
              {/* Desktop Nav Items */}
              <div className="hidden lg:flex items-center space-x-8">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`font-medium transition-colors duration-300 relative group text-sm ${
                      isActiveLink(item.href)
                        ? 'text-blue-600'
                        : 'text-gray-700 hover:text-blue-600'
                    }`}
                  >
                    {item.name}
                    <span className={`absolute bottom-0 left-0 h-0.5 bg-blue-600 transition-all duration-300 ${
                      isActiveLink(item.href) ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}></span>
                  </Link>
                ))}
              </div>
              
              {/* Notification Bell Icon */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-200/50 relative"
                >
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-2.805A20.088 20.088 0 0018 10.5V6a2 2 0 00-2-2H8a2 2 0 00-2 2v4.5a20.088 20.088 0 00-1.595 4.695L4 17h5m6 0v2a2 2 0 01-2 2H11a2 2 0 01-2-2v-2m6 0H9" />
                  </svg>
                  
                  {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                      {notifications.length}
                    </span>
                  )}
                </button>
                
                {isNotificationsOpen && (
                  <NotificationsDropdown 
                    notifications={notifications} 
                    isLoading={isLoading} 
                    error={error} 
                  />
                )}
              </div>
              
              {/* Mobile Menu Button */}
              <div className="lg:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 rounded-md bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-200/50"
                >
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden mt-4 pb-4 border-t border-gray-200/50 pt-4">
              <div className="flex flex-col space-y-3">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`font-medium transition-colors duration-300 py-2 px-3 rounded-md hover:bg-blue-50 text-sm ${
                      isActiveLink(item.href)
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Dynamic Sidebar based on permissions */}
      <div className={`fixed left-0 z-40 transition-all duration-500 ease-in-out ${
        isSidebarOpen 
          ? 'translate-x-0 opacity-100 top-16' 
          : '-translate-x-full opacity-0 top-16'
        } h-[calc(100vh-4rem)]`}>
        <div className="w-64 h-full bg-white/95 backdrop-blur-lg shadow-2xl border-r border-gray-200/50 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-gray-200/50">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                U
              </div>
              <div>
                <p className="font-semibold text-gray-800">User Name</p>
                <p className="text-sm text-gray-600">Member Of GMS Family</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <nav className="p-4 space-y-1">
              {filteredMenuItems.map((item, index) => (
                <div key={`${item.name}-${index}`}>
                  {item.submenu && item.submenu.length > 0 ? (
                    <>
                      <button
                        onClick={() => toggleSubmenu(index)}
                        className={`w-full flex items-center justify-between p-3 transition-all duration-300 hover:bg-gray-100 hover:shadow-md ${
                          isActiveLink(item.href) ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{item.icon}</span>
                          <span className="font-medium text-sm">{item.name}</span>
                        </div>
                        <svg 
                          className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${
                            openSubmenus[index] ? 'rotate-180' : ''
                          }`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {openSubmenus[index] && (
                        <div className="ml-8 mt-1 space-y-1 animate-fadeIn">
                          {item.submenu.map((subItem, subIndex) => (
                            <Link
                              key={`${subItem.name}-${subIndex}`}
                              href={subItem.href}
                              className={`flex items-center space-x-3 p-2 transition-all duration-300 hover:bg-blue-50 text-sm ${
                                isActiveLink(subItem.href) 
                                  ? 'text-blue-600 bg-blue-50' 
                                  : 'text-gray-600 hover:text-blue-600'
                              }`}
                              style={{ animationDelay: `${subIndex * 100}ms` }}
                            >
                              <span className="text-sm">{subItem.icon}</span>
                              <span>{subItem.name}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      className={`flex items-center space-x-3 p-3 transition-all duration-300 hover:bg-gray-100 hover:shadow-md ${
                        isActiveLink(item.href) ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="font-medium text-sm">{item.name}</span>
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </div>

          <div className="p-4 border-t border-gray-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 border border-gray-200/50">
              <p className="text-xs text-gray-600 text-center">
                Need assistance? <br />
                <Link href="/support" className="text-blue-600 font-medium hover:underline text-sm">
                  Contact Support
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  )
}