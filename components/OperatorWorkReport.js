// app/page.js
// components/OperatorWorkReport.js বা app/page.js এর শুরুতে
'use client'; 

import { useState } from 'react';

export default function SearchOperators() {
  // ✅ নিশ্চিত করুন যে এই লাইনগুলো আছে
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(''); // <-- এই লাইনটি থাকতে হবে
  const [line, setLine] = useState('');
  const [minDays, setMinDays] = useState(0); 
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ... handleSubmit ফাংশনটি অপরিবর্তিত থাকবে

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);

    if (!startDate || !endDate || !line) {
      setError('Please fill in Start Date, End Date, and Line fields.');
      setLoading(false);
      return;
    }
    
    const minDaysValue = minDays >= 0 ? minDays : 0; 
    
    try {
      const url = `/api/operators?startDate=${startDate}&endDate=${endDate}&line=${line}&minDays=${minDaysValue}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error: ${errorData.message || response.statusText}`);
      }
      
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        🔍 Operator Work Days Search
      </h1>
      {/* ... Form অংশটি অপরিবর্তিত থাকবে ... */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8 space-y-4">
        {/* ... Input Fields ... */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="line" className="block text-sm font-medium text-gray-700">Line (e.g., A-1)</label>
            <input
              type="text"
              id="line"
              value={line}
              onChange={(e) => setLine(e.target.value)}
              placeholder="Enter Line Name"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          <div>
            <label htmlFor="minDays" className="block text-sm font-medium text-gray-700">Minimum Days Worked (0 or empty to show all)</label>
            <input
              type="number"
              id="minDays"
              value={minDays}
              onChange={(e) => setMinDays(parseInt(e.target.value) || 0)}
              min="0"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white font-medium ${
            loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
        >
          {loading ? 'Searching...' : 'Search Operators'}
        </button>
      </form>
      {/* ... Error Message ... */}
      {error && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
          {error}
        </div>
      )}

      {/* ✅ ফলাফলের টেবিল */}
      {results && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Search Results ({results.length} Operators)</h2>
          {results.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operator ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Worked</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((op) => (
                    <tr key={op.operatorId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{op.operatorId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{op.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{op.designation}</td>
                      {/* ✅ এখানে daysWorked ডেটা দেখাচ্ছে */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-semibold">{op.daysWorked}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No operators found matching the criteria.</p>
          )}
        </div>
      )}
    </div>
  );
}