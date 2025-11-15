'use client'
import { useState, useEffect, useRef, useCallback } from 'react';
import SidebarNavLayout from '@/components/SidebarNavLayout';

export default function UpdateCandidate() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
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
  
  const [originalData, setOriginalData] = useState(null);
  const [changedFields, setChangedFields] = useState({});
  const [processes, setProcesses] = useState([]);
  const [timeInputs, setTimeInputs] = useState({});
  
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
      }
    };
    fetchProcesses();
  }, []);

  const handleSearch = async (term) => {
    if (!term || term.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch('/api/iep-interview/candidate/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchTerm: term }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setSearchResults(result.candidates || []);
      } else {
        setErrorMessage(result.error || 'Search failed');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setErrorMessage('Search failed');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      handleSearch(term);
    }, 500);
  };

  const handleCandidateSelect = async (candidate) => {
    setLoading(true);
    setSelectedCandidate(candidate);
    setSearchTerm('');
    setSearchResults([]);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch(`/api/iep-interview/candidate/${candidate.candidateId}`);
      const result = await response.json();
      
      if (response.ok) {
        const candidateData = result.candidate;
        
        // Convert MongoDB document to plain object
        const plainData = {
          ...candidateData,
          _id: candidateData._id.toString(),
          interviewDate: candidateData.interviewDate ? 
            new Date(candidateData.interviewDate).toISOString().split('T')[0] : '',
          videos: candidateData.videos || [],
          vivaDetails: candidateData.vivaDetails || [{ question: '', answer: '', remark: '' }],
          processAndScore: candidateData.processAndScore || {},
          promotedToAdmin: candidateData.promotedToAdmin || false
        };

        setFormData(plainData);
        setOriginalData(plainData);
        setChangedFields({});
        
        // Initialize time inputs for processes
        const initialTimeInputs = {};
        Object.keys(plainData.processAndScore || {}).forEach(processName => {
          const score = plainData.processAndScore[processName];
          initialTimeInputs[processName] = score > 0 ? (3600 / score).toString() : '';
        });
        setTimeInputs(initialTimeInputs);
        
        setSuccessMessage(`Loaded candidate: ${candidate.name}`);
      } else {
        setErrorMessage(result.error || 'Failed to load candidate details');
      }
    } catch (error) {
      console.error('Error loading candidate:', error);
      setErrorMessage('Failed to load candidate details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
  const { name, value, type, checked } = e.target;
  let newValue = type === 'checkbox' ? checked : value;

  // ✅ If Result = PASSED → promotedToAdmin = true (Auto-check)
  if (name === 'result' && value === 'PASSED') {
    setFormData(prev => ({
      ...prev,
      result: value,
      promotedToAdmin: true
    }));

    setChangedFields(prev => ({
      ...prev,
      result: value,
      promotedToAdmin: true
    }));
    return;
  }

  // ✅ If Result = PENDING or FAILED → promotedToAdmin = false (Auto-uncheck)
  if (name === 'result' && (value === 'PENDING' || value === 'FAILED')) {
    setFormData(prev => ({
      ...prev,
      result: value,
      promotedToAdmin: false
    }));

    setChangedFields(prev => ({
      ...prev,
      result: value,
      promotedToAdmin: false
    }));
    return;
  }

  // ✅ Default
  setFormData(prev => ({
    ...prev,
    [name]: newValue
  }));

  setChangedFields(prev => ({
    ...prev,
    [name]: newValue
  }));
};



  const handleVivaDetailChange = (index, field, value) => {
    const updatedVivaDetails = [...formData.vivaDetails];
    updatedVivaDetails[index][field] = value;
    
    setFormData(prev => ({ ...prev, vivaDetails: updatedVivaDetails }));
    
    // Track changes for vivaDetails
    setChangedFields(prev => ({
      ...prev,
      vivaDetails: updatedVivaDetails
    }));
  };

  const addVivaDetail = () => {
    const newVivaDetails = [...formData.vivaDetails, { question: '', answer: '', remark: '' }];
    setFormData(prev => ({ ...prev, vivaDetails: newVivaDetails }));
    
    setChangedFields(prev => ({
      ...prev,
      vivaDetails: newVivaDetails
    }));
  };

  const removeVivaDetail = (index) => {
    if (formData.vivaDetails.length > 1) {
      const updatedVivaDetails = [...formData.vivaDetails];
      updatedVivaDetails.splice(index, 1);
      
      setFormData(prev => ({ ...prev, vivaDetails: updatedVivaDetails }));
      
      setChangedFields(prev => ({
        ...prev,
        vivaDetails: updatedVivaDetails
      }));
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
    const newProcessAndScore = {
      ...formData.processAndScore,
      [processName]: score
    };
    
    setFormData(prev => ({
      ...prev,
      processAndScore: newProcessAndScore
    }));
    
    setChangedFields(prev => ({
      ...prev,
      processAndScore: newProcessAndScore
    }));
  };

  const handleScoreChange = (processName, score) => {
    const finalScore = Math.min(Math.max(0, parseInt(score) || 0), 1000);
    const newProcessAndScore = {
      ...formData.processAndScore,
      [processName]: finalScore
    };
    
    setFormData(prev => ({
      ...prev,
      processAndScore: newProcessAndScore
    }));
    
    setChangedFields(prev => ({
      ...prev,
      processAndScore: newProcessAndScore
    }));
  };

  const handleProcessToggle = (processName) => {
    const newProcessAndScore = { ...formData.processAndScore };
    
    if (newProcessAndScore[processName] !== undefined) {
      delete newProcessAndScore[processName];
    } else {
      newProcessAndScore[processName] = 0;
    }
    
    setFormData(prev => ({ 
      ...prev, 
      processAndScore: newProcessAndScore
    }));
    
    setChangedFields(prev => ({
      ...prev,
      processAndScore: newProcessAndScore
    }));

    if (formData.processAndScore[processName] !== undefined) {
      setTimeInputs(prev => {
        const newTimeInputs = { ...prev };
        delete newTimeInputs[processName];
        return newTimeInputs;
      });
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!selectedCandidate) {
      setErrorMessage('Please select a candidate first');
      return;
    }

    if (Object.keys(changedFields).length === 0) {
      setErrorMessage('No changes detected to update');
      return;
    }

    setUpdating(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch(`/api/iep-interview/candidate/${selectedCandidate.candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          updateFields: changedFields 
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccessMessage(result.message || 'Candidate updated successfully');
        setOriginalData(formData);
        setChangedFields({});
        
        // Refresh candidate data
        const refreshResponse = await fetch(`/api/iep-interview/candidate/${selectedCandidate.candidateId}`);
        const refreshResult = await refreshResponse.json();
        
        if (refreshResponse.ok) {
          const updatedData = refreshResult.candidate;
          const plainData = {
            ...updatedData,
            _id: updatedData._id.toString(),
            interviewDate: updatedData.interviewDate ? 
              new Date(updatedData.interviewDate).toISOString().split('T')[0] : '',
            videos: updatedData.videos || [],
            vivaDetails: updatedData.vivaDetails || [{ question: '', answer: '', remark: '' }],
            processAndScore: updatedData.processAndScore || {},
            promotedToAdmin: updatedData.promotedToAdmin || false
          };
          setFormData(plainData);
          setOriginalData(plainData);
        }
      } else {
        setErrorMessage(result.error || 'Update failed');
      }
    } catch (error) {
      console.error('Update error:', error);
      setErrorMessage('Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const hasChanges = Object.keys(changedFields).length > 0;

  return (
    <div className="min-h-screen bg-[#2A2D36] text-[#E5E9F0] font-sans flex">
      <SidebarNavLayout/>
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="w-full max-w-6xl mx-auto bg-[#2A2D36] p-6 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold mb-6 text-center text-white">Update Candidate Information</h1>

          {/* Search Section */}
          <div className="mb-6 border border-[#3E424D] rounded-md p-4 bg-[#2A2D36]">
            <h2 className="text-lg font-semibold mb-3 text-indigo-300">Search Candidate</h2>
            
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search by name, candidate ID, NID, or birth certificate..."
                className="w-full p-3 rounded-md border border-[#3E424D] bg-[#343841] text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={loading}
              />
              
              {searching && (
                <div className="absolute right-3 top-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div>
                </div>
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-3 border border-[#3E424D] rounded-md bg-[#343841] max-h-60 overflow-y-auto">
                {searchResults.map((candidate) => (
                  <div
                    key={candidate._id}
                    onClick={() => handleCandidateSelect(candidate)}
                    className="p-3 border-b border-[#3E424D] hover:bg-[#2A2D36] cursor-pointer transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-white">{candidate.name}</div>
                        <div className="text-sm text-gray-300">ID: {candidate.candidateId}</div>
                        <div className="text-xs text-gray-400">
                          {candidate.nid && `NID: ${candidate.nid} • `}
                          {candidate.birthCertificate && `Birth Cert: ${candidate.birthCertificate} • `}
                          Dept: {candidate.department}
                        </div>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded ${
                        candidate.result === 'PASSED' ? 'bg-green-800 text-green-200' :
                        candidate.result === 'FAILED' ? 'bg-red-800 text-red-200' :
                        'bg-yellow-800 text-yellow-200'
                      }`}>
                        {candidate.result}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchTerm && searchResults.length === 0 && !searching && (
              <div className="mt-2 text-center text-gray-400 p-3">
                No candidates found
              </div>
            )}
          </div>

          {successMessage && (
            <div className="mb-4 p-3 bg-green-600 text-white rounded-md text-center">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-600 text-white rounded-md text-center">
              {errorMessage}
            </div>
          )}

          {/* Candidate Form */}
          {selectedCandidate && (
            <form
              onSubmit={handleUpdate}
              className="space-y-6 bg-[#343841] p-6 rounded-lg border border-[#3E424D]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.preventDefault();
              }}
            >
              {/* Selected Candidate Info */}
              <div className="border border-green-600 rounded-md p-4 bg-green-900 bg-opacity-20">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-white text-lg">{selectedCandidate.name}</h3>
                    <p className="text-green-300">ID: {selectedCandidate.candidateId}</p>
                    <p className="text-gray-300 text-sm">
                      Department: {selectedCandidate.department} • 
                      Result: <span className={
                        selectedCandidate.result === 'PASSED' ? 'text-green-300' :
                        selectedCandidate.result === 'FAILED' ? 'text-red-300' : 'text-yellow-300'
                      }>{selectedCandidate.result}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      hasChanges ? 'text-yellow-300' : 'text-green-300'
                    }`}>
                      {hasChanges ? '✎ Changes pending' : '✓ No changes'}
                    </div>
                    {hasChanges && (
                      <div className="text-xs text-gray-400 mt-1">
                        {Object.keys(changedFields).length} field(s) modified
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Basic Information Section */}
              <div className="border border-[#3E424D] rounded-md p-4 bg-[#2A2D36]">
                <h2 className="text-lg font-semibold mb-3 text-indigo-300">Basic Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-300">Candidate Name:</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full p-2 rounded-md border border-[#3E424D] bg-[#343841] text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-300">Interview Date:</label>
                    <input
                      type="date"
                      name="interviewDate"
                      value={formData.interviewDate}
                      onChange={handleChange}
                      className="w-full p-2 rounded-md border border-[#3E424D] bg-[#343841] text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-300">Interviewer:</label>
                    <input
                      type="text"
                      name="interviewer"
                      value={formData.interviewer}
                      onChange={handleChange}
                      className="w-full p-2 rounded-md border border-[#3E424D] bg-[#343841] text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-300">Department:</label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="w-full p-2 rounded-md border border-[#3E424D] bg-[#343841] text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Identification Section */}
              <div className="border border-[#3E424D] rounded-md p-4 bg-[#2A2D36]">
                <h2 className="text-lg font-semibold mb-3 text-indigo-300">Identification</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-300">NID Number:</label>
                    <input
                      type="text"
                      name="nid"
                      value={formData.nid}
                      onChange={handleChange}
                      placeholder="Enter NID number"
                      className="w-full p-2 rounded-md border border-[#3E424D] bg-[#343841] text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-300">Birth Certificate ID:</label>
                    <input
                      type="text"
                      name="birthCertificate"
                      value={formData.birthCertificate ?? ""}
                      onChange={handleChange}
                      placeholder="Enter birth certificate ID"
                      className="w-full p-2 rounded-md border border-[#3E424D] bg-[#343841] text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Viva Details Section */}
              <div className="border border-[#3E424D] rounded-md p-4 bg-[#2A2D36]">
                <h2 className="text-lg font-semibold mb-3 text-indigo-300">Viva Details</h2>
                
                {formData.vivaDetails.map((detail, index) => (
                  <div key={index} className="mb-4 p-3 border border-[#3E424D] rounded-md bg-[#343841]">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium text-gray-300">Question {index + 1}</h3>
                      {formData.vivaDetails.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVivaDetail(index)}
                          className="text-red-400 hover:text-red-300 text-sm transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-300">Question:</label>
                        <input
                          type="text"
                          value={detail.question}
                          onChange={(e) => handleVivaDetailChange(index, 'question', e.target.value)}
                          className="w-full p-2 rounded-md border border-[#3E424D] bg-[#2A2D36] text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-300">Answer:</label>
                        <textarea
                          value={detail.answer}
                          onChange={(e) => handleVivaDetailChange(index, 'answer', e.target.value)}
                          className="w-full p-2 rounded-md border border-[#3E424D] bg-[#2A2D36] text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
                          rows="2"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-300">Remark:</label>
                        <input
                          type="text"
                          value={detail.remark}
                          onChange={(e) => handleVivaDetailChange(index, 'remark', e.target.value)}
                          className="w-full p-2 rounded-md border border-[#3E424D] bg-[#2A2D36] text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addVivaDetail}
                  className="w-full py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-md text-sm font-medium transition-colors"
                >
                  + Add Another Question
                </button>
              </div>

              {/* Process and Score Section */}
              <div className="border border-[#3E424D] rounded-md p-4 bg-[#2A2D36]">
                <h2 className="text-lg font-semibold mb-3 text-indigo-300">Process and Score</h2>
                
                <div className="max-h-60 overflow-y-auto border border-[#3E424D] rounded-md p-2 bg-[#343841]">
                  {processes.map((process) => {
                    const isSelected = formData.processAndScore[process.name] !== undefined;
                    const currentTime = timeInputs[process.name] || '';
                    const currentScore = formData.processAndScore[process.name] || 0;

                    return (
                      <div key={process._id} className="mb-3 p-2 border border-[#3E424D] rounded-md bg-[#2A2D36]">
                        <div className="flex items-center gap-2 mb-2">
                         <input
                            type="checkbox"
                            name="promotedToAdmin"
                            checked={formData.promotedToAdmin}
                            onChange={handleChange}
                            disabled={formData.result !== 'PASSED'}
                            />

                          <span className="flex-1 font-medium text-white">{process.name}</span>
                        </div>

                        {isSelected && (
                          <div className="ml-6 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block mb-1 text-xs font-medium text-gray-300">
                                  Time (seconds):
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  step="1"
                                  placeholder="Enter time"
                                  value={currentTime}
                                  onChange={(e) => handleTimeInputChange(process.name, parseFloat(e.target.value))}
                                  className="w-full p-2 rounded-md border border-[#3E424D] bg-[#343841] text-white focus:ring-1 focus:ring-indigo-500 text-sm"
                                />
                              </div>

                              <div>
                                <label className="block mb-1 text-xs font-medium text-gray-300">
                                  Score
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="1000"
                                  value={currentScore}
                                  onChange={(e) => handleScoreChange(process.name, e.target.value)}
                                  className="w-full p-2 rounded-md border border-[#3E424D] bg-[#343841] text-white focus:ring-1 focus:ring-indigo-500 text-sm"
                                />
                                <div className="text-xs text-green-300 mt-1">
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

              {/* Result Section */}
              <div className="border border-[#3E424D] rounded-md p-4 bg-[#2A2D36]">
                <h2 className="text-lg font-semibold mb-3 text-indigo-300">Result</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-300">Grade:</label>
                    <select
                      name="grade"
                      value={formData.grade}
                      onChange={handleChange}
                      className="w-full p-2 rounded-md border border-[#3E424D] bg-[#343841] text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
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
                    <label className="block mb-1 text-sm font-medium text-gray-300">Result:</label>
                    <select
                      name="result"
                      value={formData.result}
                      onChange={handleChange}
                      className="w-full p-2 rounded-md border border-[#3E424D] bg-[#343841] text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
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
                      className="mr-2 h-4 w-4 rounded border-[#3E424D] bg-[#343841] text-indigo-600 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <label className={`text-sm font-medium ${(formData.result === 'PENDING' || formData.result === 'FAILED') ? 'text-gray-500' : 'text-gray-300'}`}>
                      Promoted to Admin
                      {(formData.result === 'PENDING' || formData.result === 'FAILED') && (
                        <span className="text-xs text-gray-400 ml-1">(Only available for PASSED candidates)</span>
                      )}
                    </label>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block mb-1 text-sm font-medium text-gray-300">Remarks:</label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    className="w-full p-2 rounded-md border border-[#3E424D] bg-[#343841] text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
                    rows="3"
                  />
                </div>

                {formData.result === 'FAILED' && (
                  <div className="mt-4">
                    <label className="block mb-1 text-sm font-medium text-gray-300">Canceled Reason:</label>
                    <input
                      type="text"
                      name="canceledReason"
                      value={formData.canceledReason}
                      onChange={handleChange}
                      className="w-full p-2 rounded-md border border-[#3E424D] bg-[#343841] text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Update Button */}
              <button
                type="submit"
                disabled={updating || !hasChanges}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-3 rounded-md shadow-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors text-base"
              >
                {updating ? 'Updating...' : 'Update Candidate Information'}
              </button>

              {!hasChanges && (
                <div className="text-center text-gray-400 text-sm">
                  No changes made to update
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}