'use client';

import { useState, useEffect, useRef } from 'react';
import NidOrBirthCertificateSearch from '@/components/NidOrBirthCertificate';
import Link from 'next/link';

export default function InterviewStepTwo() {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedCandidateData, setSelectedCandidateData] = useState(null);
  const [failureReason, setFailureReason] = useState('');
  const [showReasonInput, setShowReasonInput] = useState(false);
  
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  const [chairmanCertificate, setChairmanCertificate] = useState(false);
  const [educationCertificate, setEducationCertificate] = useState(true); // Changed: Default true
  const [experienceMachines, setExperienceMachines] = useState({
    SNLS_DNLS: false,
    OverLock: false,
    FlatLock: false
  });
  const [designation, setDesignation] = useState({
    ASST_OPERATOR: false,
    OPERATOR: true, // Changed: Default true for OPERATOR
  });
  const [otherInfo, setOtherInfo] = useState('');
  const [floor, setFloor] = useState('');
  const [homeDistrict, setHomeDistrict] = useState(''); 
  
  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [searchKey, setSearchKey] = useState(0);

  const [distSearchTerm, setDistSearchTerm] = useState('');
  const [isDistDropdownOpen, setIsDistDropdownOpen] = useState(false);

  const [floorSummary, setFloorSummary] = useState({
  SHAPLA: 0,
  PODDO: 0,
  KODOM: 0,
  BELLY: 0
});

  const distDropdownRef = useRef(null);

  const FAILURE_REASONS = ["A", "B", "C", "D", "E", "F"];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (distDropdownRef.current && !distDropdownRef.current.contains(event.target)) {
        setIsDistDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchFloorSummary = async () => {
  try {
    const response = await fetch(
      `/api/iep-interview/candidateFloorWise?date=${filterDate}`
    );

    const data = await response.json();

    if (response.ok && data.success) {
      setFloorSummary(data.data);
    }
  } catch (error) {
    console.error("Floor summary fetch error:", error);
  }
};

  const DISTRICTS = [
    "BARISHAL", "BHOLA", "JHALOKATHI", "PATUAKHALI", "PIROJPUR", "BARGUNA",
    "CHATTOGRAM", "COX'S BAZAR", "RANGAMATI", "BANDARBAN", "KHAGRACHHARI", "FENI", "LAKSHMIPUR", "CUMILLA", "NOAKHALI", "BRAHMANBARIA", "CHANDPUR",
    "DHAKA", "GAZIPUR", "KISHOREGANJ", "MANIKGANJ", "MUNSHIGANJ", "NARAYANGANJ", "NARSINGDI", "TANGAIL", "FARIDPUR", "GOPALGANJ", "MADARIPUR", "RAJBARI", "SHARIATPUR",
    "KHULNA", "BAGERHAT", "SATKHIRA", "JESHORE", "MAGURA", "JHENAIDAH", "NARAIL", "KUSHTIA", "CHUADANGA", "MEHERPUR",
    "MYMENSINGH", "NETROKONA", "SHERPUR", "JAMALPUR",
    "RAJSHAHI", "JOYPURHAT", "NAOGAON", "NATORE", "CHAPAINAWABGANJ", "PABNA", "SIRAJGANJ", "BOGURA",
    "RANGPUR", "DINAJPUR", "KURIGRAM", "GAIBANDHA", "LALMONIRHAT", "NILPHAMARI", "PANCHAGARH", "THAKURGAON",
    "SYLHET", "HABIGANJ", "MOULVIBAZAR", "SUNAMGANJ"
  ].sort();

  const filteredDistricts = DISTRICTS.filter(d => 
    d.toLowerCase().includes(distSearchTerm.toLowerCase())
  );

  

  const fetchCandidates = async () => {
    try {
      setLoading(true);
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

  useEffect(() => {
  fetchCandidates();
  fetchFloorSummary();
}, [filterDate]);

  const handleSelectCandidate = async (candidate) => {
    setSelectedCandidate(candidate.candidateId);
    setSelectedCandidateData(candidate);
    setSearchTerm(`${candidate.candidateId} - ${candidate.name}`);
    setIsDropdownOpen(false);
    setFailureReason('');
    setShowReasonInput(false);
    setChairmanCertificate(true);
    setEducationCertificate(false);
    setExperienceMachines({ SNLS_DNLS: false, OverLock: false, FlatLock: false });
    setDesignation({ ASST_OPERATOR: false, OPERATOR: true });
    setOtherInfo('');
    setHomeDistrict('');
    setMessage('');
    setShowSearch(false);

    // --- API Call to check duplicate NID/BC ---
    try {
      const idToCheck = candidate.nid || candidate.birthCertificate;
      if (idToCheck) {
        const res = await fetch(`/api/iep-interview/check-nid-ignore-today?nid=${idToCheck}`);
        const data = await res.json();

        if (data.exists) {
          // নির্দিষ্ট ফরম্যাটে মেসেজ সেট করা হচ্ছে
          setMessage(`⚠️ This ${candidate.nid ? 'NID' : 'Birth Certificate'} (${idToCheck}) already exists in database. Candidate: ${data.name}`);
        }
      }
    } catch (error) {
      console.error("Error checking duplicate candidate:", error);
    }
  };

  const handleClearSelectedCandidate = () => {
  setSelectedCandidate('');
  setSelectedCandidateData(null);
  setSearchTerm('');
  setMessage('');
  setShowReasonInput(false);
  setFailureReason('');
  setShowSearch(false);
  setHomeDistrict('');
  setFloor('');
};


  const handleMachineChange = (machine) => {
    setExperienceMachines(prev => ({ ...prev, [machine]: !prev[machine] }));
  };

  const handleDesignation = (desig) => {
    setDesignation(prev => {
      // Create new object with all false
      const newState = {
        ASST_OPERATOR: false,
        OPERATOR: false
      };
      // Set the clicked one to true (toggle)
      newState[desig] = !prev[desig];
      return newState;
    });
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
    
    // District validation - must be submitted
    if (!homeDistrict.trim()) {
      alert("Please select Home District before submitting.");
      return;
    }
    
    if (resultValue === 'FAILED' && !failureReason.trim()) {
      alert("Please provide a reason for failure.");
      return;
    }
    
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
        floor: resultValue === 'PASSED' ? floor : '',
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
        setShowReasonInput(false); 
        setFailureReason('');
        fetchCandidates(); 
      } else {
        const errorData = await response.json();
        setMessage(errorData.message || 'Failed to update candidate status');
      }
    } catch (error) {
      setMessage('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handlePassedButtonClick = () => {
    // District validation before passing
    if (!homeDistrict.trim()) {
      alert("Please select Home District before submitting.");
      return;
    }
    handleResultUpdate('PASSED');
  };
  
  const handleFailedButtonClick = () => {
    // District validation before showing reason input
    if (!homeDistrict.trim()) {
      alert("Please select Home District before submitting.");
      return;
    }
    setShowReasonInput(true);
    setTimeout(() => document.getElementById('failureReason')?.focus(), 100);
  };

  const filteredCandidatesList = candidates.filter(c => 
    `${c.candidateId} ${c.name} ${c.nid || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#a162e8] via-[#8a43d6] to-[#6b21a8] mt-10 py-8">
      
      {/* CSS For Native Date Picker Animation */}
      <style jsx global>{`
        input[type="date"]::-webkit-calendar-picker-indicator {
          animation: pulseIcon 1.5s infinite;
          cursor: pointer;
          border-radius: 4px;
          padding: 2px;
        }
        @keyframes pulseIcon {
          0% { box-shadow: 0 0 0 0 rgba(138, 67, 214, 0.7); }
          70% { box-shadow: 0 0 0 6px rgba(138, 67, 214, 0); }
          100% { box-shadow: 0 0 0 0 rgba(138, 67, 214, 0); }
        }
      `}</style>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6 border-b border-purple-300 pb-6">
            <h1 className="text-3xl font-extrabold text-[#6b21a8] drop-shadow-sm tracking-tight">
              ADMIN (SELECTION)
            </h1>
            
            <div className="flex items-center gap-6">
              {/* PDF Text with Hover Background Color */}
              <Link href="/admin/iep-interview/2nd-step/report" 
                className="text-sm font-bold text-gray-700 hover:text-[#6b21a8] hover:bg-purple-100 px-3 py-1 rounded-lg transition-all duration-400">
                PDF
              </Link>
              
              {/* Date Filter */}
              <div className="flex items-center gap-3 bg-[#f3e8ff] px-4 py-2 rounded-xl border border-[#b384e6]">
                <label className="text-[10px] font-black text-[#6b21a8] uppercase">Filter Date:</label>
                <input 
                  type="date" 
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="bg-transparent text-[#6b21a8] font-bold text-sm focus:outline-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Floor Wise Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Object.entries(floorSummary).map(([floorName, count]) => (
            <div
              key={floorName}
              className="bg-gradient-to-br from-[#f3e8ff] to-white border border-purple-200 rounded-2xl p-5 shadow-sm"
            >
              <p className="text-xs font-black text-[#6b21a8] uppercase mb-2">
                {floorName}
              </p>
              <h2 className="text-3xl font-extrabold text-gray-800">
                {count}
              </h2>
              <p className="text-xs text-gray-400 font-semibold mt-1">
                Total Passed
              </p>
            </div>
          ))}
        </div>

          {/* Search Bar & Dropdown UI */}
          <div className="mb-8 relative pb-8" ref={dropdownRef}>
            <div className="flex items-center mb-3">
               <span className="bg-[#8a43d6] w-2 h-6 rounded-full mr-2"></span>
               <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Select Candidate</label>
            </div>
            <div className="relative group">
              <input
                type="text"
                placeholder="Search by ID or Name..."
                value={searchTerm}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => { setSearchTerm(e.target.value); setIsDropdownOpen(true); }}
                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl shadow-inner focus:outline-none focus:border-[#a162e8] focus:bg-white transition-all text-gray-700 placeholder-gray-400 font-semibold"
              />
              <div className="absolute right-4 top-3 flex items-center gap-2">
  {searchTerm && (
    <button
      type="button"
      onClick={handleClearSelectedCandidate}
      className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 text-red-600 font-bold text-lg flex items-center justify-center transition"
    >
      ×
    </button>
  )}

  <div className="text-[#a162e8] opacity-60">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  </div>
</div>
            </div>

            {isDropdownOpen && (
              <div className="absolute z-20 mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-72 overflow-auto animate-in slide-in-from-top-2 duration-200">
                {filteredCandidatesList.length > 0 ? (
                  filteredCandidatesList.map(c => (
                    <div key={c.candidateId} onClick={() => handleSelectCandidate(c)} className="px-6 py-4 hover:bg-[#f3e8ff] cursor-pointer border-b border-gray-50 last:border-none transition-colors group">
                      <div className="font-bold text-gray-800 group-hover:text-[#6b21a8]">{c.candidateId} - {c.name}</div>
                      <div className="text-xs text-gray-500 font-medium">{c.nid ? `NID: ${c.nid}` : `BC: ${c.birthCertificate}`}</div>
                    </div>
                  ))
                ) : <div className="p-6 text-center text-gray-400 font-medium">No eligible candidates found</div>}
              </div>
            )}
          </div>

          {message && (
  <div className={` mb-6 p-4 rounded-2xl text-center font-bold animate-in slide-in-from-top-2 border shadow-sm ${
    message.includes('⚠️') 
      ? 'bg-amber-50 text-red-600 border-amber-200' // Warning style
      : message.includes('successfully') 
        ? 'bg-green-50 text-green-700 border-green-100' // Success style
        : 'bg-red-50 text-red-700 border-red-100' // Error style
  }`}>
    {message}
  </div>
)}

          {/* Selected Candidate Details */}
          {selectedCandidateData && (
            <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-white rounded-2xl border border-purple-100 shadow-sm animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-[#6b21a8]">Candidate Profile</h3>
                <button onClick={handleSearch} className="bg-[#6b21a8] hover:bg-[#581c87] text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 text-sm transition-all shadow-md active:scale-95">
                  🔍 View Full Details
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-2">
                  <p className="text-gray-600 font-medium"><span className="text-gray-400 font-bold uppercase text-[10px] mr-2">Name:</span> {selectedCandidateData.name}</p>
                  <p className="text-gray-600 font-medium"><span className="text-gray-400 font-bold uppercase text-[10px] mr-2">Candidate ID:</span> {selectedCandidateData.candidateId}</p>
                  <p className="text-gray-600 font-medium"><span className="text-gray-400 font-bold uppercase text-[10px] mr-2">Document ID:</span> {selectedCandidateData.nid || selectedCandidateData.birthCertificate || 'N/A'}</p>
                </div>
                {selectedCandidateData.picture && (
                  <div className="flex justify-center md:justify-end">
                    <img src={selectedCandidateData.picture} alt="Candidate" className="w-28 h-28 object-cover rounded-2xl shadow-md border-4 border-white ring-1 ring-purple-100" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Info Section */}
          {selectedCandidateData && (
            <div className="mb-8 p-6 bg-[#f9f5ff] rounded-2xl border border-[#e9d5ff]">
              <h3 className="text-lg font-bold text-[#6b21a8] mb-6">Additional Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative" ref={distDropdownRef}>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Home District <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="Search district..."
                    value={homeDistrict || distSearchTerm}
                    onFocus={() => { setIsDistDropdownOpen(true); setDistSearchTerm(''); }}
                    onChange={(e) => { setDistSearchTerm(e.target.value); setHomeDistrict(e.target.value); setIsDistDropdownOpen(true); }}
                    className="w-full px-4 py-2.5 bg-white border border-[#d8b4fe] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#a162e8] text-sm font-semibold"
                    required
                  />
                  {isDistDropdownOpen && (
                    <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-auto">
                      {filteredDistricts.map(dist => (
                        <div key={dist} onClick={() => { setHomeDistrict(dist); setDistSearchTerm(dist); setIsDistDropdownOpen(false); }} 
                        className="px-4 py-2 hover:bg-[#f3e8ff] cursor-pointer text-sm border-b last:border-none">
                          {dist}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Floor Assignment</label>
                  <select value={floor} onChange={(e) => setFloor(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-[#d8b4fe] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#a162e8] text-sm font-semibold">
                    <option value="">Select Floor</option>
                    <option value="SHAPLA">SHAPLA</option>
                    <option value="PODDO">PODDO</option>
                    <option value="KODOM">KODOM</option>
                    <option value="BELLY">BELLY</option>
                  </select>
                </div>
              </div>

              <div className="mt-8 space-y-6">
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={chairmanCertificate} onChange={(e) => setChairmanCertificate(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-[#6b21a8] focus:ring-[#a162e8]" />
                    <span className="text-sm font-bold text-gray-700 group-hover:text-[#6b21a8]">Chairman Certificate</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={educationCertificate} onChange={(e) => setEducationCertificate(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-[#6b21a8] focus:ring-[#a162e8]" />
                    <span className="text-sm font-bold text-gray-700 group-hover:text-[#6b21a8]">Education Certificate</span>
                  </label>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#6b21a8] uppercase mb-3">Experience Machine</label>
                  <div className="flex flex-wrap gap-3">
                    {Object.keys(experienceMachines).map(machine => (
                      <label key={machine} className={`flex items-center px-4 py-2 rounded-xl border-2 transition-all cursor-pointer ${experienceMachines[machine] ? 'bg-[#6b21a8] border-[#6b21a8] text-white' : 'bg-white border-gray-100 text-gray-600 hover:border-purple-200'}`}>
                        <input type="checkbox" className="hidden" checked={experienceMachines[machine]} onChange={() => handleMachineChange(machine)} />
                        <span className="text-xs font-bold">{machine.replace('_', '/')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#a162e8] uppercase mb-3">Designation (Radio style - only one selectable)</label>
                  <div className="flex flex-wrap gap-3">
                    {Object.keys(designation).map(desig => (
                      <label key={desig} className={`flex items-center px-4 py-2 rounded-xl border-2 transition-all cursor-pointer ${designation[desig] ? 'bg-[#a162e8] border-[#a162e8] text-white' : 'bg-white border-gray-100 text-gray-600 hover:border-purple-200'}`}>
                        <input type="checkbox" className="hidden" checked={designation[desig]} onChange={() => handleDesignation(desig)} />
                        <span className="text-xs font-bold">{desig.replace('_', '/')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Others Remarks</label>
                  <textarea value={otherInfo} onChange={(e) => setOtherInfo(e.target.value)} placeholder="Other info..." className="w-full px-4 py-3 bg-white border border-[#d8b4fe] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#a162e8] text-sm font-semibold" rows="2" />
                </div>
              </div>
            </div>
          )}

          {showSearch && (
            <div className="mb-8 border-4 border-[#f3e8ff] rounded-3xl overflow-hidden shadow-xl">
              <NidOrBirthCertificateSearch key={searchKey} nidOrBirthCertificateValue={searchValue} autoSearch={true} />
            </div>
          )}

          {/* Action Buttons */}
          {selectedCandidateData && !showReasonInput && (
            <div className="flex gap-4">
              <button onClick={handlePassedButtonClick} disabled={loading} className="flex-1 bg-green-500 text-white py-4 rounded-2xl font-bold hover:bg-green-600 disabled:opacity-50 transition-all shadow-lg active:scale-95">
                Mark as PASSED
              </button>
              <button onClick={handleFailedButtonClick} disabled={loading} className="flex-1 bg-red-500 text-white py-4 rounded-2xl font-bold hover:bg-red-600 disabled:opacity-50 transition-all shadow-lg active:scale-95">
                Mark as FAILED
              </button>
            </div>
          )}

          {showReasonInput && (
            <div className="mb-4 p-6 bg-red-50 rounded-2xl border border-red-200">
              <label className="block text-xs font-bold text-red-700 mb-3 uppercase">Reason for Failure *</label>
              <select id="failureReason" value={failureReason} onChange={(e) => setFailureReason(e.target.value)} className="w-full px-4 py-3 border-2 border-red-100 rounded-xl mb-4 focus:outline-none font-bold">
                <option value="">Select Failure Reason</option>
                {FAILURE_REASONS.map((reason, index) => (
                  <option key={index} value={reason}>{reason}</option>
                ))}
              </select>
              <div className="flex gap-3">
                <button onClick={() => handleResultUpdate('FAILED')} className="bg-red-600 text-white py-2.5 px-6 rounded-xl font-bold hover:bg-red-700">Confirm Failed</button>
                <button onClick={() => setShowReasonInput(false)} className="bg-gray-400 text-white py-2.5 px-6 rounded-xl font-bold hover:bg-gray-500">Cancel</button>
              </div>
            </div>
          )}

          
        </div>
      </div>
    </div>
  );
}