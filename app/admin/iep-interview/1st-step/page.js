// app/admin/iep-interview/step-one/page.js - সম্পূর্ণ আপডেটেড
'use client'
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Webcam from 'react-webcam';
import NidOrBirthCertificateSearch from '@/components/NidOrBirthCertificate';

export default function VivaInterviewStep1() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    nid: '',
    birthCertificate: '',
    picture: '',
    failureReason: ''
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [showWebcam, setShowWebcam] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [showFailureReason, setShowFailureReason] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [searchKey, setSearchKey] = useState(0); // Force re-render করার জন্য
  
  const photoFileRef = useRef(null);
  const webcamRef = useRef(null);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (successMessage) setSuccessMessage('');
    if (errorMessage) setErrorMessage('');
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Search button click handler - NID বা Birth Certificate যেকোনো একটি দিয়ে search করবে
  const handleSearch = () => {
    const nidValue = formData.nid.trim();
    const birthCertValue = formData.birthCertificate.trim();
    
    if (!nidValue && !birthCertValue) {
      alert('Please enter either NID or Birth Certificate number');
      return;
    }
    
    // NID কে priority দিবে, যদি NID থাকে তাহলে NID নেবে, নাহলে Birth Certificate
    const searchValueToUse = nidValue || birthCertValue;
    setSearchValue(searchValueToUse);
    setSearchKey(prev => prev + 1); // Force re-render
    setShowSearch(true);
  };

  // Close search popup
  const handleCloseSearch = () => {
    setShowSearch(false);
  };

  const validateForm = (result) => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Candidate name is required';
    }
    
    if (!formData.nid && !formData.birthCertificate) {
      errors.idValidation = 'Either NID or Birth Certificate must be provided';
    }
    
    if (!photoFileRef.current && !formData.picture && !capturedImage) {
      errors.picture = 'Candidate picture is required';
    }
    
    // Failure reason validation if result is FAILED
    if (result === 'FAILED' && !formData.failureReason.trim()) {
      errors.failureReason = 'Failure reason is required when candidate fails';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const capturePhoto = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
      setFormData(prev => ({ ...prev, picture: imageSrc }));
      setShowWebcam(false);
      setSuccessMessage('✅ Photo captured successfully!');
    }
  };

  const startCamera = () => {
    setShowWebcam(true);
    setCapturedImage(null);
    setFormData(prev => ({ ...prev, picture: '' }));
    photoFileRef.current = null;
  };

  const stopCamera = () => {
    setShowWebcam(false);
  };

  const discardCapturedPhoto = () => {
    setCapturedImage(null);
    setFormData(prev => ({ ...prev, picture: '' }));
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
    setCapturedImage(null);
    setShowWebcam(false);
    setSuccessMessage('✅ Photo selected successfully!');
  };

  const removePhoto = () => {
    setFormData(prev => ({ ...prev, picture: '' }));
    photoFileRef.current = null;
    setCapturedImage(null);
  };

  const uploadPhoto = async () => {
    if (capturedImage) {
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
      photoFileRef.current = file;
    }

    if (!photoFileRef.current) return formData.picture;

    const formDataObj = new FormData();
    formDataObj.append('file', photoFileRef.current);
    formDataObj.append('type', 'photo');

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formDataObj,
    });

    if (!response.ok) {
      throw new Error('Failed to upload photo');
    }

    const result = await response.json();
    return result.url;
  };

  const handleSubmit = async (result) => {
    setErrorMessage('');
    setSuccessMessage('');

    // যদি FAILED হয় কিন্তু failure reason দেখানো না থাকে
    if (result === 'FAILED' && !showFailureReason) {
      setShowFailureReason(true);
      setSuccessMessage('⚠️ Please provide failure reason before submitting');
      return;
    }

    if (!validateForm(result)) return;

    try {
      setLoading(true);

      let pictureUrl = formData.picture;
      if (photoFileRef.current || capturedImage) {
        pictureUrl = await uploadPhoto();
      }

      const submissionData = {
        ...formData,
        picture: pictureUrl,
        nid: formData.nid || undefined,
        birthCertificate: formData.birthCertificate || undefined,
        result: result,
        failureReason: result === 'FAILED' ? formData.failureReason : undefined
      };

      const response = await fetch('/api/iep-interview/step-one', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      const responseData = await response.json();

      if (response.ok) {
        setSuccessMessage(`✅ Step 1 completed! Candidate ID: ${responseData.data.candidateId} - Result: ${result}`);
        setShowFailureReason(false);
        
        // Form reset
        setFormData({
          name: '',
          nid: '',
          birthCertificate: '',
          picture: '',
          failureReason: ''
        });
        setCapturedImage(null);
        photoFileRef.current = null;
        
      } else {
        setErrorMessage(`❌ ${responseData.error || 'Failed to create candidate record'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('❌ ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelFailureReason = () => {
    setShowFailureReason(false);
    setFormData(prev => ({ ...prev, failureReason: '' }));
  };

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "user"
  };

  return (
    <div className="min-h-screen mt-10 bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-indigo-900">Employe Assessment 1st Step (Security)</h1>
          <p className="text-gray-600 mt-2">Provide candidate&apos;s basic details and photo</p>
        </div>

        {/* Search Section */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">🔍 Operator Search</h3>
          <p className="text-sm text-blue-600 mb-3">
            NID বা Birth Certificate number দিয়ে operator এর details দেখুন
          </p>
          <button 
            onClick={handleSearch}
            disabled={!formData.nid.trim() && !formData.birthCertificate.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-3 rounded-md font-medium transition-colors flex items-center justify-center gap-2"
          >
            <span>View Operator Details</span>
            <span className="text-sm">({formData.nid ? 'NID' : formData.birthCertificate ? 'Birth Certificate' : 'None'})</span>
          </button>
        </div>

        {/* Search Component - key prop add করা হয়েছে */}
        {showSearch && (
          <NidOrBirthCertificateSearch 
            key={searchKey} // এই key change হলে component re-mount হবে
            nidOrBirthCertificateValue={searchValue}
            autoSearch={true}
          />
        )}

        {successMessage && (
          <div className={`mb-4 p-3 rounded-md text-center ${
            successMessage.includes('⚠️') 
              ? 'bg-yellow-100 text-yellow-700' 
              : 'bg-green-100 text-green-700'
          }`}>
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-center">
            {errorMessage}
          </div>
        )}

        <form className="space-y-6">
          {/* Name Field */}
          <div>
            <label className="block mb-2 text-lg font-medium text-gray-700">
              Candidate Name:
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-3 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
              placeholder="Enter candidate full name"
              required
            />
            {formErrors.name && (
              <div className="mt-1 text-red-600 text-sm">{formErrors.name}</div>
            )}
          </div>

          {/* Identification Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-lg font-medium text-gray-700">NID Number:</label>
              <input
                type="text"
                name="nid"
                value={formData.nid}
                onChange={handleChange}
                className="w-full p-3 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
                placeholder="Enter NID number"
              />
            </div>

            <div>
              <label className="block mb-2 text-lg font-medium text-gray-700">Birth Certificate ID:</label>
              <input
                type="text"
                name="birthCertificate"
                value={formData.birthCertificate}
                onChange={handleChange}
                className="w-full p-3 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
                placeholder="Enter birth certificate ID"
              />
            </div>
          </div>

          {formErrors.idValidation && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {formErrors.idValidation}
            </div>
          )}

          <div className="p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
            💡 You must provide either NID or Birth Certificate ID
          </div>

          {/* Photo Upload Section */}
          <div>
            <label className="block mb-2 text-lg font-medium text-gray-700">
              Candidate Photo:
              <span className="text-red-500 ml-1">*</span>
            </label>
            
            <div className="flex space-x-4 mb-4">
              <button
                type="button"
                onClick={startCamera}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                📷 Take Photo
              </button>
              <button
                type="button"
                onClick={() => document.getElementById('fileInput').click()}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                📁 Upload File
              </button>
            </div>

            <input
              id="fileInput"
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              className="hidden"
              disabled={loading}
            />

            {showWebcam && (
              <div className="mb-4 p-4 border border-blue-300 rounded-md bg-blue-50">
                <div className="text-center mb-2">
                  <p className="text-blue-700 font-medium">📸 Camera Active - Smile!</p>
                </div>
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
                  className="w-full h-auto rounded-md"
                />
                <div className="flex space-x-2 mt-2">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium"
                  >
                    📷 Capture Photo
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium"
                  >
                    ❌ Cancel
                  </button>
                </div>
              </div>
            )}

            {(formData.picture || capturedImage) && (
              <div className="flex items-center space-x-4 p-4 border border-green-300 rounded-md bg-green-50">
                <div className="flex-shrink-0">
                  <img 
                    src={formData.picture || capturedImage} 
                    alt="Candidate" 
                    className="w-20 h-20 object-cover rounded-md border border-gray-300"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-green-600 font-medium">
                    {capturedImage ? '✅ Photo captured from camera!' : '✅ Photo selected successfully!'}
                  </p>
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="mt-1 text-red-600 hover:text-red-500 text-sm"
                    disabled={loading}
                  >
                    Remove Photo
                  </button>
                </div>
              </div>
            )}

            <div className="mt-2 text-sm text-gray-500">
              Supported formats: JPEG, PNG, JPG, WebP (Max 5MB) or use camera
            </div>
            {formErrors.picture && (
              <div className="mt-1 text-red-600 text-sm">{formErrors.picture}</div>
            )}
          </div>

          {/* Failure Reason Section - শুধুমাত্র FAILED হলে দেখাবে */}
          {showFailureReason && (
            <div className="p-4 border border-red-300 rounded-md bg-red-50">
              <div className="mb-3">
                <label className="block mb-2 text-lg font-medium text-red-700">
                  Failure Reason:
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <textarea
                  name="failureReason"
                  value={formData.failureReason}
                  onChange={handleChange}
                  rows="3"
                  className="w-full p-3 rounded-md border border-red-300 bg-white text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-transparent text-base"
                  placeholder="Explain why the candidate failed..."
                  required
                />
                {formErrors.failureReason && (
                  <div className="mt-1 text-red-600 text-sm">{formErrors.failureReason}</div>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => handleSubmit('FAILED')}
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium"
                >
                  {loading ? 'Submitting...' : 'Confirm FAILED'}
                </button>
                <button
                  type="button"
                  onClick={cancelFailureReason}
                  disabled={loading}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* PASSED/FAILED Buttons - Failure reason show থাকলে hide করবে */}
          {!showFailureReason && (
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleSubmit('PASSED')}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-3 rounded-md shadow-sm font-medium text-base transition-colors"
              >
                {loading ? 'Processing...' : 'PASSED'}
              </button>
              
              <button
                type="button"
                onClick={() => handleSubmit('FAILED')}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-3 rounded-md shadow-sm font-medium text-base transition-colors"
              >
                {loading ? 'Processing...' : 'FAILED'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}