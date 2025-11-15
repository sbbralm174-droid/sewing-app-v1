'use client';

import { useState } from 'react';
import SidebarNavLayout from '@/components/SidebarNavLayout';

export default function ProductionPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totals, setTotals] = useState({ 
    totalTarget: 0, 
    totalAchievement: 0,
    totalDays: 0
  });

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/supervisor-report?startDate=${startDate}&endDate=${endDate}&supervisor=${supervisor}`
      );
      const result = await res.json();
      console.log('API Response:', result);

      // 🎯 FIX APPLIED HERE:
      // Access the actual array of records using 'result.data'
      // because the API returns an object: { data: [...], success: true, ... }
      const records = Array.isArray(result.data) ? result.data : [];
      setData(records);

      // Calculate totals and unique days
      const uniqueDates = new Set();
      const calculatedTotals = records.reduce((acc, item) => {
        acc.totalTarget += Number(item.totalTarget) || 0;
        acc.totalAchievement += Number(item.totalAchievement) || 0;
        
        // Count unique dates
        if (item.date) {
          uniqueDates.add(item.date);
        }
        
        return acc;
      }, { totalTarget: 0, totalAchievement: 0 });

      calculatedTotals.totalDays = uniqueDates.size;

      setTotals(calculatedTotals);

    } catch (error) {
      console.error('Search error:', error);
      setData([]);
      setTotals({ totalTarget: 0, totalAchievement: 0, totalDays: 0 });
    }
    setLoading(false);
  };

  return (
    <div className="p-4">
      <SidebarNavLayout />
      <h1 className="text-xl font-bold mb-4">Production Report</h1>

      <div className="flex gap-4 mb-4">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border px-2 py-1 rounded"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border px-2 py-1 rounded"
        />
        <input
          type="text"
          placeholder="Supervisor Name or ID"
          value={supervisor}
          onChange={(e) => setSupervisor(e.target.value)}
          className="border px-2 py-1 rounded"
        />
        <button 
          onClick={handleSearch} 
          className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
        >
          Search
        </button>
      </div>

      {/* Total Summary Section */}
      {!loading && data.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-blue-800 mb-3">Production Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <h3 className="text-sm font-medium text-gray-500">Total Days</h3>
              <p className="text-2xl font-bold text-blue-600">{totals.totalDays}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <h3 className="text-sm font-medium text-gray-500">Total Target</h3>
              <p className="text-2xl font-bold text-orange-600">{totals.totalTarget.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <h3 className="text-sm font-medium text-gray-500">Total Achievement</h3>
              <p className="text-2xl font-bold text-green-600">{totals.totalAchievement.toLocaleString()}</p>
            </div>
            


          </div>
          
          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-3">
            
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <h3 className="text-sm font-medium text-gray-500">Efficiency Rate</h3>
              <p className="text-xl font-bold text-purple-600">
                {totals.totalTarget > 0 
                  ? `${((totals.totalAchievement / totals.totalTarget) * 100).toFixed(2)}%`
                  : '0%'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {loading && <p className="text-blue-600">Loading...</p>}

      {!loading && data.length === 0 && (
        <p className="text-gray-500">No data found. Try a different search.</p>
      )}

      {!loading && data.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supervisor
                </th>
                <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Achievement
                </th>
                <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Efficiency
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.date || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.supervisor || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.totalTarget ? item.totalTarget.toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.totalAchievement ? item.totalAchievement.toLocaleString() : '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {item.totalTarget > 0 ? (
                      <span className={`font-medium ${
                        (item.totalAchievement / item.totalTarget) >= 1 
                          ? 'text-green-600' 
                          : (item.totalAchievement / item.totalTarget) >= 0.8 
                            ? 'text-yellow-600' 
                            : 'text-red-600'
                      }`}>
                        {((item.totalAchievement / item.totalTarget) * 100).toFixed(2)}%
                      </span>
                    ) : (
                      'N/A'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}