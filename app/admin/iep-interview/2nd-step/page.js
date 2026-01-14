'use client';

import { useState, useEffect, useRef } from 'react';
import NidOrBirthCertificateSearch from '@/components/NidOrBirthCertificate';

export default function InterviewStepTwo() {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedCandidateData, setSelectedCandidateData] = useState(null);
  const [failureReason, setFailureReason] = useState('');
  const [showReasonInput, setShowReasonInput] = useState(false);
  
  // --- New Date Filter State ---
  // Default আজকের তারিখ (YYYY-MM-DD format)
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  // --- Searchable Dropdown States ---
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // Additional information
  const [chairmanCertificate, setChairmanCertificate] = useState(false);
  const [educationCertificate, setEducationCertificate] = useState(false);
  const [experienceMachines, setExperienceMachines] = useState({
    SNLS_DNLS: false,
    OverLock: false,
    FlatLock: false
  });
  const [designation, setDesignation] = useState({
    ASST_OPERATOR: false,
    OPERATOR: false,
  });
  const [otherInfo, setOtherInfo] = useState('');
  const [floor, setFloor] = useState('');
  const [homeDistrict, setHomeDistrict] = useState(''); 
  
  // Search related states
  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [searchKey, setSearchKey] = useState(0);

  // Outside click handle
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch candidates when date changes
  useEffect(() => {
    fetchCandidates();
  }, [filterDate]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      // নতুন তৈরি করা API টি কল করা হচ্ছে তারিখসহ
      const response = await fetch(`/api/iep-interview/eligible-candidates-down-admin?date=${filterDate}`);
      const data = await response.json();
      
      if (response.ok) {
        setCandidates(data);
      } else {
        setCandidates([]);
        setMessage(data.message || 'Error fetching candidates');
      }
    } catch (error) {
      setMessage('Network error while fetching candidates');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCandidate = (candidate) => {
    setSelectedCandidate(candidate.candidateId);
    setSelectedCandidateData(candidate);
    setSearchTerm(`${candidate.candidateId} - ${candidate.name}`);
    setIsDropdownOpen(false);
    
    // Reset fields
    setFailureReason('');
    setShowReasonInput(false);
    setChairmanCertificate(false);
    setEducationCertificate(false);
    setExperienceMachines({ SNLS_DNLS: false, OverLock: false, FlatLock: false });
    setDesignation({ ASST_OPERATOR: false, OPERATOR: false });
    setOtherInfo('');
    setFloor('');
    setMessage('');
    setShowSearch(false);
  };

  const handleMachineChange = (machine) => {
    setExperienceMachines(prev => ({ ...prev, [machine]: !prev[machine] }));
  };

  const handleDesignation = (desig) => {
    setDesignation(prev => ({ ...prev, [desig]: !prev[desig] }));
  };

  const handleSearch = () => {
    if (!selectedCandidateData) return;
    const val = selectedCandidateData.nid?.trim() || selectedCandidateData.birthCertificate?.trim();
    if (!val) { alert('No ID available'); return; }
    setSearchValue(val);
    setSearchKey(prev => prev + 1);
    setShowSearch(true);
  };

  const handleResultUpdate = async (resultValue) => {
    if (!selectedCandidate) return;
    if (resultValue === 'FAILED' && !failureReason.trim()) return;

    try {
      setLoading(true);
      const requestData = {
        candidateId: selectedCandidate,
        result: resultValue,
        name: selectedCandidateData.name,
        nid: selectedCandidateData.nid,
        birthCertificate: selectedCandidateData.birthCertificate,
        picture: selectedCandidateData.picture,
        homeDistrict,
        chairmanCertificate,
        educationCertificate,
        experienceMachines,
        designation,
        floor,
        otherInfo: otherInfo.trim(),
        failureReason: resultValue === 'FAILED' ? failureReason : null
      };

      const response = await fetch('/api/iep-interview/iep-interview-down-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        setMessage(`Candidate successfully marked as ${resultValue}`);
        setSelectedCandidate('');
        setSelectedCandidateData(null);
        setSearchTerm('');
        fetchCandidates(); // Refresh list
      }
    } catch (error) {
      setMessage('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handlePassedButtonClick = () => handleResultUpdate('PASSED');
  const handleFailedButtonClick = () => {
    setShowReasonInput(true);
    setTimeout(() => document.getElementById('failureReason')?.focus(), 100);
  };

  const filteredCandidatesList = candidates.filter(c => 
    `${c.candidateId} ${c.name} ${c.nid || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const DISTRICTS = [
    "BARISHAL", "BHOLA", "JHALOKATHI", "PATUAKHALI", "PIROJPUR", "BARGUNA",
    "CHATTOGRAM", "COX'S BAZAR", "RANGAMATI", "BANDARBAN", "KHAGRACHHARI", "FENI", "LAKSHMIPUR", "CUMILLA", "NOAKHALI", "BRAHMANBARIA",
    "DHAKA", "GAZIPUR", "KISHOREGANJ", "MANIKGANJ", "MUNSHIGANJ", "NARAYANGANJ", "NARSINGDI", "TANGAIL", "FARIDPUR", "GOPALGANJ", "MADARIPUR", "RAJBARI", "SHARIATPUR",
    "KHULNA", "BAGERHAT", "SATKHIRA", "JESHORE", "MAGURA", "JHENAIDAH", "NARAIL", "KUSHTIA", "CHUADANGA", "MEHERPUR",
    "MYMENSINGH", "NETROKONA", "SHERPUR", "JAMALPUR",
    "RAJSHAHI", "JOYPURHAT", "NAOGAON", "NATORE", "CHAPAINAWABGANJ", "PABNA", "SIRAJGANJ", "BOGURA",
    "RANGPUR", "DINAJPUR", "KURIGRAM", "GAIBANDHA", "LALMONIRHAT", "NILPHAMARI", "PANCHAGARH", "THAKURGAON",
    "SYLHET", "HABIGANJ", "MOULVIBAZAR", "SUNAMGANJ"
  ].sort();

  return (
    <div className="min-h-screen bg-gray-50 mt-10 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h1 className="text-2xl font-bold text-gray-900">ADMIN (SELECTION)</h1>
            
            {/* --- Date Filter UI --- */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">Filter Date:</label>
              <input 
                type="date" 
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="border rounded-md px-2 py-1 text-sm focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Searchable Dropdown UI */}
          <div className="mb-6 relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Candidate</label>
            <input
              type="text"
              placeholder="Search by ID or Name..."
              value={searchTerm}
              onFocus={() => setIsDropdownOpen(true)}
              onChange={(e) => { setSearchTerm(e.target.value); setIsDropdownOpen(true); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
            />
            {isDropdownOpen && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-xl max-h-60 overflow-auto">
                {filteredCandidatesList.length > 0 ? (
                  filteredCandidatesList.map(c => (
                    <div key={c.candidateId} onClick={() => handleSelectCandidate(c)} className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b last:border-none">
                      <div className="font-semibold text-gray-800">{c.candidateId} - {c.name}</div>
                      <div className="text-xs text-gray-500">{c.nid ? `NID: ${c.nid}` : `BC: ${c.birthCertificate}`}</div>
                    </div>
                  ))
                ) : <div className="p-4 text-center text-gray-500">No eligible candidates for this date</div>}
              </div>
            )}
          </div>

          {/* Selected Candidate Details */}
          {selectedCandidateData && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg animate-in fade-in duration-300">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Candidate Details</h3>
                <button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 text-sm transition-colors">🔍 View Details</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p><strong>Name:</strong> {selectedCandidateData.name}</p>
                  <p><strong>Candidate ID:</strong> {selectedCandidateData.candidateId}</p>
                  <p><strong>ID:</strong> {selectedCandidateData.nid || selectedCandidateData.birthCertificate || 'N/A'}</p>
                </div>
                {selectedCandidateData.picture && (
                  <img src={selectedCandidateData.picture} alt="Candidate" className="w-24 h-24 object-cover rounded-md mt-2 border" />
                )}
              </div>
            </div>
          )}

          {/* Additional Info Section */}
          {selectedCandidateData && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Home District</label>
                <select value={homeDistrict} onChange={(e) => setHomeDistrict(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">Select District</option>
                  {DISTRICTS.map(dist => <option key={dist} value={dist}>{dist}</option>)}
                </select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-6">
                  <label className="flex items-center text-sm text-gray-900 cursor-pointer"><input type="checkbox" checked={chairmanCertificate} onChange={(e) => setChairmanCertificate(e.target.checked)} className="mr-2 h-4 w-4" /> Chairman Certificate</label>
                  <label className="flex items-center text-sm text-gray-900 cursor-pointer"><input type="checkbox" checked={educationCertificate} onChange={(e) => setEducationCertificate(e.target.checked)} className="mr-2 h-4 w-4" /> Education Certificate</label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experience Machine Name</label>
                  <div className="flex flex-wrap gap-4">
                    {Object.keys(experienceMachines).map(machine => (
                      <label key={machine} className="flex items-center text-sm cursor-pointer"><input type="checkbox" checked={experienceMachines[machine]} onChange={() => handleMachineChange(machine)} className="mr-2 h-4 w-4" /> {machine.replace('_', '/')}</label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Designation</label>
                  <div className="flex flex-wrap gap-4">
                    {Object.keys(designation).map(desig => (
                      <label key={desig} className="flex items-center text-sm cursor-pointer"><input type="checkbox" checked={designation[desig]} onChange={() => handleDesignation(desig)} className="mr-2 h-4 w-4" /> {desig.replace('_', '/')}</label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Floor</label>
                  <select value={floor} onChange={(e) => setFloor(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="">Select Floor</option>
                    <option value="SHAPLA">SHAPLA</option><option value="PODDO">PODDO</option><option value="KODOM">KODOM</option><option value="BELLY">BELLY</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Others</label>
                  <textarea value={otherInfo} onChange={(e) => setOtherInfo(e.target.value)} placeholder="Other info..." className="w-full px-3 py-2 border border-gray-300 rounded-md" rows="2" />
                </div>
              </div>
            </div>
          )}

          {showSearch && (
            <div className="mb-6 border rounded-lg overflow-hidden">
              <NidOrBirthCertificateSearch key={searchKey} nidOrBirthCertificateValue={searchValue} autoSearch={true} />
            </div>
          )}

          {/* Action Buttons */}
          {selectedCandidateData && !showReasonInput && (
            <div className="flex gap-4 mb-4">
              <button 
                onClick={handlePassedButtonClick} 
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                Mark as PASSED
              </button>
              <button 
                onClick={handleFailedButtonClick} 
                disabled={loading}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                Mark as Failed
              </button>
            </div>
          )}

          {showReasonInput && (
            <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <label className="block text-sm font-medium text-red-700 mb-2">Reason for Failure *</label>
              <textarea id="failureReason" value={failureReason} onChange={(e) => setFailureReason(e.target.value)} className="w-full px-3 py-2 border border-red-300 rounded-md mb-3" rows="2" />
              <div className="flex gap-2">
                <button onClick={() => handleResultUpdate('FAILED')} className="bg-red-600 text-white py-2 px-4 rounded-md">Confirm Failed</button>
                <button onClick={() => setShowReasonInput(false)} className="bg-gray-500 text-white py-2 px-4 rounded-md">Cancel</button>
              </div>
            </div>
          )}

          {message && (
            <div className={`p-3 rounded-md text-center mb-4 ${message.includes('successfully') ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
              {message}
            </div>
          )}
          
          
        </div>
      </div>
    </div>
  );
}