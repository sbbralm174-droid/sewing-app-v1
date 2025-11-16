// components/VivaInterviewStep2.js
'use client'
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SidebarNavLayout from '@/components/SidebarNavLayout';
import CandidateSearchSection from '@/components/viva-interview/CandidateSearchSection';
import CandidateInfoHeader from '@/components/viva-interview/CandidateInfoHeader';
import InterviewForm from '@/components/viva-interview/InterviewForm';
import NidOrBirthCertificateSearch from '@/components/nidOrBirthCertificate';

export default function VivaInterviewStep2() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const candidateId = searchParams.get('candidateId');
  
  const [candidateInfo, setCandidateInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchError, setSearchError] = useState('');
  
  // Search related states for View Details
  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [searchKey, setSearchKey] = useState(0);

  // Auto-load candidate data if candidateId is in URL
  useEffect(() => {
    if (candidateId) {
      loadCandidateData(candidateId);
    } else {
      setLoading(false);
    }
  }, [candidateId]);

  const loadCandidateData = async (id) => {
    setLoading(true);
    setSearchError('');
    
    try {
      const response = await fetch(`/api/iep-interview/step-one/search?candidateId=${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch candidate data');
      }

      const result = await response.json();
      console.log('Candidate Search Result:', result);
      
      if (result.success && result.data.length > 0) {
        setCandidateInfo(result.data[0]);
        setSearchError('');
      } else {
        setSearchError('Candidate not found. Please check the Candidate ID.');
        setCandidateInfo(null);
      }
    } catch (error) {
      console.error('Error loading candidate:', error);
      setSearchError('Error loading candidate data');
      setCandidateInfo(null);
    } finally {
      setLoading(false);
    }
  };

  // Search button click handler for View Details
  const handleSearch = () => {
    if (!candidateInfo) {
      alert('Please select a candidate first');
      return;
    }

    // Validate candidate data
    if (!candidateInfo.name) {
      alert('Selected candidate data is invalid');
      return;
    }

    const nidValue = candidateInfo.nid?.trim();
    const birthCertValue = candidateInfo.birthCertificate?.trim();
    
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

  const handleCandidateSelect = (candidate) => {
    setCandidateInfo(candidate);
    setSearchError('');
  };

  const handleBackToSearch = () => {
    setCandidateInfo(null);
    setShowSearch(false);
    setSearchError('');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex">
      <SidebarNavLayout/>
      
      <div className="flex-1 max-w-8xl mx-auto p-4 mt-16 overflow-y-auto">
        <div className="w-full max-w-6xl mx-auto bg-white p-6 rounded-lg shadow-lg">
          {/* Search Section */}
          {!candidateInfo && (
            <CandidateSearchSection 
              onCandidateSelect={handleCandidateSelect}
              searchError={searchError}
              setSearchError={setSearchError}
            />
          )}

          {/* Candidate Info Header */}
          {candidateInfo && (
            <CandidateInfoHeader 
              candidateInfo={candidateInfo}
              onSearch={handleSearch}
              onBackToSearch={handleBackToSearch}
            />
          )}

          {/* Search Component - View Details এর জন্য */}
          {showSearch && (
            <div className="mb-6">
              <NidOrBirthCertificateSearch 
                key={searchKey}
                nidOrBirthCertificateValue={searchValue}
                autoSearch={true}
              />
            </div>
          )}

          {/* Interview Form - Only show when candidate is selected */}
          {candidateInfo && !showSearch && (
            <InterviewForm 
              candidateInfo={candidateInfo}
              onBackToSearch={handleBackToSearch}
            />
          )}
        </div>
      </div>
    </div>
  );
}