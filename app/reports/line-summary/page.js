'use client';

import { useEffect, useState } from 'react';

export default function LineSummaryPage() {
  const [date, setDate] = useState('2025-12-25'); // ডিফল্ট ডেট সেট করা হয়েছে
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      // আপনার API রুটে ডেট প্যারামিটার পাঠানো হচ্ছে
      const res = await fetch(`/api/line-summery-report?date=${date}`);
      const json = await res.json();
      setData(json.data || []);
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

  return (
    <div className="p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 border-b pb-2 border-gray-200 dark:border-gray-700">
          Line Wise Production Summary & NPT Report
        </h1>

        {/* 🔎 Date Filter Section */}
        <div className="flex items-center gap-4 mb-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex flex-col">
            <label className="text-xs font-semibold uppercase text-gray-500 mb-1">Select Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="
                border rounded-md px-3 py-2 text-sm
                bg-white dark:bg-gray-700
                text-gray-900 dark:text-gray-100
                border-gray-300 dark:border-gray-600
                focus:ring-2 focus:ring-blue-500 outline-none
              "
            />
          </div>
          <button
            onClick={fetchReport}
            className="
              mt-5 bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-medium
              hover:bg-blue-700 transition-colors shadow-sm
              disabled:opacity-50
            "
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load Report'}
          </button>
        </div>

        {/* 📊 Table Section */}
        <div className="overflow-x-auto border rounded-lg border-gray-300 dark:border-gray-700 shadow-md">
          <table className="min-w-full text-sm border-collapse bg-white dark:bg-gray-800">
            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
              <tr>
                {[
                  'Line',
                  'Buyer',
                  'Style',
                  'SMV',
                  'Operator',
                  'Helper',
                  'Manpower',
                  'Hourly Target',
                  'Avg Working Hour',
                  'NPT (Sec)', // নতুন কলাম NPT
                ].map((h) => (
                  <th
                    key={h}
                    className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-bold uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="10" className="text-center py-10">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-500">Fetching data, please wait...</p>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan="10"
                    className="text-center py-10 text-gray-500 dark:text-gray-400 font-medium"
                  >
                    No production data found for this date.
                  </td>
                </tr>
              ) : (
                data.map((row, index) => (
                  <tr
                    key={index}
                    className="
                      hover:bg-blue-50 dark:hover:bg-gray-700/50
                      transition-colors
                    "
                  >
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 font-semibold text-blue-700 dark:text-blue-400">
                      {row.line}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">
                      {row.buyer}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">
                      {row.style}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-right">
                      {row.totalSmv}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-right">
                      {row.operator}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-right">
                      {row.helper}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-right font-bold text-gray-800 dark:text-gray-200">
                      {row.totalManpower}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-right">
                      {row.hourlyTarget}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-right">
                      {row.avgWorkingHour}
                    </td>
                    {/* ✅ NPT Data Column */}
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-right font-bold text-red-600 dark:text-red-400 bg-red-50/30 dark:bg-red-900/10">
                      {row.npt || 0}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}