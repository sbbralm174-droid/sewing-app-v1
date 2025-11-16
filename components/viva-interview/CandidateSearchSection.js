// components/viva-interview/CandidateSearchSection.js
'use client'
import { useState, useEffect, useRef } from 'react';

export default function CandidateSearchSection({ onCandidateSelect, searchError, setSearchError }) {
  const [candidates, setCandidates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [manualSearchId, setManualSearchId] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [existingCandidateIds, setExistingCandidateIds] = useState([]);
  
  const dropdownRef = useRef(null);

  // API থেকে বিদ্যমান candidateId গুলো লোড করুন
  useEffect(() => {
    const fetchExistingCandidateIds = async () => {
      try {
        const response = await fetch('/api/iep-interview/step-two/search');
        if (response.ok) {
          const data = await response.json();
          const ids = data.map(candidate => candidate.candidateId);
          setExistingCandidateIds(ids);
          console.log('✅ Existing candidate IDs loaded:', ids);
        }
      } catch (error) {
        console.error('Error fetching existing candidate IDs:', error);
      }
    };

    fetchExistingCandidateIds();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch all candidates for dropdown
  const fetchCandidates = async (query = '') => {
    setDropdownLoading(true);
    try {
      const response = await fetch('/api/iep-interview/step-one/search/get-all');
      if (!response.ok) {
        throw new Error(`Failed to fetch candidates: HTTP status ${response.status}`);
      }

      const result = await response.json();

      let passedCandidateIds = [];
      try {
        const passedResponse = await fetch('/api/iep-interview/iep-interview-down-admin/get');
        if (passedResponse.ok) {
          const passedData = await passedResponse.json();
          passedCandidateIds = passedData
            .filter(item => item.result === "PASSED")
            .map(item => item.candidateId);
          console.log('✅ Passed candidate IDs:', passedCandidateIds);
        }
      } catch (passedError) {
        console.error('Error fetching passed candidates:', passedError);
      }

      if (Array.isArray(result) && result.length > 0) {
        let filteredCandidates = result.filter(candidate =>
          passedCandidateIds.includes(candidate.candidateId)
        );

        filteredCandidates = filteredCandidates.filter(candidate =>
          !existingCandidateIds.includes(candidate.candidateId)
        );

        if (query.trim()) {
          filteredCandidates = filteredCandidates.filter(candidate =>
            candidate.candidateId?.toLowerCase().includes(query.toLowerCase()) ||
            candidate.name?.toLowerCase().includes(query.toLowerCase()) ||
            candidate.nid?.includes(query)
          );
        }

        setCandidates(filteredCandidates);
        console.log('🎯 Final available candidates:', filteredCandidates);
      } else {
        setCandidates([]);
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
      setCandidates([]);
    } finally {
      setDropdownLoading(false);
    }
  };

  // Load dropdown candidates when search query changes
  useEffect(() => {
    if (showDropdown) {
      const delayDebounceFn = setTimeout(() => {
        fetchCandidates(searchQuery);
      }, 300);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchQuery, showDropdown, existingCandidateIds]);

  // Candidate verification function
  const verifyCandidateEligibility = async (candidateId) => {
    try {
      const step2Response = await fetch(`/api/iep-interview/step-two/verify?candidateId=${candidateId}`);
      if (step2Response.ok) {
        const step2Data = await step2Response.json();
        if (step2Data.exists) {
          return { eligible: false, reason: 'This candidate has already completed Step 2 interview.' };
        }
      }

      const failedResponse = await fetch('/api/iep-interview/iep-interview-down-admin/get');
      if (failedResponse.ok) {
        const failedData = await failedResponse.json();
        const isFailed = failedData.some(item => 
          item.candidateId === candidateId && item.result === "FAILED"
        );

        if (isFailed) {
          return { eligible: false, reason: 'This candidate has failed and cannot be added again.' };
        }
      }

      return { eligible: true };
    } catch (error) {
      console.error('Error verifying candidate:', error);
      return { eligible: true };
    }
  };

  const loadCandidateData = async (id) => {
    setSearchLoading(true);
    setSearchError('');
    
    try {
      const verification = await verifyCandidateEligibility(id);
      if (!verification.eligible) {
        setSearchError(verification.reason);
        setManualSearchId('');
        return;
      }

      const response = await fetch(`/api/iep-interview/step-one/search?candidateId=${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch candidate data');
      }

      const result = await response.json();
      console.log('Candidate Search Result:', result);
      
      if (result.success && result.data.length > 0) {
        onCandidateSelect(result.data[0]);
        setSearchError('');
      } else {
        setSearchError('Candidate not found. Please check the Candidate ID.');
      }
    } catch (error) {
      console.error('Error loading candidate:', error);
      setSearchError('Error loading candidate data');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleManualSearch = async (e) => {
    e.preventDefault();
    if (!manualSearchId.trim()) {
      setSearchError('Please enter a Candidate ID');
      return;
    }
    
    const verification = await verifyCandidateEligibility(manualSearchId.trim());
    if (!verification.eligible) {
      setSearchError(verification.reason);
      setManualSearchId('');
      return;
    }
    
    loadCandidateData(manualSearchId.trim());
  };

  // Handle candidate selection from dropdown
  const handleCandidateSelect = async (candidate) => {
    const selectedCandidateId = candidate.candidateId;
    
    const verification = await verifyCandidateEligibility(selectedCandidateId);
    if (!verification.eligible) {
      setSearchError(verification.reason);
      setSearchQuery('');
      setExistingCandidateIds(prev => [...prev, selectedCandidateId]);
      fetchCandidates(searchQuery);
      return;
    }

    onCandidateSelect(candidate);
    setSearchQuery(`${candidate.candidateId} - ${candidate.name}`);
    setShowDropdown(false);
    setSearchError('');
  };

  // Handle dropdown search input change
  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
    if (!showDropdown) {
      setShowDropdown(true);
    }
  };

  // Handle dropdown focus
  const handleSearchInputFocus = () => {
    if (candidates.length > 0) {
      setShowDropdown(true);
    }
  };

  // Open dropdown and load initial candidates
  const handleOpenDropdown = async () => {
    setShowDropdown(true);
    if (candidates.length === 0) {
      await fetchCandidates();
    }
  };

  return (
    <div className="mb-6 p-6 bg-white border border-gray-200 rounded-lg">
      <h2 className="text-xl font-bold text-center text-indigo-900 mb-4">
        Search Candidate
      </h2>
      <p className="text-center text-gray-600 mb-4">
        Search for candidate by ID, Name, or NID to continue with interview details
      </p>
      
      {/* Info Message */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-700 text-center">
          Only candidates who haven&apos;t completed Step 2 interview will be shown
        </p>
      </div>
      
      {/* Dropdown Search */}
      <div className="max-w-md mx-auto" ref={dropdownRef}>
        <div className="relative">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Search Candidate:
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchInputChange}
              onFocus={handleSearchInputFocus}
              onClick={handleOpenDropdown}
              placeholder="Search by Candidate ID, Name, or NID..."
              className="w-full p-3 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {dropdownLoading && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
              </div>
            )}
          </div>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {candidates.length === 0 ? (
                <div className="p-3 text-center text-gray-500">
                  {dropdownLoading ? 'Loading...' : 'No available candidates found'}
                </div>
              ) : (
                candidates.map((candidate) => (
                  <div
                    key={candidate._id}
                    onClick={() => handleCandidateSelect(candidate)}
                    className="p-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center space-x-3">
                      {candidate.picture && (
                        <img
                          src={candidate.picture}
                          alt={candidate.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {candidate.candidateId}
                        </div>
                        <div className="text-sm text-gray-600">
                          {candidate.name}
                        </div>
                        {candidate.nid && (
                          <div className="text-xs text-gray-500">
                            NID: {candidate.nid}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Manual Search Fallback */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-center text-sm text-gray-500 mb-2">Or enter Candidate ID manually</p>
          <form onSubmit={handleManualSearch} className="flex space-x-2">
            <input
              type="text"
              value={manualSearchId}
              onChange={(e) => setManualSearchId(e.target.value)}
              placeholder="Enter Candidate ID (e.g., GMST-00000001)"
              className="flex-1 p-3 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
            <button
              type="submit"
              disabled={searchLoading}
              className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-md font-medium transition-colors text-sm"
            >
              {searchLoading ? '...' : 'Search'}
            </button>
          </form>
        </div>
        
        {searchError && (
          <div className="mt-3 p-3 bg-red-100 text-red-700 rounded-md text-center">
            {searchError}
          </div>
        )}
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={() => router.push('/admin/viva-interview/step1')}
          className="text-indigo-600 hover:text-indigo-800 font-medium"
        >
          ← Go back to Step 1 to create new candidate
        </button>
      </div>
    </div>
  );
}