// app/viva-interview/page.js
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SidebarNavLayout from '@/components/SidebarNavLayout';
import CandidateSearchSection from '@/components/viva-interview/CandidateSearchSection';
import CandidateInfoHeader from '@/components/viva-interview/CandidateInfoHeader';
import InterviewForm from '@/components/viva-interview/InterviewForm';
import NidOrBirthCertificateSearch from '@/components/NidOrBirthCertificate';

export default function VivaInterviewClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const candidateId = searchParams.get('candidateId');

  const [candidateInfo, setCandidateInfo] = useState(null);
  const [apiData, setApiData] = useState(null); // API ডেটা স্টেট
  const [loading, setLoading] = useState(true);
  const [searchError, setSearchError] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [searchKey, setSearchKey] = useState(0);

  // Handle candidate selection from search
  const handleCandidateSelect = async (candidate) => {
    console.log('Candidate selected:', candidate);
    setCandidateInfo(candidate);
    
    // API থেকে ডেটা লোড করুন
    try {
      const response = await fetch(`/api/iep-interview/step-one/search?candidateId=${candidate.candidateId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setApiData(result.data); // API ডেটা সেট করুন
          console.log('API Data loaded:', result.data);
        }
      }
    } catch (error) {
      console.error('Error loading API data:', error);
    }
  };

  const handleSearch = () => {
    if (!candidateInfo) {
      alert('Please select a candidate first');
      return;
    }
    
    const nid = candidateInfo.nid?.trim();
    const birth = candidateInfo.birthCertificate?.trim();
    
    if (!nid && !birth) {
      alert('No NID or Birth Certificate found');
      return;
    }
    
    const value = nid || birth;
    setSearchValue(value);
    setSearchKey(prev => prev + 1);
    setShowSearch(true);
  };

  const handleBackToSearch = () => {
    setCandidateInfo(null);
    setApiData(null); // API ডেটা রিসেট করুন
    setShowSearch(false);
    setSearchError('');
    if (candidateId) {
      router.replace('/viva-interview');
    }
  };

  const loadCandidateData = async (id) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/iep-interview/step-one/search?candidateId=${id}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setCandidateInfo(result.data);
          setApiData(result.data); // API ডেটা সেট করুন
        }
      }
    } catch (error) {
      console.error('Error loading candidate:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (candidateId) {
      loadCandidateData(candidateId);
    } else {
      setLoading(false);
    }
  }, [candidateId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex">
      <SidebarNavLayout />

      <div className="flex-1  mx-auto p-4 mt-16 overflow-y-auto">
        <div className="w-full max-w-6xl mx-auto bg-white p-6 rounded-lg shadow-lg">
          {!candidateInfo && (
            <CandidateSearchSection
              onCandidateSelect={handleCandidateSelect}
              searchError={searchError}
              setSearchError={setSearchError}
            />
          )}

          {candidateInfo && (
            <>
              {/* CandidateInfoHeader-এ candidateInfo এবং apiData প্রপস হিসেবে পাঠানো হচ্ছে */}
              <CandidateInfoHeader
                candidateInfo={candidateInfo}
                apiData={apiData} // API ডেটা পাঠানো হচ্ছে
                onSearch={handleSearch}
                onBackToSearch={handleBackToSearch}
              />
              
              {!showSearch && (
                <InterviewForm
                  candidateInfo={candidateInfo}
                  apiData={apiData} // InterviewForm-এও পাঠাতে পারেন যদি প্রয়োজন হয়
                  onBackToSearch={handleBackToSearch}
                />
              )}
            </>
          )}

          {showSearch && (
            <div className="mb-6">
              <NidOrBirthCertificateSearch
                key={searchKey}
                nidOrBirthCertificateValue={searchValue}
                autoSearch={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}