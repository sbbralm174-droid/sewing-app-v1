'use client';

import { useEffect, useState } from 'react';

export default function LineSummaryPage() {
  const [date, setDate] = useState('2025-12-22');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
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
    <div className="p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <h1 className="text-2xl font-semibold mb-4">
        Line Wise Production Summary
      </h1>

      {/* 🔎 Date Filter */}
      <div className="flex items-center gap-3 mb-5">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="
            border rounded px-3 py-1 text-sm
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-gray-100
            border-gray-300 dark:border-gray-700
          "
        />
        <button
          onClick={fetchReport}
          className="
            bg-blue-600 text-white px-4 py-1.5 rounded text-sm
            hover:bg-blue-700
          "
        >
          Load
        </button>
      </div>

      {/* 📊 Table */}
      <div className="overflow-x-auto border rounded border-gray-300 dark:border-gray-700">
        <table className="min-w-full text-sm border-collapse">
          <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
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
              ].map((h) => (
                <th
                  key={h}
                  className="border border-gray-300 dark:border-gray-700 px-3 py-2 text-left"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan="9" className="text-center py-4">
                  Loading...
                </td>
              </tr>
            )}

            {!loading && data.length === 0 && (
              <tr>
                <td
                  colSpan="9"
                  className="text-center py-4 text-gray-500 dark:text-gray-400"
                >
                  No data found
                </td>
              </tr>
            )}

            {!loading &&
              data.map((row, index) => (
                <tr
                  key={index}
                  className="
                    hover:bg-gray-50 dark:hover:bg-gray-800
                    transition
                  "
                >
                  <td className="border border-gray-300 dark:border-gray-700 px-3 py-2">
                    {row.line}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-700 px-3 py-2">
                    {row.buyer}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-700 px-3 py-2">
                    {row.style}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-700 px-3 py-2 text-right">
                    {row.totalSmv}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-700 px-3 py-2 text-right">
                    {row.operator}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-700 px-3 py-2 text-right">
                    {row.helper}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-700 px-3 py-2 text-right font-medium">
                    {row.totalManpower}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-700 px-3 py-2 text-right">
                    {row.hourlyTarget}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-700 px-3 py-2 text-right">
                    {row.avgWorkingHour}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
