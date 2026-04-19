'use client';

import { useState, useEffect, useMemo } from 'react';

export default function CandidateReport() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState('All');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const [selectedIdValue, setSelectedIdValue] = useState(null); // Stores NID/BC
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [showFailedOnly, setShowFailedOnly] = useState(false);
  const [selectedIdType, setSelectedIdType] = useState("ALL");

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

  // NID/Birth Certificate দিয়ে প্রোফাইল খোঁজার ফাংশন
  const fetchCandidateProfile = async (idValue) => {
    try {
      setProfileLoading(true);
      setSelectedIdValue(idValue);

      const res = await fetch(
        `/api/findOperatorByNidOrBirtcirtificate?nidOrBirthCertificate=${idValue}`
      );
      const data = await res.json();

      if (data.success) {
        setProfileData(data.results);
      }
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleDateFilter = (e) => {
    e.preventDefault();
    fetchReport(dateRange.startDate, dateRange.endDate);
  };

  const handleReset = () => {
    setDateRange({ startDate: '', endDate: '' });
    setSelectedFloor('All');
    setShowDuplicates(false);
    setShowFailedOnly(false);
    setSelectedIdType("ALL");
    fetchReport();
  };

  // Logic to filter candidates
  let filteredCandidates = useMemo(() => {
    let data = reportData?.candidates || [];

    if (selectedFloor !== "All") {
      data = data.filter(c => c.floor === selectedFloor);
    }

    if (showFailedOnly) {
      data = data.filter(c => c.overallStatus === "FAILED");
    }

    if (showDuplicates) {
      const seen = new Map();
      const dup = new Set();
      data.forEach((c) => {
        const key = c.nid || c.birthCertificate;
        if (!key) return;
        if (seen.has(key)) dup.add(key);
        else seen.set(key, true);
      });
      data = data.filter(c => dup.has(c.nid || c.birthCertificate));
    }

    if (selectedIdType !== "ALL") {
        data = data.filter(c => (c.nid || c.birthCertificate) === selectedIdType);
    }

    return data;
  }, [reportData, selectedFloor, showFailedOnly, showDuplicates, selectedIdType]);


const duplicateCount = useMemo(() => {
  const seen = new Map();
  const uniqueDuplicateIds = new Set();

  filteredCandidates.forEach((c) => {
    const id = c.nid || c.birthCertificate;
    if (!id) return;

    if (seen.has(id)) {
      uniqueDuplicateIds.add(id);
    } else {
      seen.set(id, true);
    }
  });

  return uniqueDuplicateIds.size;
}, [filteredCandidates]);



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
        <div className="text-xl font-semibold">Loading Report...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mt-10 text-gray-900 mb-8">Candidate Tracker</h1>

        {/* Summary Section */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
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
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
            <h2 className="text-sm font-medium text-gray-500">Duplicate IDs (Unique)</h2>
            <p className="text-2xl font-bold text-gray-900">{duplicateCount}</p>
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
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 self-end">Apply</button>
            </form>

            <div className="w-full md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
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

            

            <div className="flex gap-2">
                {/* Duplicate Button */}
                <button
                  onClick={() => setShowDuplicates(!showDuplicates)} // শুধু নিজের স্টেট টগল করবে
                  className={`px-4 py-2 rounded-md text-sm font-semibold border ${
                    showDuplicates ? "bg-orange-500 text-white" : "bg-white text-gray-700"
                  }`}
                >
                  Duplicate
                </button>

                {/* Failed Button */}
                <button
                  onClick={() => setShowFailedOnly(!showFailedOnly)} // শুধু নিজের স্টেট টগল করবে
                  className={`px-4 py-2 rounded-md text-sm font-semibold border ${
                    showFailedOnly ? "bg-red-500 text-white" : "bg-white text-gray-700"
                  }`}
                >
                  Failed
                </button>

                <button onClick={handleReset} className="px-4 py-2 bg-gray-600 text-white rounded-md">
                  Reset
                </button>
             </div>
          </div>
        </div>

        {/* Modal: Candidate History by NID/Birth Certificate */}
        {selectedIdValue && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl p-6 relative">
              <button 
                onClick={() => { setSelectedIdValue(null); setProfileData(null); }}
                className="absolute top-4 right-4 text-2xl font-bold hover:text-red-500"
              >✕</button>

              <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Candidate History (ID: {selectedIdValue})</h2>

              {profileLoading ? (
                <div className="text-center py-20 text-lg font-semibold">Fetching All Records...</div>
              ) : (
                <div className="space-y-6">
                  {profileData?.iepInterviewStepOne?.data?.map((stepOne, idx) => {
                    const cid = stepOne.candidateId;
                    // Find matching data from other steps for this specific candidateId
                    const downAdmin = profileData?.iepInterviewDownAdmin?.data?.find(d => d.candidateId === cid);
                    const iepMain = profileData?.iepInterview?.data?.find(i => i.candidateId === cid);
                    const adminMain = profileData?.adminInterview?.data?.find(a => a.candidateId === cid);

                    return (
                      <div key={cid} className="border rounded-lg p-5 bg-gray-50 hover:bg-white transition-colors border-blue-100">
                        <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                           <div className="flex items-center gap-3">
                              <span className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold">ENTRY #{idx + 1}</span>
                              <span className="font-mono text-sm text-blue-700 font-bold">{cid}</span>
                           </div>
                           <span className="text-sm font-semibold text-gray-600">
                             Date: {new Date(stepOne.createdAt).toLocaleString("en-BD", {timeZone: "Asia/Dhaka"})}
                           </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          {/* SECURITY */}
                          <div className="p-3 bg-white rounded border">
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-1">1. Security</h4>
                            <p className={`font-bold ${getStepColor(stepOne.result)}`}>{stepOne.result}</p>
                          </div>

                          {/* DOWN ADMIN */}
                          <div className="p-3 bg-white rounded border">
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-1">2. Down Admin</h4>
                            {downAdmin ? (
                              <>
                                <p className={`font-bold ${getStepColor(downAdmin.result)}`}>{downAdmin.result}</p>
                                <p className="text-xs text-blue-600 font-bold">Floor: {downAdmin.floor}</p>
                                {downAdmin.failureReason && <p className="text-xs text-red-500 mt-1">{downAdmin.failureReason}</p>}
                              </>
                            ) : <p className="text-xs text-gray-400 italic">No Data</p>}
                          </div>

                          {/* IEP */}
                          <div className="p-3 bg-white rounded border">
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-1">3. IEP Interview</h4>
                            {iepMain ? (
                              <>
                                <p className={`font-bold ${getStepColor(iepMain.result)}`}>{iepMain.result}</p>
                                <p className="text-xs font-bold text-purple-700">Grade: {iepMain.grade}</p>
                                <p className="text-xs text-gray-500">By: {iepMain.interviewer}</p>
                              </>
                            ) : <p className="text-xs text-gray-400 italic">No Data</p>}
                          </div>

                          {/* ADMIN */}
                          <div className="p-3 bg-white rounded border">
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-1">4. Admin Interview</h4>
                            {adminMain ? (
                              <>
                                <p className={`font-bold ${getStepColor(adminMain.result)}`}>{adminMain.result}</p>
                                <p className="text-xs font-bold text-green-700">Salary: {adminMain.salary}</p>
                              </>
                            ) : <p className="text-xs text-gray-400 italic">No Data</p>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {(!profileData?.iepInterviewStepOne?.data || profileData?.iepInterviewStepOne?.count === 0) && (
                    <div className="text-center py-10 text-gray-500">No records found for this candidate.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

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
                          <span 
                            onClick={() => fetchCandidateProfile(candidate.nid || candidate.birthCertificate)} 
                            className="text-sm font-bold text-blue-600 cursor-pointer hover:underline"
                          >
                            {candidate.name}
                          </span>
                          <span className="text-xs text-gray-500">{candidate.nid ? candidate.nid : candidate.birthCertificate}</span>
                          <span className="text-xs text-gray-400">{candidate.candidateId}</span>
                          <span className="text-xs text-gray-400">{new Date(candidate.date).toISOString().split('T')[0]}</span>
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
                        <span className={getStepColor(candidate.steps[2]?.result)}>{candidate.steps[2]?.result}</span>
                        {candidate.steps[2]?.grade && (
                          <div className="text-[10px] font-bold text-purple-700">{candidate.steps[2].grade}</div>
                        )}
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