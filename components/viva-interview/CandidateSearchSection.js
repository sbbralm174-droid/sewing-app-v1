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
  const [floor, setFloor] = useState(''); // Add floor state
  const [filteredCandidates, setFilteredCandidates] = useState([]); // Add filtered candidates state
  
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
      let passedCandidatesData = []; // Store passed candidates with floor info
      try {
        const passedResponse = await fetch('/api/iep-interview/iep-interview-down-admin/get');
        if (passedResponse.ok) {
          const passedData = await passedResponse.json();
          passedCandidateIds = passedData
            .filter(item => item.result === "PASSED")
            .map(item => item.candidateId);
          
          passedCandidatesData = passedData
            .filter(item => item.result === "PASSED")
            .map(item => ({
              candidateId: item.candidateId,
              floor: item.floor || '' // Get floor information
            }));
          
          console.log('✅ Passed candidate IDs with floors:', passedCandidatesData);
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

        // Add floor information to candidates
        filteredCandidates = filteredCandidates.map(candidate => {
          const passedData = passedCandidatesData.find(p => p.candidateId === candidate.candidateId);
          return {
            ...candidate,
            floor: passedData?.floor || ''
          };
        });

        // Apply floor filter if selected
        if (floor) {
          filteredCandidates = filteredCandidates.filter(candidate => 
            candidate.floor === floor
          );
        }

        // Apply search query filter
        if (query.trim()) {
          filteredCandidates = filteredCandidates.filter(candidate =>
            candidate.candidateId?.toLowerCase().includes(query.toLowerCase()) ||
            candidate.name?.toLowerCase().includes(query.toLowerCase()) ||
            candidate.nid?.includes(query)
          );
        }

        setCandidates(filteredCandidates);
        setFilteredCandidates(filteredCandidates); // Store filtered candidates
        console.log('🎯 Final available candidates:', filteredCandidates);
      } else {
        setCandidates([]);
        setFilteredCandidates([]);
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
      setCandidates([]);
      setFilteredCandidates([]);
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
  }, [searchQuery, showDropdown, existingCandidateIds, floor]); // Add floor dependency

  // Handle floor change
  const handleFloorChange = (e) => {
    const selectedFloor = e.target.value;
    setFloor(selectedFloor);
    
    // If dropdown is open, refetch with new floor filter
    if (showDropdown) {
      fetchCandidates(searchQuery);
    }
  };

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
        // Get floor information for this candidate
        const passedResponse = await fetch('/api/iep-interview/iep-interview-down-admin/get');
        if (passedResponse.ok) {
          const passedData = await passedResponse.json();
          const passedCandidate = passedData.find(item => 
            item.candidateId === id && item.result === "PASSED"
          );
          
          const candidateWithFloor = {
            ...result.data[0],
            floor: passedCandidate?.floor || ''
          };
          
          onCandidateSelect(candidateWithFloor);
          setSearchError('');
        } else {
          onCandidateSelect(result.data[0]);
          setSearchError('');
        }
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

  // Get available floors from candidates
  const getAvailableFloors = () => {
    const floors = candidates.map(candidate => candidate.floor).filter(Boolean);
    const uniqueFloors = [...new Set(floors)];
    return uniqueFloors;
  };

  return (
    <div className="mb-6 p-6 bg-white border border-gray-200 rounded-lg">
      <h2 className="text-xl font-bold text-center text-indigo-900 mb-4">
        Assessment Part - Step Three (IE)
      </h2>
      
      <div className="max-w-md mx-auto" ref={dropdownRef}>
        {/* Floor Filter */}
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Filter by Floor:
          </label>
          <select
            value={floor}
            onChange={handleFloorChange}
            className="w-full p-3 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Floors</option>
            <option value="SHAPLA">Shapla</option>
            <option value="PODDO">Poddo</option>
            <option value="KODOM">Kodom</option>
            <option value="BELLY">Belly</option>
          </select>
          {floor && (
            <p className="text-sm text-gray-500 mt-1">
              Showing candidates from {floor} floor
            </p>
          )}
        </div>
        
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
              {filteredCandidates.length === 0 ? (
                <div className="p-3 text-center text-gray-500">
                  {dropdownLoading ? 'Loading...' : 
                   floor ? `No available candidates found for ${floor} floor` : 
                   'No available candidates found'}
                </div>
              ) : (
                filteredCandidates.map((candidate) => (
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
                        {candidate.floor && (
                          <div className="text-xs text-indigo-600 font-medium mt-1">
                            Floor: {candidate.floor}
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
      </div>
    </div>
  );
}