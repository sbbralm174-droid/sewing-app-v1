// app/candidates/report/page.js
'use client';

import { useState, useEffect } from 'react';

export default function CandidateReport() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async (start = '', end = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (start) params.append('startDate', start);
      if (end) params.append('endDate', end);
      
      const response = await fetch(`/api/iep-interview/report-table?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setReportData(result.data);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };
  console.log("reportData",reportData);

  const handleDateFilter = (e) => {
    e.preventDefault();
    fetchReport(dateRange.startDate, dateRange.endDate);
  };

  const handleReset = () => {
    setDateRange({ startDate: '', endDate: '' });
    fetchReport();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PASSED': return 'bg-green-100 text-green-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStepColor = (result) => {
    switch (result) {
      case 'PASSED': return 'text-green-600';
      case 'FAILED': return 'text-red-600';
      case 'PENDING': return 'text-yellow-600';
      case 'NOT_REACHED': return 'text-gray-400';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mt-15 text-gray-900 mb-8">Candidate Tracker</h1>

        {/* Summary Section */}
        {reportData?.summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-sm font-medium text-gray-500">Total Candidates</h2>
                  <p className="text-2xl font-semibold text-gray-900">{reportData.summary.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-sm font-medium text-gray-500">Pending</h2>
                  <p className="text-2xl font-semibold text-gray-900">{reportData.summary.pending}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-sm font-medium text-gray-500">Passed</h2>
                  <p className="text-2xl font-semibold text-gray-900">{reportData.summary.passed}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100 text-red-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-sm font-medium text-gray-500">Failed</h2>
                  <p className="text-2xl font-semibold text-gray-900">{reportData.summary.failed}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Date Filter Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter by Date Range</h2>
          <form onSubmit={handleDateFilter} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Apply Filter
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Candidates Table */}
        {/* Candidates Table */}
<div className="bg-white rounded-lg shadow overflow-hidden">
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SL</th>
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Candidate</th>
          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">SECURITY</th>
          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">DOWN ADMIN</th>
          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">IEP</th>
          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">ADMIN</th>
          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Current Step</th>
          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
{console.log("candidate",reportData)}

  {reportData?.candidates?.slice().reverse().map((candidate, index) => {
    const stepResults = {};
    candidate.steps.forEach(step => {
      stepResults[step.step] = step.result;
    });

    return (
      <tr key={candidate.candidateId} className="hover:bg-gray-50">
        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{reportData.candidates.length - index}</td>
        
        <td className="px-4 py-2 whitespace-nowrap">
  <div className="flex items-center space-x-2">
    <img 
      src={candidate.picture || '/default-avatar.png'} 
      alt="avatar" 
      className="w-8 h-8 rounded-full" 
    />
    <div className="flex flex-col">
      <span className="text-sm font-medium text-gray-900">{candidate.candidateId}</span>
      <span className="text-sm font-medium text-gray-900">{candidate.name}</span>
      <span className="text-sm font-medium text-gray-900">{candidate.nid}</span>
      
    </div>
  </div>
</td>

        {[1, 2, 3, 4].map(stepNum => {
  const step = candidate.steps.find(s => s.step === stepNum);

  return (
    <td key={stepNum} className="px-4 py-2 text-center text-sm font-medium">
      <div className="flex flex-col items-center">
        <span className={getStepColor(step?.result || 'NOT_REACHED')}>
          {step?.result || 'NOT REACHED'}
        </span>
        
        {/* নিচে failure reason দেখানো হবে (যদি থাকে) */}
        {step?.failureReason && (
          <span className="text-xs text-red-500 mt-1">
            ({step.failureReason})
          </span>
        )}
      </div>
    </td>
  );
})}

        <td className="px-4 py-2 text-center text-sm text-gray-900">
          Step {candidate.currentStep || '-'}
        </td>

        <td className="px-4 py-2 text-center">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(candidate.overallStatus)}`}>
            {candidate.overallStatus || 'PENDING'}
          </span>
        </td>
      </tr>
    );
  })}
</tbody>

    </table>
  </div>

  {(!reportData?.candidates || reportData.candidates.length === 0) && (
    <div className="text-center py-8 text-gray-500">
      No candidates found for the selected date range.
    </div>
  )}
</div>

      </div>
    </div>
  );
}