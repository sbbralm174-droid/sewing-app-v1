'use client';

import { useEffect, useState } from 'react';

export default function LineSummaryPage() {
  const [date, setDate] = useState('2025-12-25');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/line-summery-report?date=${date}`);
      const json = await res.json();
      
      // API থেকে আসা ডেটাতে production প্রোপার্টি যোগ করা হচ্ছে যাতে ইনপুট হ্যান্ডেল করা যায়
      const updatedData = (json.data || []).map(item => ({
        ...item,
        production: 0 // ইনিশিয়াল প্রোডাকশন ০
      }));
      setData(updatedData);
    } catch (error) {
      console.error(error);
      alert('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  // প্রোডাকশন ইনপুট চেঞ্জ হ্যান্ডেলার
  const handleProductionChange = (index, value) => {
    const newData = [...data];
    newData[index].production = Number(value);
    setData(newData);
  };

  // ক্যালকুলেশন ফাংশন
  const calculateMetrics = (row) => {
    const { production, totalSmv, totalManpower, avgWorkingHour, npt } = row;
    const smv = totalSmv || 0;
    const manpower = totalManpower || 0;
    const workingHour = avgWorkingHour || 0;
    const nptVal = npt || 0;

    const commonDenominator = manpower * workingHour * 60;

    // Efficiency Calculation
    const efficiency = commonDenominator > 0 
      ? ((production * smv) / commonDenominator) * 100 
      : 0;

    // Performance Calculation (Denominator minus NPT)
    const perfDenominator = commonDenominator - nptVal;
    const performance = perfDenominator > 0 
      ? ((production * smv) / perfDenominator) * 100 
      : 0;

    return {
      efficiency: efficiency.toFixed(2),
      performance: performance.toFixed(2)
    };
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 border-b pb-2 border-gray-200 dark:border-gray-700">
          Line Wise Production Summary & NPT Report
        </h1>

        <div className="flex items-center gap-4 mb-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex flex-col">
            <label className="text-xs font-semibold uppercase text-gray-500 mb-1">Select Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <button
            onClick={fetchReport}
            className="mt-5 bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load Report'}
          </button>
        </div>

        <div className="overflow-x-auto border rounded-lg border-gray-300 dark:border-gray-700 shadow-md">
          <table className="min-w-full text-sm border-collapse bg-white dark:bg-gray-800">
            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
              <tr>
                {[
                  'Line', 'Buyer', 'Style', 'SMV', 'Manpower', 'Working Hr', 'NPT (Sec)', 
                  'Production', 'Efficiency (%)', 'Performance (%)'
                ].map((h) => (
                  <th key={h} className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-bold uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="13" className="text-center py-10">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="13" className="text-center py-10 text-gray-500">No data found.</td>
                </tr>
              ) : (
                data.map((row, index) => {
                  const metrics = calculateMetrics(row);
                  return (
                    <tr key={index} className="hover:bg-blue-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 font-semibold text-blue-700 dark:text-blue-400">{row.line}</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">{row.buyer}</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">{row.style}</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-right">{row.totalSmv}</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-right font-bold">{row.totalManpower}</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-right">{row.avgWorkingHour}</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-right text-red-500">{row.npt || 0}</td>
                      
                      {/* 1. Production Input Field */}
                      <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">
                        <input
                          type="number"
                          value={row.production}
                          onChange={(e) => handleProductionChange(index, e.target.value)}
                          className="w-20 p-1 border rounded text-right bg-yellow-50 dark:bg-gray-800 border-yellow-300 focus:ring-2 focus:ring-yellow-500 outline-none"
                        />
                      </td>

                      {/* 2. Efficiency Column */}
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-right font-bold text-green-600 dark:text-green-400">
                        {metrics.efficiency}%
                      </td>

                      {/* 3. Performance Column */}
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-right font-bold text-purple-600 dark:text-purple-400">
                        {metrics.performance}%
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}