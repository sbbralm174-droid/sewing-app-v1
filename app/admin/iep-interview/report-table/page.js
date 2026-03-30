'use client';

import { useState, useEffect } from 'react';

export default function CandidateReport() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState('All');
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

  const handleDateFilter = (e) => {
    e.preventDefault();
    fetchReport(dateRange.startDate, dateRange.endDate);
  };

  const handleReset = () => {
    setDateRange({ startDate: '', endDate: '' });
    setSelectedFloor('All');
    fetchReport();
  };

  // Logic to filter candidates based on Floor
  const filteredCandidates = reportData?.candidates?.filter(candidate => {
    if (selectedFloor === 'All') return true;
    return candidate.floor === selectedFloor;
  }) || [];

  // Recalculate Summary based on filtered results
  const filteredSummary = {
    total: filteredCandidates.length,
    pending: filteredCandidates.filter(c => c.overallStatus === 'PENDING').length,
    passed: filteredCandidates.filter(c => c.overallStatus === 'PASSED').length,
    failed: filteredCandidates.filter(c => c.overallStatus === 'FAILED').length,
  };

  const uniqueFloors = ['All', ...new Set(reportData?.candidates?.map(c => c.floor).filter(Boolean))];

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
        <div className="text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mt-15 text-gray-900 mb-8">Candidate Tracker</h1>

        {/* Updated Summary Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <h2 className="text-sm font-medium text-gray-500">Total Candidates</h2>
            <p className="text-2xl font-bold text-gray-900">{filteredSummary.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <h2 className="text-sm font-medium text-gray-500">Pending</h2>
            <p className="text-2xl font-bold text-gray-900">{filteredSummary.pending}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <h2 className="text-sm font-medium text-gray-500">Passed</h2>
            <p className="text-2xl font-bold text-gray-900">{filteredSummary.passed}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <h2 className="text-sm font-medium text-gray-500">Failed</h2>
            <p className="text-2xl font-bold text-gray-900">{filteredSummary.failed}</p>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-end gap-4">
            <form onSubmit={handleDateFilter} className="flex flex-col sm:flex-row gap-4 flex-grow">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex items-end gap-2">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Apply Filter</button>
              </div>
            </form>

            <div className="w-full md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">Floor Filter</label>
              <select 
                value={selectedFloor}
                onChange={(e) => setSelectedFloor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md font-semibold text-blue-600"
              >
                {uniqueFloors.map(floor => (
                  <option key={floor} value={floor}>{floor}</option>
                ))}
              </select>
            </div>
            
            <button onClick={handleReset} className="px-4 py-2 bg-gray-600 text-white rounded-md">Reset</button>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SL</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Candidate</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">SECURITY</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-blue-50">FLOOR</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">DOWN ADMIN</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">IEP</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">ADMIN</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Current Step</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCandidates.slice().reverse().map((candidate, index) => (
                  <tr key={candidate.candidateId} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{filteredCandidates.length - index}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <img src={candidate.picture || '/default-avatar.png'} alt="avatar" className="w-8 h-8 rounded-full border" />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900">{candidate.name}</span>
                          <span className="text-xs text-gray-500">{candidate.nid ? candidate.nid : candidate.birthCertificate}</span>
                          <span className="text-xs text-gray-500">{candidate.candidateId}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-center text-sm font-medium">
                       <span className={getStepColor(candidate.steps[0]?.result)}>{candidate.steps[0]?.result}</span>
                    </td>
                    <td className="px-4 py-2 text-center text-sm font-bold text-blue-700 bg-blue-50/30">
                      {candidate.floor || 'N/A'}
                    </td>
                    <td className="px-4 py-2 text-center text-sm font-medium">
                       <span className={getStepColor(candidate.steps[1]?.result)}>{candidate.steps[1]?.result}</span>
                    </td>
                    <td className="px-4 py-2 text-center text-sm">
                      <div className="flex flex-col">
                        <span className={getStepColor(candidate.steps[2]?.result)}>{candidate.steps[2]?.result}</span>
                        {candidate.steps[2]?.grade && (
                          <span className="text-xs font-bold text-purple-700 mt-1 px-1 bg-purple-50 rounded">Grade: {candidate.steps[2].grade}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-center text-sm font-medium">
                       <span className={getStepColor(candidate.steps[3]?.result)}>{candidate.steps[3]?.result}</span>
                    </td>
                    <td className="px-4 py-2 text-center text-sm text-gray-700">Step {candidate.currentStep}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${getStatusColor(candidate.overallStatus)}`}>
                        {candidate.overallStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}