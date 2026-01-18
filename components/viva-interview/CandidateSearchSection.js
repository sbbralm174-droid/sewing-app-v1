'use client'
import { useState, useEffect, useRef } from 'react';

export default function CandidateSearchSection({ 
  onCandidateSelect, 
  searchError, 
  setSearchError,
  // এই ৪টি প্রপস প্যারেন্ট থেকে পাঠাতে হবে যাতে ডাটা সেভ থাকে
  floor, 
  setFloor, 
  searchDate, 
  setSearchDate 
}) {
  const [candidates, setCandidates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  
  const dropdownRef = useRef(null);

  // ক্লিক বাইরে হলে ড্রপডাউন বন্ধ করার লজিক
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ক্যান্ডিডেট ফেচ করার ফাংশন
  const fetchEligibleCandidates = async (queryText = '') => {
    setDropdownLoading(true);
    try {
      // API call with current date and floor
      const url = `/api/iep-interview/eligible-candidates-iep?date=${searchDate}&floor=${floor}`;
      const response = await fetch(url);
      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        let data = result.data;

        // ক্লায়েন্ট সাইড ফিল্টারিং (Search Query থাকলে)
        if (queryText.trim()) {
          data = data.filter(c =>
            c.candidateId?.toLowerCase().includes(queryText.toLowerCase()) ||
            c.name?.toLowerCase().includes(queryText.toLowerCase()) ||
            c.nid?.includes(queryText)
          );
        }

        setCandidates(data);
        setFilteredCandidates(data);
      } else {
        setCandidates([]);
        setFilteredCandidates([]);
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
      setSearchError('Failed to load candidate list');
    } finally {
      setDropdownLoading(false);
    }
  };

  // তারিখ, ফ্লোর বা সার্চ কুয়েরি পরিবর্তন হলে অটো-লোড
  useEffect(() => {
    // যদি ড্রপডাউন ওপেন থাকে অথবা অলরেডি কোনো ফ্লোর সিলেক্ট করা থাকে
    if (showDropdown || floor) {
      const delayDebounceFn = setTimeout(() => {
        fetchEligibleCandidates(searchQuery);
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchQuery, showDropdown, floor, searchDate]);

  const handleCandidateSelect = (candidate) => {
    onCandidateSelect(candidate);
    setSearchQuery(`${candidate.candidateId} - ${candidate.name}`);
    setShowDropdown(false);
    setSearchError('');
  };

  return (
    <div className="mb-6 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h2 className="text-xl font-bold text-center text-indigo-900 mb-6">
        Assessment Part - Step Three (IE)
      </h2>
      
      <div className="max-w-md mx-auto" ref={dropdownRef}>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Date Picker */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Interview Date:</label>
            <input 
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="w-full p-2.5 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Floor Filter */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Floor:</label>
            <select
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              className="w-full p-2.5 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Floors</option>
              <option value="SHAPLA">SHAPLA</option>
              <option value="PODDO">PODDO</option>
              <option value="KODOM">KODOM</option>
              <option value="BELLY">BELLY</option>
            </select>
          </div>
        </div>
        
        <div className="relative">
          <label className="block mb-2 text-sm font-medium text-gray-700">Search Candidate:</label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onClick={() => { if(!showDropdown) setShowDropdown(true); }}
              placeholder="ID, Name, or NID..."
              className="w-full p-3 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
            />
            {dropdownLoading && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
              </div>
            )}
          </div>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-xl max-h-64 overflow-y-auto">
              {filteredCandidates.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  {dropdownLoading ? 'Searching...' : 'No eligible candidates found for this date/floor'}
                </div>
              ) : (
                filteredCandidates.map((candidate) => (
                  <div
                    key={candidate._id}
                    onClick={() => handleCandidateSelect(candidate)}
                    className="p-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-b-0 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-1">
                        <div className="font-bold text-indigo-700">{candidate.candidateId}</div>
                        <div className="text-sm font-medium text-gray-800">{candidate.name}</div>
                        <div className="flex justify-between mt-1 text-xs text-gray-500">
                          <span>NID: {candidate.nid || 'N/A'}</span>
                          <span className="bg-indigo-100 text-indigo-700 px-2 rounded-full font-semibold">
                            {candidate.floor}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        {searchError && <p className="mt-2 text-sm text-red-600">{searchError}</p>}
      </div>
    </div>
  );
}