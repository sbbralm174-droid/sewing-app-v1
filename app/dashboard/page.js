import '@/styles/dashboard.css';
import SidebarNavLayout from '@/components/SidebarNavLayout';

export default function Dashboard() {
  // Dummy data for the dashboard
  const dashboardData = {
    stats: {
      totalOrders: 1247,
      productionInProgress: 342,
      completedToday: 89,
      pendingShipments: 56
    },
    productionProgress: [
      { stage: 'Shapla', progress: 85, color: 'bg-blue-500' },
      { stage: 'Poddo', progress: 65, color: 'bg-green-500' },
      { stage: 'Kodom', progress: 45, color: 'bg-yellow-500' },
      { stage: 'Belly', progress: 30, color: 'bg-purple-500' },
      { stage: 'Packing', progress: 25, color: 'bg-red-500' }
    ],
    recentOrders: [
      { id: 'ORD-001', customer: 'Fashion Hub', items: 1200, status: 'Processing', date: '2024-01-15' },
      { id: 'ORD-002', customer: 'Style Mart', items: 800, status: 'Completed', date: '2024-01-14' },
      { id: 'ORD-003', customer: 'Trendy Wear', items: 1500, status: 'Delayed', date: '2024-01-13' },
      { id: 'ORD-004', customer: 'Elite Fashion', items: 600, status: 'Processing', date: '2024-01-12' },
      { id: 'ORD-005', customer: 'Urban Style', items: 900, status: 'Pending', date: '2024-01-11' }
    ],
    inventory: {
      fabric: { current: 12500, threshold: 5000, unit: 'meters' },
      thread: { current: 850, threshold: 200, unit: 'cones' },
      buttons: { current: 25000, threshold: 10000, unit: 'pieces' },
      zippers: { current: 4500, threshold: 2000, unit: 'pieces' }
    },
    quickActions: [
      { title: 'New Order', icon: '📋', color: 'bg-blue-100 text-blue-600' },
      { title: 'Production', icon: '🏭', color: 'bg-green-100 text-green-600' },
      { title: 'Inventory', icon: '📦', color: 'bg-yellow-100 text-yellow-600' },
      { title: 'Reports', icon: '📊', color: 'bg-purple-100 text-purple-600' }
    ]
  };

  const getStatusClass = (status) => {
    switch(status.toLowerCase()) {
      case 'completed': return 'status-completed';
      case 'processing': return 'status-processing';
      case 'pending': return 'status-pending';
      case 'delayed': return 'status-delayed';
      default: return 'status-pending';
    }
  };

  return (
    <div className="min-h-screen bg-indigo-500 p-6">
        <SidebarNavLayout/>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Garments ERP Dashboard</h1>
        <p className="text-gray-600 mt-2"> </p>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Orders</p>
              <h3 className="text-2xl font-bold mt-1">{dashboardData.stats.totalOrders}</h3>
            </div>
            <div className="text-2xl">📦</div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-blue-100 text-sm">
              <span>↑ 12% from last month</span>
            </div>
          </div>
        </div>

        <div className="stat-card production-progress">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-100 text-sm">In Production</p>
              <h3 className="text-2xl font-bold mt-1">{dashboardData.stats.productionInProgress}</h3>
            </div>
            <div className="text-2xl">🏭</div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-pink-100 text-sm">
              <span>3 lines active</span>
            </div>
          </div>
        </div>

        <div className="stat-card order-status">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-100 text-sm">Completed Today</p>
              <h3 className="text-2xl font-bold mt-1">{dashboardData.stats.completedToday}</h3>
            </div>
            <div className="text-2xl">✅</div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-cyan-100 text-sm">
              <span>98% quality passed</span>
            </div>
          </div>
        </div>

        <div className="stat-card inventory-level">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Pending Shipment</p>
              <h3 className="text-2xl font-bold mt-1">{dashboardData.stats.pendingShipments}</h3>
            </div>
            <div className="text-2xl">🚚</div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-green-100 text-sm">
              <span>2 urgent shipments</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Production Progress */}
        <div className="chart-container lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Production Line Progress</h2>
          <div className="space-y-4">
            {dashboardData.productionProgress.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{item.stage}</span>
                  <span>{item.progress}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className={`progress-fill ${item.color}`}
                    style={{ width: `${item.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-action">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            {dashboardData.quickActions.map((action, index) => (
              <button
                key={index}
                className={`p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-gray-300 transition-all duration-200 flex flex-col items-center justify-center ${action.color}`}
              >
                <span className="text-2xl mb-2">{action.icon}</span>
                <span className="text-sm font-medium">{action.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="recent-activity">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Orders</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 text-sm font-medium text-gray-600">Order ID</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-600">Customer</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-600">Items</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.recentOrders.map((order, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 text-sm font-medium text-gray-900">{order.id}</td>
                    <td className="py-3 text-sm text-gray-600">{order.customer}</td>
                    <td className="py-3 text-sm text-gray-600">{order.items}</td>
                    <td className="py-3">
                      <span className={`status-badge ${getStatusClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inventory Status */}
        <div className="chart-container">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Inventory Status</h2>
          <div className="space-y-4">
            {Object.entries(dashboardData.inventory).map(([item, data]) => {
              const percentage = (data.current / (data.threshold * 2)) * 100;
              const isLow = data.current < data.threshold * 1.2;
              
              return (
                <div key={item} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700 capitalize">{item}</span>
                    <span className={`font-semibold ${isLow ? 'text-red-600' : 'text-gray-600'}`}>
                      {data.current.toLocaleString()} {data.unit}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill ${isLow ? 'bg-red-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Threshold: {data.threshold.toLocaleString()} {data.unit}
                    {isLow && <span className="text-red-500 ml-2">● Low Stock</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}