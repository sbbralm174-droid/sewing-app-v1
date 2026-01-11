// components/viva-interview/InterviewForm.js - UPDATED
'use client'
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import BasicInfoSection from './BasicInfoSection';
import VideosSection from './VideosSection';
import VivaDetailsSection from './VivaDetailsSection';
import ResultSection from './ResultSection';
import MainAssessment from '../operator-assessment/Mainassessment';

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
    result: 'PASSED',
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
  
  // Assessment data state
  const [showAssessment, setShowAssessment] = useState(false);
  const [assessmentData, setAssessmentData] = useState(null);

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

  // Handle assessment data from MainAssessment component - UPDATED
  const handleAssessmentData = (data) => {
    console.log('Received assessment data with candidate info:', data);
    setAssessmentData(data);
    setShowAssessment(false);
    
    // Map assessment data to process scores
    if (data && data.scores) {
      const processScores = {
        machineScore: data.scores.machineScore || 0,
        dopScore: data.scores.dopScore || 0,
        practicalScore: data.scores.practicalScore || 0,
        qualityScore: data.scores.averageQualityScore || 0,
        educationScore: data.scores.educationScore || 0,
        attitudeScore: data.scores.attitudeScore || 0,
        totalScore: data.scores.totalScore || 0
      };
      
      // Update grade from assessment
      const grade = data.finalAssessment?.grade || 'C';
      
      setFormData(prev => ({
        ...prev,
        processAndScore: processScores,
        grade: grade,
        // Assessment থেকে প্রাপ্ত supplementary machines যোগ করুন
        supplementaryMachines: data.supplementaryMachines || {}
      }));
    }

    // Candidate information আপডেট করুন
    if (data.candidateInfo) {
      console.log('Candidate info in assessment:', data.candidateInfo);
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

      // Prepare process scores with validation
      const processScores = {
        machineScore: Math.min(10000, Math.max(0, parseInt(formData.processAndScore.machineScore) || 0)),
        dopScore: Math.min(10000, Math.max(0, parseInt(formData.processAndScore.dopScore) || 0)),
        practicalScore: Math.min(10000, Math.max(0, parseInt(formData.processAndScore.practicalScore) || 0)),
        qualityScore: Math.min(10000, Math.max(0, parseInt(formData.processAndScore.qualityScore) || 0)),
        educationScore: Math.min(10000, Math.max(0, parseInt(formData.processAndScore.educationScore) || 0)),
        attitudeScore: Math.min(10000, Math.max(0, parseInt(formData.processAndScore.attitudeScore) || 0)),
        totalScore: Math.min(10000, Math.max(0, parseInt(formData.processAndScore.totalScore) || 0))
      };

      // Prepare submission data with processCapacity and assessment data
      const submissionData = {
        candidateId: candidateInfo.candidateId,
        ...formData,
        videos: uploadedVideos,
        processAndScore: assessmentData?.processCapacity || {},
        grade: formData.grade,
        assessmentData: assessmentData, // Include full assessment data
        processCapacity: processScores,
        supplementaryMachines: formData.supplementaryMachines || {}
      };

      console.log('Submitting data with assessment:', submissionData);

      const response = await fetch('/api/iep-interview/step-two', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccessMessage('✅ Interview completed successfully!');
        
        // Redirect after success
        
        
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

  // Display current process scores
  const renderProcessScores = () => {
    if (!formData.processAndScore || Object.keys(formData.processAndScore).length === 0) {
      return null;
    }

    /////////////////////update assessment calculation/////////////////////
    





    return (
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Process Scores from Assessment</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(formData.processAndScore).map(([key, value]) => (
            <div key={key} className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-gray-600 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </div>
              <div className="text-lg font-bold text-blue-600">
                {typeof value === 'number' ? value.toFixed(1) : value}
              </div>
            </div>
          ))}
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-sm font-medium text-gray-600">Grade</div>
            <div className="text-lg font-bold text-green-600">{formData.grade}</div>
          </div>
        </div>
        
        {/* Supplementary Machines Display */}
        {formData.supplementaryMachines && Object.keys(formData.supplementaryMachines).length > 0 && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Supplementary Machines</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(formData.supplementaryMachines).map(([machine, checked]) => (
                checked && (
                  <span key={machine} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                    {machine}
                  </span>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {showAssessment ? (
        <MainAssessment 
          onAssessmentComplete={handleAssessmentData} 
          candidateInfo={candidateInfo} // 🔥 candidateInfo পাস করুন
        />
      ) : (
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

          {/* Process Score Section */}
          {renderProcessScores()}

          {/* Assessment Integration Button */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Operator Assessment</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-2">
                  {assessmentData 
                    ? `Assessment completed - Grade: ${formData.grade}, Total Score: ${formData.processAndScore.totalScore || 0}`
                    : 'No assessment data available'
                  }
                </p>
                {assessmentData && (
                  <p className="text-sm text-green-600">
                    Machine: {formData.processAndScore.machineScore || 0} | 
                    DOP: {formData.processAndScore.dopScore || 0} | 
                    Practical: {formData.processAndScore.practicalScore || 0}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowAssessment(true)}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md shadow-sm font-medium transition-colors"
              >
                {assessmentData ? 'Update Assessment' : 'Calculate Assessment'}
              </button>
            </div>
          </div>

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
      )}
    </div>
  );
}