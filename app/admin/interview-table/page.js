// components/CandidateTable.jsx
'use client';

import { useState, useEffect } from 'react';
import { fetchAllCandidateData } from '@/lib/interviewApi';

const CandidateTable = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { stepOneData, stepTwoData, adminData, iepInterviewData } = await fetchAllCandidateData();
    
    // Combine all data based on candidateId
    const combinedData = stepOneData.map(stepOneCandidate => {
      const candidateId = stepOneCandidate.candidateId;
      
      // Find matching data from other APIs
      const stepTwoMatch = stepTwoData.find(item => item.candidateId === candidateId);
      const adminMatch = adminData.find(item => item.candidateId?.candidateId === candidateId);
      const iepMatch = iepInterviewData.find(item => item.candidateId === candidateId);

      return {
        candidateId,
        name: stepOneCandidate.name,
        nid: stepOneCandidate.nid,
        picture: stepOneCandidate.picture,
        createdAt: stepOneCandidate.createdAt,
        
        // Step One Data
        stepOneCompleted: true,
        stepOneData: stepOneCandidate,
        
        // Step Two Data
        stepTwoCompleted: !!stepTwoMatch,
        stepTwoData: stepTwoMatch,
        stepTwoResult: stepTwoMatch?.result || 'NOT_STARTED',
        
        // Admin Interview Data
        adminCompleted: !!adminMatch,
        adminData: adminMatch,
        adminResult: adminMatch?.result || 'NOT_STARTED',
        
        // IEP Interview Data
        iepCompleted: !!iepMatch,
        iepData: iepMatch,
        iepResult: iepMatch?.result || 'NOT_STARTED'
      };
    });

    setCandidates(combinedData);
    setLoading(false);
  };

  const getStatusBadge = (result) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-semibold";
    
    switch (result) {
      case 'PASSED':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'FAILED':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'NOT_STARTED':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-BD');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Candidate Progress Tracking</h2>
          <p className="text-gray-600 mt-1">Track candidate progress through all interview stages</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Candidate Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registration Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Step 1
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Step 2
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Step 3
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Step 4
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Overall Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {candidates.map((candidate) => (
                <tr key={candidate.candidateId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={`http://localhost:3000${candidate.picture}`}
                          alt={candidate.name}
                          
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {candidate.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {candidate.candidateId}
                        </div>
                        <div className="text-xs text-gray-400">
                          NID: {candidate.nid}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(candidate.createdAt)}
                  </td>
                  
                  {/* Step 1 Column */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusBadge('COMPLETED')}>
                      COMPLETED
                    </span>
                  </td>

                  {/* Admin Interview Column */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusBadge(candidate.adminResult)}>
                      {candidate.adminResult === 'NOT_STARTED' ? 'NOT STARTED' : candidate.adminResult}
                    </span>
                  </td>
                  
                  {/* Step 2 Column */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusBadge(candidate.stepTwoResult)}>
                      {candidate.stepTwoResult === 'NOT_STARTED' ? 'NOT STARTED' : candidate.stepTwoResult}
                    </span>
                  </td>
                  
                  {/* IEP Interview Column */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusBadge(candidate.iepResult)}>
                      {candidate.iepResult === 'NOT_STARTED' ? 'NOT STARTED' : candidate.iepResult}
                    </span>
                  </td>
                  
                  {/* Overall Status Column */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {candidate.adminResult === 'PASSED' ? (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        COMPLETED
                      </span>
                    ) : candidate.iepResult === 'FAILED' || candidate.stepTwoResult === 'FAILED' ? (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                        REJECTED
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        IN PROGRESS
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {candidates.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg">No candidates found</p>
          </div>
        )}
      </div>
      
      {/* Legend */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Status Legend</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <span className="w-3 h-3 bg-green-100 rounded-full mr-2 border border-green-300"></span>
            <span className="text-sm text-gray-600">PASSED/COMPLETED</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-red-100 rounded-full mr-2 border border-red-300"></span>
            <span className="text-sm text-gray-600">FAILED/REJECTED</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-yellow-100 rounded-full mr-2 border border-yellow-300"></span>
            <span className="text-sm text-gray-600">IN PROGRESS</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-gray-100 rounded-full mr-2 border border-gray-300"></span>
            <span className="text-sm text-gray-600">NOT STARTED</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateTable;