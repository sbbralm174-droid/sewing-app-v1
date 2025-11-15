
'use client'
import { useState, useEffect, useRef, useCallback } from 'react';
import SidebarNavLayout from '@/components/SidebarNavLayout';
import Link from 'next/link';

export default function VivaInterviewForm() {
  const [formData, setFormData] = useState({
    name: '',
    nid: '',
    birthCertificate: '',
    picture: '',
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
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [videoName, setVideoName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [timeInputs, setTimeInputs] = useState({});
  const [previousInterviews, setPreviousInterviews] = useState([]);
  const [checkingPrevious, setCheckingPrevious] = useState(false);
  
  const photoFileRef = useRef(null);
  const videoFilesRef = useRef([]);
  const debounceTimerRef = useRef(null);

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
      } finally {
        setLoading(false);
      }
    };
    fetchProcesses();
  }, []);

  const checkPreviousInterviews = useCallback(async (nid, birthCertificate) => {
    if (!nid && !birthCertificate) {
      setPreviousInterviews([]);
      return;
    }

    setCheckingPrevious(true);
    
    try {
      const response = await fetch('/api/check-previous-interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nid, birthCertificate }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setPreviousInterviews(result.previousInterviews || []);
      }
    } catch (error) {
      console.error('Error checking previous interviews:', error);
    } finally {
      setCheckingPrevious(false);
    }
  }, []);

  const handleChange = (e) => {
  const { name, value, type, checked } = e.target;
  
  let newValue = type === 'checkbox' ? checked : value;
  
  // যদি result PENDING বা FAILED হয় এবং promotedToAdmin true থাকে, তাহলে false করে দিন
  if (name === 'result' && (value === 'PENDING' || value === 'FAILED') && formData.promotedToAdmin) {
    setFormData(prev => ({ 
      ...prev, 
      [name]: newValue,
      promotedToAdmin: false 
    }));
  } else {
    setFormData(prev => ({ 
      ...prev, 
      [name]: newValue 
    }));
  }
  
  if (successMessage) setSuccessMessage('');
  if (errorMessage) setErrorMessage('');
  
  if (formErrors[name]) {
    setFormErrors(prev => ({ ...prev, [name]: '' }));
  }
  
  if (name === 'nid' || name === 'birthCertificate') {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      checkPreviousInterviews(
        name === 'nid' ? value : formData.nid,
        name === 'birthCertificate' ? value : formData.birthCertificate
      );
    }, 500);
  }
};

  const validateForm = () => {
    const errors = {};
    if (!formData.nid && !formData.birthCertificate) {
      errors.idValidation = 'Either NID or Birth Certificate must be provided';
    }
    if (!photoFileRef.current && !formData.picture) {
      errors.picture = 'Candidate picture is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('❌ Please select a valid image file (JPEG, PNG, JPG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('❌ Image size should be less than 5MB');
      return;
    }

    photoFileRef.current = file;
    const localUrl = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, picture: localUrl }));
    setSuccessMessage('✅ Photo selected successfully! Will upload on form submission.');
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
    setSuccessMessage('✅ Video selected successfully! Will upload on form submission.');
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
      picture: formData.picture,
      videos: []
    };

    setUploading(true);
    setUploadProgress(0);

    try {
      if (photoFileRef.current) {
        setUploadProgress(20);
        uploadedUrls.picture = await uploadFile(photoFileRef.current, 'photo');
      }

      let progress = 20;
      const progressIncrement = 80 / Math.max(formData.videos.length, 1);

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
      throw new Error('File upload failed');
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

  const removePhoto = () => {
    setFormData(prev => ({ ...prev, picture: '' }));
    photoFileRef.current = null;
  };

  const submitFormData = async () => {
    setSuccessMessage('📤 Uploading files...');

    const uploadedUrls = await uploadAllFiles();

    const submissionData = {
      ...formData,
      picture: uploadedUrls.picture,
      videos: uploadedUrls.videos,
      nid: formData.nid || undefined,
      birthCertificate: formData.birthCertificate || undefined,
      processAndScore: Object.fromEntries(
        Object.entries(formData.processAndScore).map(([key, value]) => [
          key, 
          Math.min(1000, Math.max(0, parseInt(value) || 0))
        ])
      )
    };

    const response = await fetch('/api/iep-interview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionData),
    });

    const result = await response.json();

    if (response.ok) {
      setSuccessMessage(`✅ Viva Interview added successfully! Candidate ID: ${result.data.candidateId}`);
      resetForm();
    } else {
      setErrorMessage(`❌ ${result.error || 'Failed to create viva interview'}`);
    }
    
    setUploading(false);
    setUploadProgress(0);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      nid: '',
      birthCertificate: '',
      picture: '',
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
    photoFileRef.current = null;
    videoFilesRef.current = [];
    setSearchTerm('');
    setVideoName('');
    setTimeInputs({});
    setPreviousInterviews([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setFormErrors({});

    if (!validateForm()) return;

    try {
      setUploading(true);
      await submitFormData();
      
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('❌ ' + error.message);
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const filteredProcesses = processes.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen mt-6 bg-gray-50 text-gray-800 font-sans flex">
      <SidebarNavLayout/>
      
      <div className="flex-1 p-4 mt-7 overflow-y-auto">
        <div className="w-full max-w-6xl mx-auto bg-white p-6 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold mb-6 text-center text-indigo-900">Add New Viva Interview</h1>
          <Link href="/admin/iep-interview/update" className="btn btn-danger top-4 left-4 text-sm text-indigo-600 hover:underline">update candidate</Link>
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
                <span>Uploading... {uploadProgress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-6 bg-white p-6 rounded-lg border border-gray-200"
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.preventDefault();
            }}
          >
            {/* Basic Information Section */}
            <div className=" p-4">
              {/* <h2 className="text-lg font-semibold mb-3 text-indigo-600">Basic Information</h2> */}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-lg font-medium text-black-700">Candidate Name:</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-lg font-medium text-black-700">Interview Date:</label>
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
                  <label className="block mb-1 text-lg font-medium text-black-700">Interviewer:</label>
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
                  <label className="block mb-1 text-lg font-medium text-black-700">Department:</label>
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
            </div>

            {/* Candidate Photo Section */}
            <div className=" p-4">
              {/* <h2 className="text-lg font-semibold mb-3 text-indigo-600">Candidate Photo</h2> */}
              
              <div className="space-y-3">
                {!formData.picture ? (
                  <div>
                    <label className="block mb-1 text-lg font-medium text-black-700">Select Photo:</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
                      disabled={uploading}
                    />
                    <div className="mt-1 text-xs text-gray-500">
                      Supported formats: JPEG, PNG, JPG, WebP (Max 5MB)
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <img 
                        src={formData.picture} 
                        alt="Candidate" 
                        className="w-20 h-20 object-cover rounded-md border border-gray-300"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-green-600">✅ Photo selected successfully</p>
                      <p className="text-xs text-gray-500">Will be uploaded when you submit the form</p>
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="mt-1 text-red-600 hover:text-red-500 text-sm"
                      >
                        Remove Photo
                      </button>
                    </div>
                  </div>
                )}
                {formErrors.picture && (
                  <div className="p-2 bg-red-50 text-red-700 rounded-md text-sm">
                    {formErrors.picture}
                  </div>
                )}
              </div>
            </div>

            {/* Interview Videos Section */}
            <div className=" p-4 ">
              {/* <h2 className="text-lg font-semibold mb-3 text-indigo-600">Interview Videos</h2> */}
              
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 text-lg font-medium text-black-700">Video Name:</label>
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

                <div className="text-xs text-gray-500">
                  Supported formats: MP4, WebM, OGG (Max 50MB per video)
                </div>

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
                              <div className="text-xs text-green-600">Ready for upload</div>
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

            {/* Identification Section */}
            <div className="p-4">
              {/* <h2 className="text-lg font-semibold mb-3 text-indigo-600">Identification</h2> */}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-lg font-medium text-black-700">NID Number:</label>
                  <input
                    type="text"
                    name="nid"
                    value={formData.nid}
                    onChange={handleChange}
                    placeholder="Enter NID number"
                    className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Birth Certificate ID:</label>
                  <input
                    type="text"
                    name="birthCertificate"
                    value={formData.birthCertificate}
                    onChange={handleChange}
                    placeholder="Enter birth certificate ID"
                    className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
                  />
                </div>
              </div>

              {checkingPrevious && (
                <div className="mt-3 p-2 bg-blue-50 text-blue-700 rounded-md text-sm">
                  🔍 Checking previous interviews...
                </div>
              )}

              {previousInterviews.length > 0 && !checkingPrevious && (
                <div className="mt-3 border border-yellow-300 rounded-md p-3 bg-yellow-50">
                  <h3 className="text-sm font-medium text-yellow-800 mb-2">
                    ⚠️ Previous Interviews Found ({previousInterviews.length})
                  </h3>
                  
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {previousInterviews.map((interview, index) => (
                      <div key={interview._id} className="p-2 bg-yellow-100 rounded-md border border-yellow-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{interview.name}</div>
                            <div className="text-xs text-gray-600">
                              ID: {interview.candidateId} | 
                              Date: {new Date(interview.interviewDate).toLocaleDateString()} | 
                              Dept: {interview.department}
                            </div>
                            <div className={`text-xs ${
                              interview.result === 'PASSED' ? 'text-green-600' : 
                              interview.result === 'FAILED' ? 'text-red-600' : 'text-yellow-600'
                            }`}>
                              Result: {interview.result}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 ml-2">
                            #{index + 1}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-2 text-xs text-yellow-700">
                    💡 This candidate has previous interview records. You can still proceed.
                  </div>
                </div>
              )}

              {formErrors.idValidation && (
                <div className="mt-2 p-2 bg-red-50 text-red-700 rounded-md text-sm">
                  {formErrors.idValidation}
                </div>
              )}

              <div className="mt-2 p-2 bg-blue-50 text-blue-700 rounded-md text-sm">
                💡 You must provide either NID or Birth Certificate ID
              </div>
            </div>

            {/* Viva Details Section */}
            <div className="p-4 ">
              {/* <h2 className="text-lg font-semibold mb-3 text-indigo-600">Viva Details</h2> */}
              
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
            <div className="p-4">
              {/* <h2 className="text-lg font-semibold mb-3 text-indigo-600">Process and Score</h2> */}
              
              <div>
                <label className="block mb-1 text-lg font-medium text-black-700">
                  Process Scores
                  <span className="ml-2 text-xs text-gray-500">
                    ({Object.keys(formData.processAndScore).length} selected)
                  </span>
                </label>
                
                <input
                  type="text"
                  placeholder="Search process..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full mb-2 p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
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
                                  <span className="text-red-500 ml-1">*</span>
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
                                <div className="text-xs text-green-600 mt-1">
                                  Auto-calculated from time
                                </div>
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
            <div className="p-4">
              {/* <h2 className="text-lg font-semibold mb-3 text-indigo-600">Result</h2> */}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block mb-1 text-lg font-medium text-black-700">Grade:</label>
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
                  <label className="block mb-1 text-lg font-medium text-black-700">Result:</label>
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
                    disabled={formData.result === 'PENDING' || formData.result === 'FAILED'} // PENDING বা FAILED হলে disable
                    className="mr-2 h-4 w-4 rounded border-gray-300 bg-white text-indigo-600 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <label className={`text-sm font-medium ${(formData.result === 'PENDING' || formData.result === 'FAILED') ? 'text-gray-500' : 'text-gray-700'}`}>
                    Promoted to Admin
                    {(formData.result === 'PENDING' || formData.result === 'FAILED') && (
                      <span className="text-xs text-gray-500 ml-1">(Only available for PASSED candidates)</span>
                    )}
                  </label>
                </div>
              </div>

              <div className="mt-4">
                <label className="block mb-1 text-lg font-medium text-black-700">Remarks:</label>
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

            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-3 rounded-md shadow-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors text-base"
            >
              {uploading ? 'Uploading Files...' : 'Submit Viva Interview'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}