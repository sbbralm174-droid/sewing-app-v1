'use client'
import { useState, useEffect, useRef } from 'react';
import SidebarNavLayout from '@/components/SidebarNavLayout';
import NidOrBirthCertificateSearch from '@/components/NidOrBirthCertificate';

export default function AdminInterviewForm() {
  const [formData, setFormData] = useState({
    candidateId: '',
    operatorId: '',
    salary: '',
    result: 'PENDING',
    remarks: '',
    canceledReason: '',
    promotedToOperator: false,
    joiningDate: '',
    designation: ''
  });
  const [vivaCandidates, setVivaCandidates] = useState([]);
  const [availableCandidates, setAvailableCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Search related states - উপরের UI এর মতোই
  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [searchKey, setSearchKey] = useState(0);
  
  // Dropdown এর reference তৈরি করুন
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [vivaResponse, adminResponse] = await Promise.all([
          fetch('/api/iep-interview'),
          fetch('/api/adminInterview')
        ]);

        if (vivaResponse.ok && adminResponse.ok) {
          const vivaResult = await vivaResponse.json();
          const adminResult = await adminResponse.json();

          const promotedCandidates = vivaResult.data.filter(candidate => 
            candidate.result === 'FAILED' || candidate.result === 'PASSED'
          );
          
          setVivaCandidates(promotedCandidates);

          const existingCandidateIds = new Set(
            adminResult.data.map(admin => admin.candidateId?._id || admin.candidateId)
          );

          const filteredCandidates = promotedCandidates.filter(
            candidate => !existingCandidateIds.has(candidate._id)
          );

          setAvailableCandidates(filteredCandidates);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Click outside listener যোগ করুন
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter candidates based on search term
  const filteredCandidates = availableCandidates.filter(candidate =>
    candidate.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.candidateId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.nid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.birthCertificate?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setIsDropdownOpen(true);
  };

  const handleCandidateSelect = (candidateId) => {
    setFormData(prev => ({ ...prev, candidateId }));
    const candidate = availableCandidates.find(c => c._id === candidateId);
    setSelectedCandidate(candidate || null);
    setSearchTerm(candidate ? `${candidate.name} - ${candidate.candidateId}` : '');
    setIsDropdownOpen(false);
  };

  // Search button click handler - উপরের UI এর মতোই
  const handleSearch = () => {
    if (!selectedCandidate) {
      alert('Please select a candidate first');
      return;
    }

    // Validate candidate data
    if (!selectedCandidate.name) {
      alert('Selected candidate data is invalid');
      return;
    }

    const nidValue = selectedCandidate.nid?.trim();
    const birthCertValue = selectedCandidate.birthCertificate?.trim();
    
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
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    // Clear messages when user starts typing
    if (successMessage) setSuccessMessage('');
    if (errorMessage) setErrorMessage('');
    
    // Clear specific field error
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Clear canceled reason when result is not FAILED
    if (name === 'result' && value !== 'FAILED') {
      setFormData(prev => ({ ...prev, canceledReason: '' }));
    }

    // Automatically set promotedToOperator to true when result is PASSED
    if (name === 'result' && value === 'PASSED') {
      setFormData(prev => ({ ...prev, promotedToOperator: true }));
    }

    // Reset promotedToOperator when result is not PASSED
    if (name === 'result' && value !== 'PASSED') {
      setFormData(prev => ({ ...prev, promotedToOperator: false }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.candidateId) {
      errors.candidateId = 'Please select a candidate';
    }
    if (!formData.salary) {
      errors.salary = 'Salary is required';
    } else if (formData.salary < 0) {
      errors.salary = 'Salary cannot be negative';
    }
    if (formData.result === 'FAILED' && !formData.canceledReason) {
      errors.canceledReason = 'Canceled reason is required when result is FAILED';
    }
    // Operator ID validation যখন promotedToOperator true
    if (formData.promotedToOperator && !formData.operatorId) {
      errors.operatorId = 'Operator ID is required when promoting to operator';
    }
    // Joining date validation যখন promotedToOperator true
    if (formData.promotedToOperator && !formData.joiningDate) {
      errors.joiningDate = 'Joining date is required when promoting to operator';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setFormErrors({});

    if (!validateForm()) return;

    try {
      const submissionData = {
        ...formData,
        salary: parseFloat(formData.salary),
        ...(formData.promotedToOperator && {
          operatorId: formData.operatorId,
          joiningDate: formData.joiningDate,
          designation: formData.designation || 'Operator'
        })
      };

      // Step 1: Save Admin Interview
      const response = await fetch('/api/adminInterview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(`❌ ${result.error || 'Failed to create admin interview'}`);
        return;
      }

      
      if (formData.result === 'PASSED' && formData.promotedToOperator) {
        try {
          const operatorResponse = await fetch('/api/adminInterview/operator', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              adminInterviewId: result.data._id,
              operatorId: formData.operatorId,
              joiningDate: formData.joiningDate,
              designation: formData.designation || 'Operator',
            }),
          });

          const operatorResult = await operatorResponse.json();

          if (operatorResponse.ok) {
            setSuccessMessage('✅ Admin Interview and Operator created successfully!');
          } else {
            setErrorMessage(`⚠️ Operator creation failed: ${operatorResult.error}`);
          }
        } catch (error) {
          setErrorMessage('⚠️ Failed to create operator automatically.');
        }
      } else {
        setSuccessMessage('✅ Admin Interview added successfully!');
      }

      // Reset Form
      setFormData({
        candidateId: '',
        operatorId: '',
        salary: '',
        result: 'PENDING',
        remarks: '',
        canceledReason: '',
        promotedToOperator: false,
        joiningDate: '',
        designation: ''
      });
      setSelectedCandidate(null);
      setSearchTerm('');
      setAvailableCandidates(prev => prev.filter(c => c._id !== formData.candidateId));
      setShowSearch(false); // Reset search view

    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('❌ Network error. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-900 font-sans flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-2xl mx-auto mt-20 bg-white text-gray-900 font-sans flex">
      <SidebarNavLayout/>
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h1 className="text-2xl font-bold  text-indigo-900 mb-6 text-center">Admin Interview</h1>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-center border border-green-200">
              {successMessage}
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-center border border-red-200">
              {errorMessage}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.preventDefault();
            }}
          >
            {/* Candidate Selection Section */}
            <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
              <h2 className="text-lg font-semibold mb-3 text-indigo-600">Candidate Selection</h2>
              
              {/* Dropdown container এ ref যোগ করুন */}
              <div className="relative" ref={dropdownRef}>
                <label className="block mb-2 text-sm font-medium">Select Candidate:</label>
                
                {/* Search Input */}
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder="Search by name, ID, NID, or birth certificate..."
                  className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                
                {/* Dropdown Menu */}
                {isDropdownOpen && filteredCandidates.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredCandidates.map((candidate) => (
                      <div
                        key={candidate._id}
                        onClick={() => handleCandidateSelect(candidate._id)}
                        className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                      >
                        <div className="font-medium">{candidate.name}</div>
                        <div className="text-sm text-gray-600">
                          ID: {candidate.candidateId} | 
                          NID: {candidate.nid || " N/A "} | 
                          Birth Cert: {candidate.birthCertificate || "N/A"}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Department: {candidate.department} | Grade: {candidate.grade}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* No results message */}
                {isDropdownOpen && searchTerm && filteredCandidates.length === 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-3 text-gray-500">
                    No candidates found matching {"${searchTerm}"}
                  </div>
                )}
                
                {formErrors.candidateId && (
                  <div className="mt-1 p-2 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
                    {formErrors.candidateId}
                  </div>
                )}
              </div>

              {/* Selected Candidate Information Display */}
              {selectedCandidate && (
                <div className="mt-4 p-3 bg-white rounded-md border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-indigo-600">Selected Candidate Information:</h3>
                    
                    {/* View Details Button - উপরের UI এর মতোই */}
                    <button 
                      onClick={handleSearch}
                      disabled={!selectedCandidate.nid && !selectedCandidate.birthCertificate}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 text-sm"
                    >
                      <span>🔍 View Details</span>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-600">Name:</span> {selectedCandidate.name}</div>
                    <div><span className="text-gray-600">Candidate ID:</span> {selectedCandidate.candidateId}</div>
                    <div><span className="text-gray-600">NID:</span> {selectedCandidate.nid || 'N/A'}</div>
                    <div><span className="text-gray-600">Birth Certificate:</span> {selectedCandidate.birthCertificate || 'N/A'}</div>
                    <div><span className="text-gray-600">Viva Grade:</span> {selectedCandidate.grade}</div>
                    {/* <div><span className="text-gray-600">Viva Result:</span> {selectedCandidate.result}</div> */}
                    <div><span className="text-gray-600">Department:</span> {selectedCandidate.department}</div>
                  </div>
                  
                  {/* Process Scores Display */}
                  {selectedCandidate.processAndScore && Object.keys(selectedCandidate.processAndScore).length > 0 && (
                    <div className="mt-3">
                      <h4 className="font-medium mb-1 text-indigo-600">Process Scores:</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(selectedCandidate.processAndScore).map(([process, score]) => (
                          <span key={process} className="px-2 py-1 bg-gray-100 rounded text-xs border border-gray-200">
                            {process}: {score}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {availableCandidates.length === 0 && (
                <div className="mt-4 p-3 bg-yellow-50 text-yellow-700 rounded-md text-sm border border-yellow-200">
                  ⚠️ No candidates available for admin interview. All promoted candidates already have admin interviews or no candidates have been promoted yet.
                </div>
              )}
            </div>

            {/* Search Component - উপরের UI এর মতোই */}
            {showSearch && (
              <div className="mb-6 border border-gray-200 rounded-md p-4 bg-gray-50">
                <h3 className="text-lg font-semibold mb-3 text-indigo-600">Candidate Details Search</h3>
                <NidOrBirthCertificateSearch 
                  key={searchKey}
                  nidOrBirthCertificateValue={searchValue}
                  autoSearch={true}
                />
              </div>
            )}

            {/* Salary Information Section */}
            <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
              <h2 className="text-lg font-semibold mb-3 text-indigo-600">Salary Information</h2>
              
              <div>
                <label className="block mb-2 text-sm font-medium">Proposed Salary:</label>
                <input
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  placeholder="Enter proposed salary"
                  className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  min="0"
                  step="0.01"
                  required
                />
                {formErrors.salary && (
                  <div className="mt-1 p-2 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
                    {formErrors.salary}
                  </div>
                )}
              </div>
            </div>

            {/* Interview Result Section */}
            <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
              <h2 className="text-lg font-semibold mb-3 text-indigo-600">Interview Result</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Result */}
                <div>
                  <label className="block mb-2 text-sm font-medium">Result:</label>
                  <select
                    name="result"
                    value={formData.result}
                    onChange={handleChange}
                    className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="PASSED">PASSED</option>
                    <option value="FAILED">FAILED</option>
                  </select>
                </div>

                {/* Promoted to Operator */}
                <div className="flex items-center justify-start md:justify-end">
                  <input
                    type="checkbox"
                    name="promotedToOperator"
                    checked={formData.promotedToOperator}
                    onChange={handleChange}
                    className="mr-2 h-5 w-5 rounded border-gray-300 bg-white text-indigo-600 focus:ring-indigo-500"
                    disabled={formData.result !== 'PASSED'}
                  />
                  <label className={`text-sm font-medium ${formData.result !== 'PASSED' ? 'text-gray-500' : 'text-gray-700'}`}>
                    Promote to Operator
                  </label>
                </div>
              </div>

              {/* Operator Information Section - শুধুমাত্র যখন promotedToOperator true */}
              {formData.promotedToOperator && (
                <div className="mt-4 p-4 bg-indigo-50 rounded-md border border-indigo-200">
                  <h3 className="text-md font-semibold mb-3 text-indigo-700">Operator Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Operator ID */}
                    <div>
                      <label className="block mb-2 text-sm font-medium">Operator ID:</label>
                      <input
                        type="text"
                        name="operatorId"
                        value={formData.operatorId}
                        onChange={handleChange}
                        placeholder="Enter operator ID"
                        className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                      />
                      {formErrors.operatorId && (
                        <div className="mt-1 p-2 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
                          {formErrors.operatorId}
                        </div>
                      )}
                    </div>

                    {/* Joining Date */}
                    <div>
                      <label className="block mb-2 text-sm font-medium">Joining Date:</label>
                      <input
                        type="date"
                        name="joiningDate"
                        value={formData.joiningDate}
                        onChange={handleChange}
                        className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                      />
                      {formErrors.joiningDate && (
                        <div className="mt-1 p-2 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
                          {formErrors.joiningDate}
                        </div>
                      )}
                    </div>

                    {/* Designation */}
                    <div className="md:col-span-2">
                      <label className="block mb-2 text-sm font-medium">Designation:</label>
                      <input
                        type="text"
                        name="designation"
                        value={formData.designation}
                        onChange={handleChange}
                        placeholder="Enter designation (e.g., Operator)"
                        className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Remarks */}
              <div className="mt-4">
                <label className="block mb-2 text-sm font-medium">Remarks:</label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  placeholder="Enter any additional remarks..."
                  className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  rows="3"
                />
              </div>

              {/* Canceled Reason (only show when result is FAILED) */}
              {formData.result === 'FAILED' && (
                <div className="mt-4">
                  <label className="block mb-2 text-sm font-medium">Canceled Reason:</label>
                  <input
                    type="text"
                    name="canceledReason"
                    value={formData.canceledReason}
                    onChange={handleChange}
                    placeholder="Enter reason for cancellation"
                    className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required={formData.result === 'FAILED'}
                  />
                  {formErrors.canceledReason && (
                    <div className="mt-1 p-2 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
                      {formErrors.canceledReason}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Information Box */}
            <div className="p-4 bg-blue-50 text-blue-700 rounded-md text-sm border border-blue-200">
              💡 <strong>Note:</strong> Only candidates who have passed the viva interview, are promoted to admin level, and don&apos;t already have admin interviews are available for selection. Operator creation is only available when result is PASSED.
            </div>

            <button
              type="submit"
              disabled={availableCandidates.length === 0}
              className={`w-full px-4 py-2 rounded-md shadow-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                availableCandidates.length === 0 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {availableCandidates.length === 0 ? 'No Candidates Available' : 'Submit Admin Interview'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}