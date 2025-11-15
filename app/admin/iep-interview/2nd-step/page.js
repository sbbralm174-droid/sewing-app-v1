// app/admin/iep-interview/2nd-step

'use client';

import { useState, useEffect } from 'react';
import NidOrBirthCertificateSearch from '@/components/nidOrBirthCertificate';

export default function InterviewStepOne() {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedCandidateData, setSelectedCandidateData] = useState(null);
  const [failureReason, setFailureReason] = useState('');
  const [showReasonInput, setShowReasonInput] = useState(false);
  
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

      console.log('Raw API response:', stepOneData); // Debugging

      // Validate data structure - ensure required fields exist
      const validatedCandidates = stepOneData.filter(candidate => 
        candidate && 
        candidate.candidateId && 
        candidate.name // name must exist
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
        console.log('Filtered candidates:', filteredCandidates); // Debugging
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
      // Reset failure reason when candidate changes
      setFailureReason('');
      setShowReasonInput(false);
      setMessage(''); // Clear any previous messages
    } else {
      setSelectedCandidateData(null);
    }
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
      
      // Prepare validated data with fallbacks for required fields
      const requestData = {
        candidateId: selectedCandidate,
        result: resultValue,
        interviewData: {
          ...selectedCandidateData,
          name: selectedCandidateData.name || 'Unknown',
          nid: selectedCandidateData.nid || null,
          birthCertificate: selectedCandidateData.birthCertificate || null,
          // Ensure all required fields have values
          candidateId: selectedCandidateData.candidateId || selectedCandidate
        },
        failureReason: resultValue === 'FAILED' ? failureReason : null
      };

      console.log("Sending validated data:", requestData);
      
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
        fetchCandidates(); // Refresh the list
      } else {
        // More detailed error message
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
    // Automatically focus on the reason input when it appears
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            IEP Interview - Step One
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
                // Validate required fields before rendering
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

          {/* Failure Reason Input - শুধু failed বাটন ক্লিক করলে show হবে */}
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