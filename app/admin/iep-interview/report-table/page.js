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
  const [duplicateIds, setDuplicateIds] = useState([]);
  const [resignIds, setResignIds] = useState([]);

  // নতুন স্টেট: কোন summary card টি বর্তমানে সিলেক্টেড আছে তা ট্র্যাক করার জন্য
  const [activeSummaryFilter, setActiveSummaryFilter] = useState(null); 

  useEffect(() => {
    fetchReport();
    fetchDuplicateAndResignData();
  }, []);

  const fetchDuplicateAndResignData = async () => {
    try {
      const res = await fetch(
        "/api/iep-interview/duplicate-history-check"
      );

      const data = await res.json();

      if (data.success) {
        setDuplicateIds(data.duplicateIds || []);
        setResignIds(data.resignIds || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

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
        console.log(data.results);
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
    setActiveSummaryFilter(null); // Summary filter reset
    fetchReport();
  };

  // কার্ডে ক্লিক করলে স্টেট টগল করার ফাংশন
  const handleSummaryCardClick = (filterType) => {
    if (activeSummaryFilter === filterType) {
      setActiveSummaryFilter(null); // দ্বিতীয়বার ক্লিক করলে ফিল্টার ক্লিয়ার হবে
    } else {
      setActiveSummaryFilter(filterType); // প্রথমবার ক্লিক করলে ফিল্টার অ্যাপ্লাই হবে
    }
  };

  // মূল ক্যান্ডিডেট ডেটা ফিল্টারিং লজিক
  let filteredCandidates = useMemo(() => {
    let data = reportData?.candidates || [];

    // ১. ফ্লোর ফিল্টার
    if (selectedFloor !== "All") {
      data = data.filter(c => c.floor === selectedFloor);
    }

    // ২. বাটন ফিল্টার (Failed Only)
    if (showFailedOnly) {
      data = data.filter(c => c.overallStatus === "FAILED");
    }

    // ৩. বাটন ফিল্টার (Duplicates)
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

    // ৪. আইডি টাইপ ফিল্টার
    if (selectedIdType !== "ALL") {
        data = data.filter(c => (c.nid || c.birthCertificate) === selectedIdType);
    }

    // ৫. Summary Card ভিত্তিক ডাইনামিক ফিল্টারিং (যা আপনি চেয়েছেন)
    if (activeSummaryFilter) {
      switch (activeSummaryFilter) {
        case 'PENDING':
          data = data.filter(c => c.overallStatus === 'PENDING');
          break;
        case 'PASSED':
          data = data.filter(c => c.overallStatus === 'PASSED');
          break;
        case 'FAILED':
          data = data.filter(c => c.overallStatus === 'FAILED');
          break;
        case 'MULTIPLE_INTERVIEW':
          data = data.filter(c => duplicateIds.includes(c.nid || c.birthCertificate));
          break;
        case 'RESIGN_HISTORY':
          data = data.filter(c => resignIds.includes(c.nid || c.birthCertificate));
          break;
        default:
          break;
      }
    }

    return data;
  }, [reportData, selectedFloor, showFailedOnly, showDuplicates, selectedIdType, activeSummaryFilter, duplicateIds, resignIds]);


  // Summary কার্ডের জন্য আনফিল্টারড/স্ট্যাটিক কাউন্ট (যাতে টেবিল ফিল্টার হলেও কার্ডের সংখ্যাগুলো অপরিবর্তিত থাকে)
  const baseSummary = useMemo(() => {
    let data = reportData?.candidates || [];
    if (selectedFloor !== "All") {
      data = data.filter(c => c.floor === selectedFloor);
    }
    return {
      total: data.length,
      pending: data.filter(c => c.overallStatus === 'PENDING').length,
      passed: data.filter(c => c.overallStatus === 'PASSED').length,
      failed: data.filter(c => c.overallStatus === 'FAILED').length,
      multiple: data.filter(c => duplicateIds.includes(c.nid || c.birthCertificate)).length,
      resign: data.filter(c => resignIds.includes(c.nid || c.birthCertificate)).length,
    };
  }, [reportData, selectedFloor, duplicateIds, resignIds]);


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

  const uniqueFloors = ['All', ...new Set(reportData?.candidates?.map(c => c.floor).filter(Boolean))];

  return (
    <div className="min-h-screen text-black bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mt-10 text-gray-900 mb-8">Candidate Tracker</h1>

        {/* Summary Section - কার্ডগুলোতে onClick এবং একটি একটিভ বর্ডার ইফেক্ট যোগ করা হয়েছে */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          
          {/* Total Card */}
          <div 
            onClick={() => handleSummaryCardClick(null)}
            className={`bg-white rounded-lg shadow p-4 border-l-4 border-blue-500 cursor-pointer transition-all ${activeSummaryFilter === null ? 'ring-2 ring-blue-400 scale-105' : 'hover:bg-gray-50'}`}
          >
            <h2 className="text-sm font-medium text-gray-500">Total Candidates</h2>
            <p className="text-2xl font-bold text-gray-900">{baseSummary.total}</p>
          </div>

          {/* Pending Card */}
          <div 
            onClick={() => handleSummaryCardClick('PENDING')}
            className={`bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500 cursor-pointer transition-all ${activeSummaryFilter === 'PENDING' ? 'ring-2 ring-yellow-400 scale-105' : 'hover:bg-gray-50'}`}
          >
            <h2 className="text-sm font-medium text-gray-500">Pending</h2>
            <p className="text-2xl font-bold text-gray-900">{baseSummary.pending}</p>
          </div>

          {/* Passed Card */}
          <div 
            onClick={() => handleSummaryCardClick('PASSED')}
            className={`bg-white rounded-lg shadow p-4 border-l-4 border-green-500 cursor-pointer transition-all ${activeSummaryFilter === 'PASSED' ? 'ring-2 ring-green-400 scale-105' : 'hover:bg-gray-50'}`}
          >
            <h2 className="text-sm font-medium text-gray-500">Passed</h2>
            <p className="text-2xl font-bold text-gray-900">{baseSummary.passed}</p>
          </div>

          {/* Failed Card */}
          <div 
            onClick={() => handleSummaryCardClick('FAILED')}
            className={`bg-white rounded-lg shadow p-4 border-l-4 border-red-500 cursor-pointer transition-all ${activeSummaryFilter === 'FAILED' ? 'ring-2 ring-red-400 scale-105' : 'hover:bg-gray-50'}`}
          >
            <h2 className="text-sm font-medium text-gray-500">Failed</h2>
            <p className="text-2xl font-bold text-gray-900">{baseSummary.failed}</p>
          </div>
          
          {/* Multiple Interview Card */}
          <div 
            onClick={() => handleSummaryCardClick('MULTIPLE_INTERVIEW')}
            className={`bg-white rounded-lg shadow p-4 border-l-4 border-orange-500 cursor-pointer transition-all ${activeSummaryFilter === 'MULTIPLE_INTERVIEW' ? 'ring-2 ring-orange-400 scale-105' : 'hover:bg-gray-50'}`}
          >
            <h2 className="text-sm font-medium text-gray-500">Multiple Interview</h2>
            <p className="text-2xl font-bold text-gray-900">{baseSummary.multiple}</p>
          </div>

          {/* Resign History Card */}
          <div 
            onClick={() => handleSummaryCardClick('RESIGN_HISTORY')}
            className={`bg-white rounded-lg shadow p-4 border-l-4 border-pink-500 cursor-pointer transition-all ${activeSummaryFilter === 'RESIGN_HISTORY' ? 'ring-2 ring-pink-400 scale-105' : 'hover:bg-gray-50'}`}
          >
            <h2 className="text-sm font-medium text-gray-500">Resign History</h2>
            <p className="text-2xl font-bold text-gray-900">{baseSummary.resign}</p>
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
                <button
                  onClick={() => setShowDuplicates(!showDuplicates)}
                  className={`px-4 py-2 rounded-md text-sm font-semibold border ${
                    showDuplicates ? "bg-orange-500 text-white" : "bg-white text-gray-700"
                  }`}
                >
                  Duplicate
                </button>

                <button
                  onClick={() => setShowFailedOnly(!showFailedOnly)}
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

        {/* Modal: Candidate History */}
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
                          <div className="p-3 bg-white rounded border">
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-1">1. Security</h4>
                            <p className={`font-bold ${getStepColor(stepOne.result)}`}>{stepOne.result}</p>
                          </div>

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

                          <div className="p-3 bg-white rounded border">
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-1">4. Admin Interview</h4>
                            {adminMain ? (
                              <>
                                <p className={`font-bold ${getStepColor(adminMain.result)}`}>{adminMain.result}</p>
                                <p className="text-xs font-bold text-green-700">Salary: {adminMain.salary}</p>
                              </>
                            ) : <p className="text-xs text-gray-400 italic">No Data</p>}
                          </div>

                          <div className="p-3 bg-white rounded border md:col-span-4">
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">5. Resignation History</h4>
                            {profileData?.resignHistory?.data?.length > 0 ? (
                              <div className="space-y-3 text-black">
                                {profileData.resignHistory.data.map((history) => (
                                  <div key={history._id} className="border rounded p-3 bg-red-50">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                      <div><span className="font-semibold text-gray-600">Operator ID:</span><p>{history.operatorId}</p></div>
                                      <div><span className="font-semibold text-gray-600">Department:</span><p>{history.department}</p></div>
                                      <div><span className="font-semibold text-gray-600">Floor:</span><p>{history.floor}</p></div>
                                      <div><span className="font-semibold text-gray-600">Designation:</span><p>{history.designation}</p></div>
                                      <div><span className="font-semibold text-gray-600">Joining Date:</span><p>{history.joiningDate ? new Date(history.joiningDate).toLocaleDateString() : "N/A"}</p></div>
                                      <div><span className="font-semibold text-gray-600">Resignation Date:</span><p>{history.resignationDate ? new Date(history.resignationDate).toLocaleDateString() : "N/A"}</p></div>
                                    </div>
                                    <div className="mt-3">
                                      <span className="font-semibold text-red-700">Reason:</span>
                                      <p className="text-red-600 font-medium">{history.reason || "N/A"}</p>
                                    </div>
                                    {history.remarks && (
                                      <div className="mt-2">
                                        <span className="font-semibold text-gray-600">Remarks:</span>
                                        <p>{history.remarks}</p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400 italic">No resignation history found</p>
                            )}
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
                  <tr
                    key={candidate.candidateId}
                    className={`
                      ${duplicateIds.includes(candidate.nid || candidate.birthCertificate) ? "bg-red-100" : ""}
                      ${resignIds.includes(candidate.nid || candidate.birthCertificate) ? "bg-yellow-100" : ""}
                    `}
                  >
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