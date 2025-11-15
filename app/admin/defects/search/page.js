'use client';

import { useState } from 'react';

export default function DefectSearch() {
  const [operatorId, setOperatorId] = useState('');
  const [startDate, setStartDate] = useState(''); 
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!operatorId.trim()) {
      setError('Operator ID required');
      return;
    }
    
    if ((startDate && !endDate) || (!startDate && endDate)) {
        setError('Please provide both Start Date and End Date for date range search.');
        return;
    }
    
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        setError('Start Date cannot be after End Date.');
        return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/defects/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operatorId: operatorId.trim(),
          startDate: startDate || undefined,
          endDate: endDate || undefined
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }
      
      setResult(data);
    } catch (err) {
      setError(err.message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-BD');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Operator Defect Search
          </h1>
          
          <form onSubmit={handleSearch} className="space-y-4">
            {/* তিনটি input একই লাইনে */}
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              {/* Operator ID */}
              <div className="flex-1 min-w-0">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Operator ID *
                </label>
                <input
                  type="text"
                  value={operatorId}
                  onChange={(e) => setOperatorId(e.target.value)}
                  placeholder="Enter Operator ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              {/* Start Date */}
              <div className="flex-1 min-w-0">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date (Optional)
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
                
              {/* End Date */}
              <div className="flex-1 min-w-0">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Search Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 whitespace-nowrap"
              >
                {loading ? 'Searching...' : 'Search Defects'}
              </button>
            </div>
          </form>
          
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
        </div>

        {/* Results Section */}
        {result && (
            <div className="space-y-6">
                {/* Operator Summary */}
                {result.operator && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">
                            Operator Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Name</p>
                                <p className="font-semibold">{result.operator.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Operator ID</p>
                                <p className="font-semibold">{result.operator.operatorId}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Designation</p>
                                <p className="font-semibold">{result.operator.designation}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Overall Statistics */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">
                        Overall Statistics
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-gray-600">Total Productions days</p>
                            <p className="text-2xl font-bold text-blue-600">{result.totalProductions}</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <p className="text-sm text-gray-600">Total Production</p>
                            <p className="text-2xl font-bold text-green-600">{result.totalProduction}</p>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                            <p className="text-sm text-gray-600">Total Defects</p>
                            <p className="text-2xl font-bold text-red-600">{result.totalDefects}</p>
                        </div>
                        <div className="text-center p-4 bg-yellow-50 rounded-lg">
                            <p className="text-sm text-gray-600">Defect Rate</p>
                            <p className="text-2xl font-bold text-yellow-600">{result.defectRate}%</p>
                        </div>
                    </div>
                </div>

                {/* Defects Breakdown */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">
                        Defects Breakdown
                    </h2>

                    {result.defects.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No defects found</p>
                    ) : (
                        <div className="space-y-4">
                            {result.defects.map((defect, index) => (
                                <div key={defect.defectId || defect.code} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-semibold text-lg">
                                                {defect.name} ({defect.code})
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                Total: {defect.totalCount} defects
                                            </p>
                                        </div>
                                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                                            #{index + 1}
                                        </span>
                                    </div>

                                    <div className="bg-gray-50 rounded p-3">
                                        <h4 className="font-medium text-sm text-gray-700 mb-2">
                                            Occurrences:
                                        </h4>
                                        <div className="space-y-2">
                                            {defect.occurrences.map((occurrence, occIndex) => (
                                                <div key={occIndex} className="flex justify-between items-center text-sm">
                                                    <span>
                                                        {formatDate(occurrence.date)} | {occurrence.hour} | 
                                                        Line: {occurrence.line} | Process: {occurrence.process}
                                                    </span>
                                                    <span className="font-medium text-red-600">
                                                        {occurrence.count} defects
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Production History */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">
                        Production History
                    </h2>

                    {result.productions.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No production history found</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Date
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Line
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Process
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Supervisor
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Production
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Defects
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {result.productions.map((production, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                {formatDate(production.date)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                {production.line}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                {production.process}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                {production.supervisor}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-green-600 font-medium">
                                                {production.totalProduction}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-red-600 font-medium">
                                                {production.totalDefects}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}