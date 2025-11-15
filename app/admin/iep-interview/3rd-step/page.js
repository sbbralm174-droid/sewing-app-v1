// components/VivaInterviewStep2.js
'use client'
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SidebarNavLayout from '@/components/SidebarNavLayout';
import NidOrBirthCertificateSearch from '@/components/nidOrBirthCertificate';

export default function VivaInterviewStep2() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const candidateId = searchParams.get('candidateId');
  
  const [candidateInfo, setCandidateInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [manualSearchId, setManualSearchId] = useState('');
  
  // New states for dropdown search
  const [candidates, setCandidates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  
  // Search related states for View Details
  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [searchKey, setSearchKey] = useState(0);
  
  // API থেকে প্রাপ্ত candidateId গুলো স্টোর করার স্টেট
  const [existingCandidateIds, setExistingCandidateIds] = useState([]);
  
  const [formData, setFormData] = useState({
    videos: [],
    interviewDate: '',
    interviewer: '',
    department: '',
    vivaDetails: [{ question: '', answer: '', remark: '' }],
    processAndScore: {},
    grade: 'C',
    result: 'PENDING',
    remarks: '',
    promotedToAdmin: false,
    canceledReason: ''
  });
  
  const [processes, setProcesses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [videoName, setVideoName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [timeInputs, setTimeInputs] = useState({});
  
  const videoFilesRef = useRef(null);
  const dropdownRef = useRef(null);

  // Load processes on component mount
  useEffect(() => {
    const fetchProcesses = async () => {
      try {
        const response = await fetch('/api/processes');
        if (response.ok) {
          const data = await response.json();
          setProcesses(data);
        }
      } catch (error) {
        console.error('Error fetching processes:', error);
      }
    };

    fetchProcesses();
  }, []);

  // Auto-load candidate data if candidateId is in URL
  useEffect(() => {
    if (candidateId) {
      loadCandidateData(candidateId);
    } else {
      setLoading(false);
    }
  }, [candidateId]);

  // API থেকে বিদ্যমান candidateId গুলো লোড করুন
  useEffect(() => {
    const fetchExistingCandidateIds = async () => {
      try {
        const response = await fetch('/api/iep-interview/step-two/search');
        if (response.ok) {
          const data = await response.json();
          // শুধুমাত্র candidateId গুলো এক্সট্রাক্ট করুন
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

  // Fetch all candidates for dropdown (বিদ্যমান candidateId বাদ দিয়ে)
  const fetchCandidates = async (query = '') => {
    setDropdownLoading(true);
    try {
        // Step 1: সকল প্রার্থী ফেচ করুন
        const response = await fetch('/api/iep-interview/step-one/search/get-all');
        if (!response.ok) {
            throw new Error(`Failed to fetch candidates: HTTP status ${response.status}`);
        }

        const result = await response.json();

        // Step 2: শুধুমাত্র PASSED প্রার্থীদের লিস্ট ফেচ করুন
        let passedCandidateIds = [];
        try {
            const passedResponse = await fetch('/api/iep-interview/iep-interview-down-admin/get');
            if (passedResponse.ok) {
                const passedData = await passedResponse.json();
                // ✅ শুধুমাত্র PASSED প্রার্থীদের candidateId সংগ্রহ করুন
                passedCandidateIds = passedData
                    .filter(item => item.result === "PASSED")
                    .map(item => item.candidateId);
                console.log('✅ Passed candidate IDs:', passedCandidateIds);
            }
        } catch (passedError) {
            console.error('Error fetching passed candidates:', passedError);
        }

        if (Array.isArray(result) && result.length > 0) {
            // 🔥 শুধুমাত্র PASSED প্রার্থীদের রাখুন
            let filteredCandidates = result.filter(candidate =>
                passedCandidateIds.includes(candidate.candidateId)
            );

            // 🔥 বিদ্যমান candidateId (যারা ইতিমধ্যে step 2 completed) বাদ দিন
            filteredCandidates = filteredCandidates.filter(candidate =>
                !existingCandidateIds.includes(candidate.candidateId)
            );

            // Search query দিয়ে ফিল্টার করুন
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
      // Check if candidate already exists in step 2
      const step2Response = await fetch(`/api/iep-interview/step-two/verify?candidateId=${candidateId}`);
      if (step2Response.ok) {
        const step2Data = await step2Response.json();
        if (step2Data.exists) {
          return { eligible: false, reason: 'This candidate has already completed Step 2 interview.' };
        }
      }

      // Check if candidate failed in step 1
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
      // If verification fails, proceed with caution
      return { eligible: true };
    }
  };

  const loadCandidateData = async (id) => {
    setSearchLoading(true);
    setSearchError('');
    
    try {
        // First verify candidate eligibility
        const verification = await verifyCandidateEligibility(id);
        if (!verification.eligible) {
          setSearchError(verification.reason);
          setCandidateInfo(null);
          setSearchQuery(''); // Clear search query
          return;
        }

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
        setSearchLoading(false);
        setLoading(false);
    }
};

  const handleManualSearch = async (e) => {
    e.preventDefault();
    if (!manualSearchId.trim()) {
      setSearchError('Please enter a Candidate ID');
      return;
    }
    
    // Verify candidate eligibility before loading
    const verification = await verifyCandidateEligibility(manualSearchId.trim());
    if (!verification.eligible) {
      setSearchError(verification.reason);
      setCandidateInfo(null);
      setManualSearchId(''); // Clear manual search input
      return;
    }
    
    loadCandidateData(manualSearchId.trim());
  };

  // Handle candidate selection from dropdown
  const handleCandidateSelect = async (candidate) => {
    const selectedCandidateId = candidate.candidateId;
    
    // Real-time verification
    const verification = await verifyCandidateEligibility(selectedCandidateId);
    if (!verification.eligible) {
      setSearchError(verification.reason);
      setCandidateInfo(null);
      setSearchQuery(''); // Clear search query
      
      // Update existing candidate IDs and refresh dropdown
      setExistingCandidateIds(prev => [...prev, selectedCandidateId]);
      fetchCandidates(searchQuery); // Refresh dropdown
      return;
    }

    // ✅ সব চেক পাস করলে candidate সেট করুন
    setCandidateInfo(candidate);
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    if (name === 'result' && (value === 'PENDING' || value === 'FAILED') && formData.promotedToAdmin) {
      setFormData(prev => ({ 
        ...prev, 
        [name]: newValue,
        promotedToAdmin: false 
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: newValue }));
    }
    
    if (successMessage) setSuccessMessage('');
    if (errorMessage) setErrorMessage('');
  };

  const handleVideoSelect = () => {
    const file = videoFilesRef.current?.files[0];
    if (!file || !videoName) {
      setErrorMessage('❌ Please select a video file and enter a name');
      return;
    }

    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('❌ Please select a valid video file (MP4, WebM, OGG)');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage('❌ Video size should be less than 50MB');
      return;
    }

    const localUrl = URL.createObjectURL(file);
    const newVideo = {
      name: videoName,
      url: localUrl,
      originalName: file.name,
      file: file
    };
    
    setFormData(prev => ({
      ...prev,
      videos: [...prev.videos, newVideo]
    }));
    
    setVideoName('');
    videoFilesRef.current.value = '';
    setSuccessMessage('✅ Video added successfully!');
  };

  const uploadFile = async (file, type) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload ${type}`);
    }

    const result = await response.json();
    return result.url;
  };

  const uploadAllFiles = async () => {
    const uploadedUrls = {
      videos: []
    };

    setUploading(true);
    setUploadProgress(0);

    try {
      let progress = 0;
      const progressIncrement = 100 / Math.max(formData.videos.length, 1);

      for (let i = 0; i < formData.videos.length; i++) {
        const video = formData.videos[i];
        if (video.file) {
          const videoUrl = await uploadFile(video.file, 'video');
          uploadedUrls.videos.push({
            name: video.name,
            url: videoUrl,
            originalName: video.originalName
          });
        } else {
          uploadedUrls.videos.push(video);
        }
        
        progress += progressIncrement;
        setUploadProgress(Math.min(Math.round(progress), 95));
      }

      setUploadProgress(100);
      return uploadedUrls;

    } catch (error) {
      console.error('Upload error:', error);
      throw new Error('Video upload failed');
    } finally {
      setUploading(false);
    }
  };

  const calculateScore = (timeValue) => {
    if (!timeValue || timeValue <= 0) return 0;
    const score = Math.round(3600 / timeValue);
    return Math.min(score, 1000);
  };

  const handleTimeInputChange = (processName, timeValue) => {
    setTimeInputs(prev => ({
      ...prev,
      [processName]: timeValue
    }));

    const score = calculateScore(timeValue);
    setFormData(prev => ({
      ...prev,
      processAndScore: {
        ...prev.processAndScore,
        [processName]: score
      }
    }));
  };

  const handleProcessToggle = (processName) => {
    setFormData(prev => {
      const newProcesses = { ...prev.processAndScore };
      
      if (newProcesses[processName] !== undefined) {
        delete newProcesses[processName];
      } else {
        newProcesses[processName] = 0;
      }
      
      return { 
        ...prev, 
        processAndScore: newProcesses
      };
    });

    if (formData.processAndScore[processName] !== undefined) {
      setTimeInputs(prev => {
        const newTimeInputs = { ...prev };
        delete newTimeInputs[processName];
        return newTimeInputs;
      });
    }
  };

  const handleScoreChange = (processName, score) => {
    const finalScore = Math.min(Math.max(0, parseInt(score) || 0), 1000);
    setFormData(prev => ({
      ...prev,
      processAndScore: {
        ...prev.processAndScore,
        [processName]: finalScore
      }
    }));
  };

  const handleVivaDetailChange = (index, field, value) => {
    const updatedVivaDetails = [...formData.vivaDetails];
    updatedVivaDetails[index][field] = value;
    setFormData(prev => ({ ...prev, vivaDetails: updatedVivaDetails }));
  };

  const addVivaDetail = () => {
    setFormData(prev => ({
      ...prev,
      vivaDetails: [...prev.vivaDetails, { question: '', answer: '', remark: '' }]
    }));
  };

  const removeVivaDetail = (index) => {
    if (formData.vivaDetails.length > 1) {
      const updatedVivaDetails = [...formData.vivaDetails];
      updatedVivaDetails.splice(index, 1);
      setFormData(prev => ({ ...prev, vivaDetails: updatedVivaDetails }));
    }
  };

  const removeVideo = (index) => {
    const updatedVideos = [...formData.videos];
    updatedVideos.splice(index, 1);
    setFormData(prev => ({ ...prev, videos: updatedVideos }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!candidateInfo) {
      setErrorMessage('Please search and select a candidate first');
      return;
    }

    // Validate required fields
    if (!formData.interviewDate || !formData.interviewer || !formData.department) {
      setErrorMessage('Interview date, interviewer, and department are required');
      return;
    }

    try {
      setSubmitting(true);

      // Upload videos
      let uploadedVideos = formData.videos;
      if (formData.videos.some(video => video.file)) {
        const uploadedUrls = await uploadAllFiles();
        uploadedVideos = uploadedUrls.videos;
      }

      // Submit interview details
      const submissionData = {
        candidateId: candidateInfo.candidateId,
        ...formData,
        videos: uploadedVideos,
        processAndScore: Object.fromEntries(
          Object.entries(formData.processAndScore).map(([key, value]) => [
            key, 
            Math.min(1000, Math.max(0, parseInt(value) || 0))
          ])
        )
      };

      const response = await fetch('/api/iep-interview/step-two', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccessMessage('✅ Interview completed successfully!');
        
        // 🔥 সফল সাবমিশনের পর existing candidateIds আপডেট করুন
        setExistingCandidateIds(prev => [...prev, candidateInfo.candidateId]);
        
        // Refresh dropdown to remove the selected candidate
        await fetchCandidates(searchQuery);
        
        // Reset form and redirect after 2 seconds
        setTimeout(() => {
          router.push('/admin/viva-interview/step2-list');
        }, 2000);
        
      } else {
        setErrorMessage(`❌ ${result.error || 'Failed to complete interview'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('❌ ' + error.message);
    } finally {
      setSubmitting(false);
    }
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

  const filteredProcesses = processes.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex">
      <SidebarNavLayout/>
      
      <div className="flex-1 max-w-2xl mx-auto p-4 mt-16 overflow-y-auto">
        <div className="w-full max-w-6xl mx-auto bg-white p-6 rounded-lg shadow-lg">
          {/* Search Section */}
          {!candidateInfo && (
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
          )}

          {/* Candidate Info Header */}
          {candidateInfo && (
            <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-indigo-900">Skill Matrix</h1>
                <p className="text-gray-600 mt-2">All information related to the candidate&apos;s skills</p>
              </div>
              
              {/* Candidate Details with View Details Button - উপরের UI এর মতো */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Candidate Details
                  </h3>
                  
                  {/* View Details Button - উপরের UI এর মতো */}
                  <button 
                    onClick={handleSearch}
                    disabled={!candidateInfo.nid && !candidateInfo.birthCertificate}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 text-sm"
                  >
                    <span>🔍 View Details</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p><strong>Name:</strong> {candidateInfo.name || 'N/A'}</p>
                    <p><strong>Candidate ID:</strong> {candidateInfo.candidateId || 'N/A'}</p>
                    {candidateInfo.nid ? (
                      <p><strong>NID:</strong> {candidateInfo.nid}</p>
                    ) : candidateInfo.birthCertificate ? (
                      <p><strong>Birth Certificate:</strong> {candidateInfo.birthCertificate}</p>
                    ) : (
                      <p className="text-red-500 text-sm">
                        ⚠️ No NID or Birth Certificate available for search
                      </p>
                    )}
                  </div>
                  {candidateInfo.picture && (
                    <div>
                      <p><strong>Picture:</strong></p>
                      <img 
                        src={candidateInfo.picture} 
                        alt={candidateInfo.name || 'Candidate'}
                        className="w-24 h-24 object-cover rounded-md mt-2"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
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

          {/* Success and Error Messages */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-center">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-center">
              {errorMessage}
            </div>
          )}

          {uploading && (
            <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded-md">
              <div className="flex justify-between items-center">
                <span>Uploading videos... {uploadProgress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Interview Form - Only show when candidate is selected */}
          {candidateInfo && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Interview Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-lg font-medium text-black-700">
                    Interview Date:
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="date"
                    name="interviewDate"
                    value={formData.interviewDate}
                    onChange={handleChange}
                    className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-lg font-medium text-black-700">
                    Interviewer:
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    name="interviewer"
                    value={formData.interviewer}
                    onChange={handleChange}
                    className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-lg font-medium text-black-700">
                    Department:
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
                    required
                  />
                </div>
              </div>

              {/* Videos Section */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-3 text-indigo-600">Process Videos</h2>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Video Name:</label>
                      <input
                        type="text"
                        value={videoName}
                        onChange={(e) => setVideoName(e.target.value)}
                        placeholder="Enter video name/description"
                        className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
                        disabled={uploading}
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Select Video:</label>
                      <input
                        ref={videoFilesRef}
                        type="file"
                        accept="video/*"
                        className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
                        disabled={uploading}
                      />
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleVideoSelect}
                    disabled={uploading || !videoName || !videoFilesRef.current?.files[0]}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
                  >
                    + Add Video
                  </button>

                  {formData.videos.length > 0 && (
                    <div className="mt-3">
                      <h3 className="text-sm font-medium mb-2 text-gray-700">Selected Videos:</h3>
                      <div className="space-y-2">
                        {formData.videos.map((video, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-indigo-100 rounded flex items-center justify-center">
                                <span className="text-xs">🎥</span>
                              </div>
                              <div>
                                <div className="font-medium text-sm text-gray-900">{video.name}</div>
                                <div className="text-xs text-gray-500">{video.originalName}</div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeVideo(index)}
                              className="text-red-600 hover:text-red-500 text-sm transition-colors"
                              disabled={uploading}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Viva Details Section */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-3 text-indigo-600">Viva Details</h2>
                
                {formData.vivaDetails.map((detail, index) => (
                  <div key={index} className="mb-4 p-3 border border-gray-200 rounded-md bg-white">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium text-gray-700">Question {index + 1}</h3>
                      {formData.vivaDetails.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVivaDetail(index)}
                          className="text-red-600 hover:text-red-500 text-sm transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Question:</label>
                        <input
                          type="text"
                          value={detail.question}
                          onChange={(e) => handleVivaDetailChange(index, 'question', e.target.value)}
                          className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Answer:</label>
                        <textarea
                          value={detail.answer}
                          onChange={(e) => handleVivaDetailChange(index, 'answer', e.target.value)}
                          className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
                          rows="2"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Remark:</label>
                        <input
                          type="text"
                          value={detail.remark}
                          onChange={(e) => handleVivaDetailChange(index, 'remark', e.target.value)}
                          className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addVivaDetail}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors"
                >
                  + Add Another Question
                </button>
              </div>

              {/* Process and Score Section */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-3 text-indigo-600">Process and Score</h2>
                
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Search Process:
                  </label>
                  <input
                    type="text"
                    placeholder="Search process..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full mb-3 p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
                  />

                  <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md p-2 bg-white">
                    {filteredProcesses.map((process) => {
                      const isSelected = formData.processAndScore[process.name] !== undefined;
                      const currentTime = timeInputs[process.name] || '';
                      const currentScore = formData.processAndScore[process.name] || 0;

                      return (
                        <div key={process._id} className="mb-3 p-2 border border-gray-200 rounded-md bg-gray-50">
                          <div className="flex items-center gap-2 mb-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleProcessToggle(process.name)}
                              className="rounded border-gray-300 bg-white text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="flex-1 font-medium text-gray-900">{process.name}</span>
                          </div>

                          {isSelected && (
                            <div className="ml-6 space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block mb-1 text-xs font-medium text-gray-700">
                                    Time (seconds):
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    placeholder="Enter time"
                                    value={currentTime}
                                    onChange={(e) => handleTimeInputChange(process.name, parseFloat(e.target.value))}
                                    className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-1 focus:ring-indigo-500 text-sm"
                                  />
                                </div>

                                <div>
                                  <label className="block mb-1 text-xs font-medium text-gray-700">
                                    Score
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="1000"
                                    value={currentScore}
                                    onChange={(e) => handleScoreChange(process.name, e.target.value)}
                                    className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-1 focus:ring-indigo-500 text-sm"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Result Section */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-3 text-indigo-600">Result</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">Grade:</label>
                    <select
                      name="grade"
                      value={formData.grade}
                      onChange={handleChange}
                      className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
                      required
                    >
                      <option value="A">A</option>
                      <option value="A+">A+</option>
                      <option value="A++">A++</option>
                      <option value="B">B</option>
                      <option value="B+">B+</option>
                      <option value="B++">B++</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                      <option value="E">E</option>
                      <option value="F">F</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">Result:</label>
                    <select
                      name="result"
                      value={formData.result}
                      onChange={handleChange}
                      className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
                      required
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="PASSED">PASSED</option>
                      <option value="FAILED">FAILED</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="promotedToAdmin"
                      checked={formData.promotedToAdmin}
                      onChange={handleChange}
                      disabled={formData.result === 'PENDING' || formData.result === 'FAILED'}
                      className="mr-2 h-4 w-4 rounded border-gray-300 bg-white text-indigo-600 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <label className={`text-sm font-medium ${(formData.result === 'PENDING' || formData.result === 'FAILED') ? 'text-gray-500' : 'text-gray-700'}`}>
                      Promoted to Admin
                    </label>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block mb-1 text-sm font-medium text-gray-700">Remarks:</label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
                    rows="3"
                  />
                </div>

                {formData.result === 'FAILED' && (
                  <div className="mt-4">
                    <label className="block mb-1 text-sm font-medium text-gray-700">Canceled Reason:</label>
                    <input
                      type="text"
                      name="canceledReason"
                      value={formData.canceledReason}
                      onChange={handleChange}
                      className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
                    />
                  </div>
                )}
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setCandidateInfo(null);
                    setSearchQuery('');
                    setManualSearchId('');
                    setSearchError('');
                  }}
                  className="px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-md shadow-sm font-medium transition-colors"
                >
                  Back to Search
                </button>

                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-3 rounded-md shadow-sm font-medium transition-colors"
                >
                  {submitting ? 'Submitting...' : 'Complete Interview'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}