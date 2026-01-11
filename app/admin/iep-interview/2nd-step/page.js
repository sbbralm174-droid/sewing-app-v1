// app/admin/iep-interview/2nd-step/page.js

'use client';

import { useState, useEffect } from 'react';
import NidOrBirthCertificateSearch from '@/components/NidOrBirthCertificate';

export default function InterviewStepTwo() {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedCandidateData, setSelectedCandidateData] = useState(null);
  const [failureReason, setFailureReason] = useState('');
  const [showReasonInput, setShowReasonInput] = useState(false);
  
  // New state for additional information
  const [chairmanCertificate, setChairmanCertificate] = useState(false);
  const [educationCertificate, setEducationCertificate] = useState(false);
  const [experienceMachines, setExperienceMachines] = useState({
    SNLS_DNLS: false,
    OverLock: false,
    FlatLock: false
  });
  const [designation, setDesignation] = useState({
    ASST_OPERATOR: false,
    OPERATOR: false,
  });
  const [otherInfo, setOtherInfo] = useState('');
  const [floor, setFloor] = useState('');
  
  // Search related states
  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [searchKey, setSearchKey] = useState(0);

  // Fetch candidates on component mount
  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      setLoading(true);

      // Step one এর জন্য সব candidate নাও
      const response = await fetch('/api/iep-interview/step-one-get');
      const stepOneData = await response.json();

      console.log('Raw API response:', stepOneData);

      // Validate data structure - ensure required fields exist
      const validatedCandidates = stepOneData.filter(candidate => 
        candidate && 
        candidate.candidateId && 
        candidate.name
      );

      // Log invalid candidates for debugging
      const invalidCandidates = stepOneData.filter(candidate => 
        !candidate || !candidate.candidateId || !candidate.name
      );
      
      if (invalidCandidates.length > 0) {
        console.warn('Invalid candidates found:', invalidCandidates);
      }

      // Already marked candidates নাও
      const responseMarked = await fetch('/api/iep-interview/iep-interview-down-admin/get');
      const markedData = await responseMarked.json();
      const markedCandidateIds = markedData.map(c => c.candidateId);

      // Filter out those candidates যারা already marked অথবা FAILED
      const filteredCandidates = validatedCandidates.filter(
        c => !markedCandidateIds.includes(c.candidateId) && c.result !== "FAILED"
      );

      if (response.ok) {
        setCandidates(filteredCandidates);
        console.log('Filtered candidates:', filteredCandidates);
      } else {
        setMessage('Failed to fetch candidates');
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
      setMessage('Error fetching candidates');
    } finally {
      setLoading(false);
    }
  };

  const handleCandidateChange = (e) => {
    const candidateId = e.target.value;
    setSelectedCandidate(candidateId);
    
    const candidate = candidates.find(c => c.candidateId === candidateId);
    
    if (candidate) {
      // Validate required fields
      if (!candidate.name) {
        console.error('Selected candidate missing name:', candidate);
        setMessage('Error: Selected candidate data is incomplete');
        setSelectedCandidateData(null);
        return;
      }
      
      setSelectedCandidateData(candidate);
      // Reset all form fields when candidate changes
      setFailureReason('');
      setShowReasonInput(false);
      setChairmanCertificate(false);
      setEducationCertificate(false);
      setExperienceMachines({
        SNLS_DNLS: false,
        OverLock: false,
        FlatLock: false
      });
      setDesignation({
        ASST_OPERATOR: false,
        OPERATOR: false,
      });
      setOtherInfo('');
      setFloor('');
      setMessage('');
    } else {
      setSelectedCandidateData(null);
    }
  };

  // Handle experience machine checkbox changes
  const handleMachineChange = (machine) => {
    setExperienceMachines(prev => ({
      ...prev,
      [machine]: !prev[machine]
    }));
  };

  // Handle DESIGNATION checkbox changes
  const handleDesignation = (designation) => {
    setDesignation(prev => ({
      ...prev,
      [designation]: !prev[designation]
    }));
  };

  // Search button click handler
  const handleSearch = () => {
    if (!selectedCandidateData) {
      alert('Please select a candidate first');
      return;
    }

    // Validate candidate data
    if (!selectedCandidateData.name) {
      alert('Selected candidate data is invalid');
      return;
    }

    const nidValue = selectedCandidateData.nid?.trim();
    const birthCertValue = selectedCandidateData.birthCertificate?.trim();
    
    if (!nidValue && !birthCertValue) {
      alert('Selected candidate does not have NID or Birth Certificate number');
      return;
    }
    
    // NID কে priority দিবে
    const searchValueToUse = nidValue || birthCertValue;
    setSearchValue(searchValueToUse);
    setSearchKey(prev => prev + 1);
    setShowSearch(true);
  };

  const handleResultUpdate = async (resultValue) => {
    if (!selectedCandidate) {
      setMessage('Please select a candidate first');
      return;
    }

    // Validate candidate data
    if (!selectedCandidateData || !selectedCandidateData.name) {
      setMessage('Invalid candidate data. Please select a valid candidate.');
      return;
    }

    // যদি FAILED হয় এবং reason না দেওয়া হয়
    if (resultValue === 'FAILED' && !failureReason.trim()) {
      setMessage('Please provide a reason for failure');
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      
      // Prepare validated data with additional information
      const requestData = {
        candidateId: selectedCandidate,
        result: resultValue,
        interviewData: {
          ...selectedCandidateData,
          name: selectedCandidateData.name || 'Unknown',
          nid: selectedCandidateData.nid || null,
          birthCertificate: selectedCandidateData.birthCertificate || null,
          candidateId: selectedCandidateData.candidateId || selectedCandidate
        },
        // Additional information fields
        chairmanCertificate,
        educationCertificate,
        experienceMachines,
        designation,
        floor,
        otherInfo: otherInfo.trim(),
        failureReason: resultValue === 'FAILED' ? failureReason : null
      };

      console.log("Sending validated data with additional info:", requestData);
      
      const response = await fetch('/api/iep-interview/iep-interview-down-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      const result = await response.json();
      console.log('Update response status:', response.status);
      console.log('Update response data:', result);
      
      if (response.ok) {
        setMessage(`Candidate successfully marked as ${resultValue}`);
        setSelectedCandidate('');
        setSelectedCandidateData(null);
        setFailureReason('');
        setShowReasonInput(false);
        // Reset additional info fields
        setChairmanCertificate(false);
        setEducationCertificate(false);
        setExperienceMachines({
          SNLS_DNLS: false,
          OverLock: false,
          FlatLock: false
        });
        setDesignation({
          ASST_OPERATOR: false,
          OPERATOR: false,
        });
        setOtherInfo('');
        setFloor('');
        fetchCandidates();
      } else {
        if (result.errors) {
          const errorDetails = Object.values(result.errors).join(', ');
          setMessage(`Validation error: ${errorDetails}`);
        } else {
          setMessage(result.error || `Failed to update result: ${response.status}`);
        }
      }
    } catch (error) {
      console.error('Error updating result:', error);
      setMessage(`Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFailedButtonClick = () => {
    if (!selectedCandidate || !selectedCandidateData) {
      setMessage('Please select a candidate first');
      return;
    }
    
    setShowReasonInput(true);
    setTimeout(() => {
      document.getElementById('failureReason')?.focus();
    }, 100);
  };

  const handlePassedButtonClick = () => {
    if (!selectedCandidate || !selectedCandidateData) {
      setMessage('Please select a candidate first');
      return;
    }
    
    setShowReasonInput(false);
    setFailureReason('');
    handleResultUpdate('PASSED');
  };

  const handleConfirmFailed = () => {
    handleResultUpdate('FAILED');
  };

  const handleCancelFailed = () => {
    setShowReasonInput(false);
    setFailureReason('');
  };

  return (
    <div className="min-h-screen bg-gray-50 mt-10 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Assessment Part - Step Two (Admin)
          </h1>

          {/* Candidate Selection */}
          <div className="mb-6">
            <label htmlFor="candidate" className="block text-sm font-medium text-gray-700 mb-2">
              Select Candidate
            </label>
            <select
              id="candidate"
              value={selectedCandidate}
              onChange={handleCandidateChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              <option value="">Choose a candidate...</option>
              {candidates.map((candidate) => {
                if (!candidate.name || !candidate.candidateId) {
                  console.warn('Invalid candidate data:', candidate);
                  return null;
                }
                
                return (
                  <option key={candidate._id} value={candidate.candidateId}>
                    {candidate.candidateId} - {candidate.name} 
                    {candidate.nid && ` - NID: ${candidate.nid}`}
                    {candidate.birthCertificate && ` - Birth Cert: ${candidate.birthCertificate}`}
                    {(!candidate.nid && !candidate.birthCertificate) && ' - No ID available'}
                  </option>
                );
              })}
            </select>
            {candidates.length === 0 && !loading && (
              <p className="text-sm text-gray-500 mt-2">
                No candidates available for interview.
              </p>
            )}
          </div>

          {/* Selected Candidate Details */}
          {selectedCandidateData && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Candidate Details
                </h3>
                
                {/* Search Button */}
                <button 
                  onClick={handleSearch}
                  disabled={!selectedCandidateData.nid && !selectedCandidateData.birthCertificate}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 text-sm"
                >
                  <span>🔍 View Details</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p><strong>Name:</strong> {selectedCandidateData.name || 'N/A'}</p>
                  <p><strong>Candidate ID:</strong> {selectedCandidateData.candidateId || 'N/A'}</p>
                  {selectedCandidateData.nid ? (
                    <p><strong>NID:</strong> {selectedCandidateData.nid}</p>
                  ) : selectedCandidateData.birthCertificate ? (
                    <p><strong>Birth Certificate:</strong> {selectedCandidateData.birthCertificate}</p>
                  ) : (
                    <p className="text-red-500 text-sm">
                      ⚠️ No NID or Birth Certificate available for search
                    </p>
                  )}
                </div>
                {selectedCandidateData.picture && (
                  <div>
                    <p><strong>Picture:</strong></p>
                    <img 
                      src={selectedCandidateData.picture} 
                      alt={selectedCandidateData.name || 'Candidate'}
                      className="w-24 h-24 object-cover rounded-md mt-2"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Information Section */}
          {selectedCandidateData && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Additional Information
              </h3>
              
              <div className="space-y-4">
                {/* Chairman Certificate */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="chairmanCertificate"
                    checked={chairmanCertificate}
                    onChange={(e) => setChairmanCertificate(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="chairmanCertificate" className="ml-2 block text-sm text-gray-900">
                    Chairman Certificate
                  </label>
                </div>

                {/* Education Certificate */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="educationCertificate"
                    checked={educationCertificate}
                    onChange={(e) => setEducationCertificate(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="educationCertificate" className="ml-2 block text-sm text-gray-900">
                    Education Certificate
                  </label>
                </div>

                {/* Experience Machines */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience Machine Name
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {Object.keys(experienceMachines).map((machine) => (
                      <div key={machine} className="flex items-center">
                        <input
                          type="checkbox"
                          id={machine}
                          checked={experienceMachines[machine]}
                          onChange={() => handleMachineChange(machine)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={machine} className="ml-2 block text-sm text-gray-900">
                          {machine.replace('_', '/')}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Designation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Designation
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {Object.keys(designation).map((machine) => (
                      <div key={machine} className="flex items-center">
                        <input
                          type="checkbox"
                          id={machine}
                          checked={designation[machine]}
                          onChange={() => handleDesignation(machine)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={machine} className="ml-2 block text-sm text-gray-900">
                          {machine.replace('_', '/')}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floor Dropdown */}
                <div>
                  <label htmlFor="floor" className="block text-sm font-medium text-gray-700 mb-2">
                    Floor
                  </label>
                  <select
                    id="floor"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Floor</option>
                    <option value="SHAPLA">Shapla</option>
                    <option value="PODDO">Poddor</option>
                    <option value="KODOM">Kodom</option>
                    <option value="BELLY">Belly</option>
                  </select>
                </div>

                {/* Other Information */}
                <div>
                  <label htmlFor="otherInfo" className="block text-sm font-medium text-gray-700 mb-2">
                    Others
                  </label>
                  <textarea
                    id="otherInfo"
                    value={otherInfo}
                    onChange={(e) => setOtherInfo(e.target.value)}
                    placeholder="Enter any other information..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Search Component */}
          {showSearch && (
            <div className="mb-6">
              <NidOrBirthCertificateSearch 
                key={searchKey}
                nidOrBirthCertificateValue={searchValue}
                autoSearch={true}
              />
            </div>
          )}

          {/* Failure Reason Input */}
          {showReasonInput && (
            <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <label htmlFor="failureReason" className="block text-sm font-medium text-red-700 mb-2">
                Reason for Failure *
              </label>
              <textarea
                id="failureReason"
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
                placeholder="Please provide the reason why the candidate failed..."
                className="w-full px-3 py-2 border border-red-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                rows="3"
                disabled={loading}
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleConfirmFailed}
                  disabled={!failureReason.trim() || loading}
                  className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Confirm Failed'}
                </button>
                <button
                  onClick={handleCancelFailed}
                  disabled={loading}
                  className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {selectedCandidateData && !showReasonInput && (
            <div className="flex gap-4 mb-4">
              <button
                onClick={handlePassedButtonClick}
                disabled={!selectedCandidate || loading}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Mark as PASSED'}
              </button>
              
              <button
                onClick={handleFailedButtonClick}
                disabled={!selectedCandidate || loading}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Mark as Failed'}
              </button>
            </div>
          )}

          {/* Message Display */}
          {message && (
            <div className={`p-3 rounded-md ${
              message.includes('successfully') || message.includes('PASSED')
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {message}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600 mt-2">Processing...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}