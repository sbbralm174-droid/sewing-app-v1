// components/viva-interview/InterviewForm.js
'use client'
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import BasicInfoSection from './BasicInfoSection';
import VideosSection from './VideosSection';
import VivaDetailsSection from './VivaDetailsSection';
import ProcessScoreSection from './ProcessScoreSection';
import ResultSection from './ResultSection';

export default function InterviewForm({ candidateInfo, onBackToSearch }) {
  const router = useRouter();
  
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
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      {/* Basic Info Section */}
      <BasicInfoSection 
        formData={formData} 
        onChange={handleChange} 
      />

      {/* Videos Section */}
      <VideosSection 
        formData={formData}
        setFormData={setFormData}
        uploading={uploading}
      />

      {/* Viva Details Section */}
      <VivaDetailsSection 
        formData={formData}
        setFormData={setFormData}
      />

      {/* Process and Score Section */}
      <ProcessScoreSection 
        formData={formData}
        setFormData={setFormData}
        processes={processes}
      />

      {/* Result Section */}
      <ResultSection 
        formData={formData}
        onChange={handleChange}
      />

      <div className="flex space-x-4">
        <button
          type="button"
          onClick={onBackToSearch}
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
  );
}