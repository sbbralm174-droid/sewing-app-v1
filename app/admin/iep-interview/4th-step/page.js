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
    designation: '',
    nid: '',
    birthCertificate: ''
  });

  const [availableCandidates, setAvailableCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Filter States
  const [floorFilter, setFloorFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Search related states
  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [searchKey, setSearchKey] = useState(0);

  const dropdownRef = useRef(null);

  // Fetch data with filters from the NEW API
  const fetchAvailableCandidates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (floorFilter) params.append('floor', floorFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/adminInterview/dropdown-get?${params.toString()}`);
      const result = await response.json();

      if (response.ok) {
        setAvailableCandidates(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableCandidates();
  }, [floorFilter, startDate, endDate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCandidates = availableCandidates.filter(candidate =>
    candidate.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.candidateId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.nid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.birthCertificate?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCandidateSelect = (candidateId) => {
    const candidate = availableCandidates.find(c => c._id === candidateId);
    setSelectedCandidate(candidate || null);
    setFormData(prev => ({
      ...prev,
      candidateId,
      nid: candidate?.nid || '',
      birthCertificate: candidate?.birthCertificate || ''
    }));
    setSearchTerm(candidate ? `${candidate.name} - ${candidate.candidateId}` : '');
    setIsDropdownOpen(false);
  };

  const handleSearch = () => {
    if (!selectedCandidate) {
      alert('Please select a candidate first');
      return;
    }
    const nidValue = selectedCandidate.nid?.trim();
    const birthCertValue = selectedCandidate.birthCertificate?.trim();
    
    if (!nidValue && !birthCertValue) {
      alert('Selected candidate does not have NID or Birth Certificate number');
      return;
    }
    
    setSearchValue(nidValue || birthCertValue);
    setSearchKey(prev => prev + 1);
    setShowSearch(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: type === 'checkbox' ? checked : value };
      if (name === 'result') {
        if (value === 'PASSED') {
          updated.promotedToOperator = true;
        } else {
          updated.promotedToOperator = false;
          updated.canceledReason = value === 'FAILED' ? updated.canceledReason : '';
        }
      }
      return updated;
    });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.candidateId) errors.candidateId = 'Please select a candidate';
    if (!formData.salary) errors.salary = 'Salary is required';
    if (formData.result === 'FAILED' && !formData.canceledReason) errors.canceledReason = 'Reason required';
    if (formData.promotedToOperator && (!formData.operatorId || !formData.joiningDate)) {
      errors.operatorId = 'Operator Info Required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const submissionData = {
        ...formData,
        salary: parseFloat(formData.salary),
        designation: formData.designation || 'Operator'
      };

      const response = await fetch('/api/adminInterview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) throw new Error('Submission failed');
      const result = await response.json();

      if (formData.result === 'PASSED' && formData.promotedToOperator) {
        await fetch('/api/adminInterview/operator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adminInterviewId: result.data._id,
            candidateId: formData.candidateId,
            operatorId: formData.operatorId,
            joiningDate: formData.joiningDate,
            designation: formData.designation || 'Operator',
            nid: formData.nid,
            salary: submissionData.salary
          }),
        });
      }

      setSuccessMessage('✅ Admin Interview Completed Successfully!');
      setFormData({ candidateId: '', operatorId: '', salary: '', result: 'PENDING', remarks: '', canceledReason: '', promotedToOperator: false, joiningDate: '', designation: '', nid: '', birthCertificate: '' });
      setSelectedCandidate(null);
      setSearchTerm('');
      setShowSearch(false);
      fetchAvailableCandidates(); // Refresh the dropdown list
    } catch (error) {
      setErrorMessage('❌ Error processing request');
    }
  };

  

  return (
    <div className="min-h-screen max-w-4xl mx-auto mt-20 bg-white text-gray-900 font-sans flex">
      <SidebarNavLayout />
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h1 className="text-2xl font-bold text-indigo-900 mb-6 text-center">Admin Interview Form</h1>

          {/* Success/Error Messages */}
          {successMessage && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md border border-green-200 text-center">{successMessage}</div>}
          {errorMessage && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md border border-red-200 text-center">{errorMessage}</div>}

          {/* --- NEW FILTER SECTION --- */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-md">
            <div>
              <label className="block text-xs font-bold text-indigo-700 mb-1">Floor Filter</label>
              <select value={floorFilter} onChange={(e) => setFloorFilter(e.target.value)} className="w-full p-2 text-sm border border-gray-300 rounded bg-white">
                <option value="">All Floors</option>
                <option value="SHAPLA">SHAPLA</option>
                <option value="PODDO">PODDO</option>
                <option value="KODOM">KODOM</option>
                <option value="BELLY">BELLY</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-indigo-700 mb-1">Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-2 text-sm border border-gray-300 rounded" />
            </div>
            {/* <div>
              <label className="block text-xs font-bold text-indigo-700 mb-1">End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-2 text-sm border border-gray-300 rounded" />
            </div> */}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}>
            
            {/* Candidate Selection Section */}
            <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
              <h2 className="text-lg font-semibold mb-3 text-indigo-600">Candidate Selection</h2>
              <div className="relative" ref={dropdownRef}>
                <label className="block mb-2 text-sm font-medium">Select Candidate:</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setIsDropdownOpen(true); }}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder="Search by name, ID, NID..."
                  className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 sm:text-sm"
                />
                
                {isDropdownOpen && filteredCandidates.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredCandidates.map((candidate) => (
                      <div key={candidate._id} onClick={() => handleCandidateSelect(candidate._id)} className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200">
                        <div className="font-medium">{candidate.name} ({candidate.candidateId})</div>
                        <div className="text-xs text-gray-500">NID: {candidate.nid || 'N/A'} | Floor: {candidate.floor}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Candidate Information Display (ফেরত আনা হয়েছে) */}
              {selectedCandidate && (
                <div className="mt-4 p-4 bg-white rounded-md border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-indigo-600">Selected Candidate Information:</h3>
                    <button type="button" onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2">
                      🔍 View Details
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-600 font-medium">Name:</span> {selectedCandidate.name}</div>
                    <div><span className="text-gray-600 font-medium">Candidate ID:</span> {selectedCandidate.candidateId}</div>
                    <div><span className="text-gray-600 font-medium">NID:</span> {selectedCandidate.nid || 'N/A'}</div>
                    <div><span className="text-gray-600 font-medium">Birth Cert:</span> {selectedCandidate.birthCertificate || 'N/A'}</div>
                    <div><span className="text-gray-600 font-medium">Viva Grade:</span> {selectedCandidate.grade}</div>
                    <div><span className="text-gray-600 font-medium">Department:</span> {selectedCandidate.department}</div>
                  </div>

                  {selectedCandidate.processAndScore && (
                    <div className="mt-3 border-t pt-2">
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Process Scores:</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(selectedCandidate.processAndScore).map(([process, score]) => (
                          <span key={process} className="px-2 py-1 bg-gray-50 rounded text-xs border border-gray-200">{process}: {score}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* History Search Result */}
            {showSearch && (
              <div className="mb-6 border border-gray-200 rounded-md p-4 bg-gray-50">
                <h3 className="text-lg font-semibold mb-3 text-indigo-600">Full Record History</h3>
                <NidOrBirthCertificateSearch key={searchKey} nidOrBirthCertificateValue={searchValue} autoSearch={true} />
              </div>
            )}

            {/* Salary Section */}
            <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
              <h2 className="text-lg font-semibold mb-3 text-indigo-600">Salary Information</h2>
              <input type="number" name="salary" value={formData.salary} onChange={handleChange} placeholder="Enter salary" className="w-full p-2 rounded-md border border-gray-300 bg-white" required />
            </div>

            {/* Result Section */}
            <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
              <h2 className="text-lg font-semibold mb-3 text-indigo-600">Interview Result</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select name="result" value={formData.result} onChange={handleChange} className="w-full p-2 rounded-md border border-gray-300">
                  <option value="PENDING">PENDING</option>
                  <option value="PASSED">PASSED</option>
                  <option value="FAILED">FAILED</option>
                </select>
                <div className="flex items-center gap-2">
                  <input type="checkbox" name="promotedToOperator" checked={formData.promotedToOperator} onChange={handleChange} disabled={formData.result !== 'PASSED'} className="h-5 w-5" />
                  <label className="text-sm font-medium">Promote to Operator</label>
                </div>
              </div>

              {formData.promotedToOperator && (
                <div className="mt-4 p-4 bg-indigo-50 rounded-md border border-indigo-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" name="operatorId" value={formData.operatorId} onChange={handleChange} placeholder="Operator ID" className="w-full p-2 border border-gray-300 rounded" required />
                  <input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded" required />
                  <input type="text" name="designation" value={formData.designation} onChange={handleChange} placeholder="Designation" className="w-full p-2 border border-gray-300 rounded md:col-span-2" />
                </div>
              )}

              {formData.result === 'FAILED' && (
                <input type="text" name="canceledReason" value={formData.canceledReason} onChange={handleChange} placeholder="Rejection Reason" className="w-full p-2 mt-4 border border-red-300 rounded" required />
              )}
            </div>

            <button type="submit" disabled={!formData.candidateId} className={`w-full p-3 rounded-md font-bold text-white ${!formData.candidateId ? 'bg-gray-300' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
              Submit Admin Interview
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}