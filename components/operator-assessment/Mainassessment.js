// components/operator-assessment/Mainassessment.js 
'use client'
import { useState, useEffect } from 'react'
import Select from "react-select";
import ProcessSelect from "@/components/ProcessSelect";

export default function MainAssessment({ onAssessmentComplete, candidateInfo }) {
  const [currentView, setCurrentView] = useState('data-entry')
  const [assessmentData, setAssessmentData] = useState(null)
  const [operatorName, setOperatorName] = useState('')
  const [processesList, setProcessesList] = useState([])
  const [searchCandidateId, setSearchCandidateId] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Client-side detection
  useEffect(() => {
    setIsClient(true)
  }, [])

  // candidateInfo থেকে ডেটা লোড করুন
  useEffect(() => {
    if (candidateInfo) {
      setOperatorName(candidateInfo.name || '');
      initializeNewData();
    }
  }, [candidateInfo])

  // API থেকে প্রসেস ডেটা লোড করা
  useEffect(() => {
    fetchProcesses()
  }, [])

  const fetchProcesses = async () => {
    try {
      const response = await fetch('/api/processes')
      const data = await response.json()
      setProcessesList(data)
    } catch (error) {
      console.error('Error fetching processes:', error)
    }
  }

  // নতুন ডেটা ইনিশিয়ালাইজ করার ফাংশন
  const initializeNewData = (candidateData = null) => {
    const candidate = candidateData || candidateInfo
    if (candidate) {
      const initialData = {
        operatorName: candidate.name || '',
        candidateId: candidate.candidateId || '',
        nid: candidate.nid || '',
        birthCertificate: candidate.birthCertificate || '',
        date: isClient ? new Date().toISOString().split('T')[0] : '',
        fatherHusbandName: '',
        educationalStatus: 'Eight Above',
        attitude: 'Good',
        sewingFloor: 'Sewing Floor',
        processes: [
          {
            machineType: 'SNLS/DNLS',
            processName: '',
            dop: '',
            smv: 0,
            cycleTimes: [0, 0, 0, 0, 0],
            qualityStatus: 'No Defect',
            remarks: ''
          }
        ],
        supplementaryMachines: []
      };
      setAssessmentData(initialData);
    }
  }

  // Candidate ID দিয়ে সার্চ করার ফাংশন
  const handleSearchCandidate = async () => {
    if (!searchCandidateId.trim()) {
      alert('Please enter a Candidate ID')
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/iep-interview/update-iep-interview-ass-calculator/candidate?candidateId=${searchCandidateId}`)
      
      if (!response.ok) {
        throw new Error('Candidate not found')
      }
      
      const result = await response.json()
      
      if (result.success && result.data && result.data.length > 0) {
        const candidateData = result.data[0]
        setSearchResults(candidateData)
        
        // API থেকে পাওয়া assessmentData ব্যবহার করে ফর্ম অটো ফিল করুন
        if (candidateData.assessmentData) {
          setOperatorName(candidateData.assessmentData.operatorName || candidateData.name)
          setAssessmentData(candidateData.assessmentData.rawData)
        } else {
          // যদি assessmentData না থাকে, শুধু candidate info দিয়ে initialize করুন
          setOperatorName(candidateData.name || '')
          initializeNewData(candidateData)
        }
      } else {
        throw new Error('Candidate not found')
      }
      
    } catch (error) {
      console.error('Error searching candidate:', error)
      alert('Candidate not found or error fetching data')
      setSearchResults(null)
    } finally {
      setIsSearching(false)
    }
  }

  // সার্চ ক্লিয়ার করার ফাংশন
  const handleClearSearch = () => {
    setSearchCandidateId('')
    setSearchResults(null)
    if (candidateInfo) {
      initializeNewData()
    } else {
      setAssessmentData(null)
      setOperatorName('')
    }
  }

  // ডেটা সেভ করার ফাংশন
  const handleSaveData = (data) => {
    const completeData = {
      ...data,
      operatorName: operatorName || data.operatorName,
      candidateId: searchResults?.candidateId || candidateInfo?.candidateId || data.candidateId,
      nid: searchResults?.nid || candidateInfo?.nid || data.nid,
      birthCertificate: searchResults?.birthCertificate || candidateInfo?.birthCertificate || data.birthCertificate,
      lastSaved: new Date().toISOString()
    }
    
    setAssessmentData(completeData)
    setCurrentView('results')
  }

  // ডেটা এন্ট্রিতে ফিরে যাওয়ার ফাংশন
  const handleBackToDataEntry = () => {
    setCurrentView('data-entry')
  }

  // ডেটা ক্লিয়ার করার ফাংশন
  const handleClearData = () => {
    setAssessmentData(null)
    setOperatorName('')
    setSearchResults(null)
    setSearchCandidateId('')
    if (candidateInfo) {
      initializeNewData()
    }
  }

  // Assessment সম্পূর্ণ হলে parent component কে ডেটা পাঠানো
  const handleUseAssessment = () => {
    if (assessmentData) {
      const calculatedResults = calculateResults(assessmentData)
      
      const calculateProcessCapacity = (processes) => {
        const capacityData = {}
        processes.forEach(process => {
          if (process.processName && process.capacity) {
            capacityData[process.processName] = Math.round(process.capacity)
          }
        })
        return capacityData
      }

      const processCapacity = calculateProcessCapacity(calculatedResults.processes)
      
      const supplementaryMachinesData = {}
      if (assessmentData.supplementaryMachines) {
        assessmentData.supplementaryMachines.forEach(machine => {
          if (machine.checked) {
            supplementaryMachinesData[machine.name] = true
          }
        })
      }
      
      const assessmentResult = {
        candidateInfo: searchResults || candidateInfo ? {
          name: searchResults?.name || candidateInfo?.name,
          candidateId: searchResults?.candidateId || candidateInfo?.candidateId,
          nid: searchResults?.nid || candidateInfo?.nid,
          birthCertificate: searchResults?.birthCertificate || candidateInfo?.birthCertificate,
          picture: searchResults?.picture || candidateInfo?.picture
        } : null,
        
        operatorName: assessmentData.operatorName,
        scores: {
          machineScore: calculatedResults.scores.machineScore,
          dopScore: calculatedResults.scores.dopScore,
          practicalScore: calculatedResults.scores.practicalScore,
          averageQualityScore: calculatedResults.scores.averageQualityScore,
          educationScore: calculatedResults.scores.educationScore,
          attitudeScore: calculatedResults.scores.attitudeScore,
          totalScore: calculatedResults.scores.totalScore
        },
        finalAssessment: {
          grade: calculatedResults.finalAssessment.grade,
          level: calculatedResults.finalAssessment.level,
          designation: calculatedResults.finalAssessment.designation
        },
        processCapacity: processCapacity,
        supplementaryMachines: supplementaryMachinesData,
        rawData: assessmentData
      }

      if (onAssessmentComplete) {
        onAssessmentComplete(assessmentResult)
      }
    }
  }

  // Show loading state until client-side rendering
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">GMS Textiles Ltd.</h1>
              <p className="text-sm text-gray-600">Operator Skill Assessment</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setCurrentView('data-entry')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  currentView === 'data-entry'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Data Entry
              </button>
              <button
                onClick={() => setCurrentView('results')}
                disabled={!assessmentData}
                className={`px-4 py-2 rounded-md transition-colors ${
                  !assessmentData
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : currentView === 'results'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                View Results
              </button>
              {currentView === 'results' && onAssessmentComplete && (
                <button
                  onClick={handleUseAssessment}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Use This Assessment
                </button>
              )}
              {assessmentData && (
                <button
                  onClick={handleClearData}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                  title="Clear all data"
                >
                  Clear Data
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'data-entry' ? (
          <DataEntry 
            onSave={handleSaveData} 
            onCancel={handleBackToDataEntry}
            initialData={assessmentData}
            operatorName={operatorName}
            setOperatorName={setOperatorName}
            processesList={processesList}
            candidateInfo={searchResults || candidateInfo}
            onClearData={handleClearData}
            searchCandidateId={searchCandidateId}
            setSearchCandidateId={setSearchCandidateId}
            onSearchCandidate={handleSearchCandidate}
            onClearSearch={handleClearSearch}
            isSearching={isSearching}
            searchResults={searchResults}
            isClient={isClient}
          />
        ) : (
          <AssessmentResults 
            onBackToDataEntry={handleBackToDataEntry}
            assessmentData={assessmentData}
            onUseAssessment={onAssessmentComplete ? handleUseAssessment : null}
            candidateInfo={searchResults || candidateInfo}
          />
        )}
      </div>
    </div>
  )
}

// Data Entry Component - UPDATED with hydration fix
function DataEntry({ 
  onSave, 
  onCancel, 
  initialData, 
  operatorName, 
  setOperatorName, 
  processesList, 
  candidateInfo, 
  onClearData,
  searchCandidateId,
  setSearchCandidateId,
  onSearchCandidate,
  onClearSearch,
  isSearching,
  searchResults,
  isClient
}) {
  // Supplementary machines list
  const supplementaryMachineOptions = [
    'Eyelet', 'FOA', 'Kansai', 'BH', 'BS', 'BTK', 'F/Sleamer'
  ]

  const [formData, setFormData] = useState({
    date: '',
    operatorName: operatorName || '',
    fatherHusbandName: '',
    educationalStatus: 'Eight Above',
    attitude: 'Good',
    sewingFloor: 'Sewing Floor',
    processes: [
      {
        machineType: 'SNLS/DNLS',
        processName: '',
        dop: '',
        smv: 0,
        cycleTimes: [0, 0, 0, 0, 0],
        qualityStatus: 'No Defect',
        remarks: ''
      }
    ],
    supplementaryMachines: supplementaryMachineOptions.map(name => ({
      name,
      checked: false
    }))
  })

  // Initialize form data only on client side
  useEffect(() => {
    if (isClient) {
      const today = new Date().toISOString().split('T')[0]
      
      if (candidateInfo) {
        setOperatorName(candidateInfo.name || '');
        
        const initialFormData = {
          date: today,
          operatorName: candidateInfo.name || '',
          candidateId: candidateInfo.candidateId || '',
          nid: candidateInfo.nid || '',
          birthCertificate: candidateInfo.birthCertificate || '',
          fatherHusbandName: '',
          educationalStatus: 'Eight Above',
          attitude: 'Good',
          sewingFloor: 'Sewing Floor',
          processes: [
            {
              machineType: 'SNLS/DNLS',
              processName: '',
              dop: '',
              smv: 0,
              cycleTimes: [0, 0, 0, 0, 0],
              qualityStatus: 'No Defect',
              remarks: ''
            }
          ],
          supplementaryMachines: supplementaryMachineOptions.map(name => ({
            name,
            checked: false
          }))
        };

        // API থেকে পাওয়া assessmentData থাকলে সেটা ব্যবহার করুন
        if (candidateInfo.assessmentData && candidateInfo.assessmentData.rawData) {
          const apiData = candidateInfo.assessmentData.rawData
          
          setFormData(prev => ({ 
            ...initialFormData,
            ...apiData,
            // processes array properly merge করুন
            processes: apiData.processes && apiData.processes.length > 0 
              ? apiData.processes.map(process => ({
                  ...process,
                  cycleTimes: process.cycleTimes || [0, 0, 0, 0, 0]
                }))
              : initialFormData.processes,
            supplementaryMachines: apiData.supplementaryMachines && apiData.supplementaryMachines.length > 0
              ? apiData.supplementaryMachines
              : initialFormData.supplementaryMachines
          }));
          
          // Operator name সেট করুন
          if (apiData.operatorName) {
            setOperatorName(apiData.operatorName)
          }
        } 
        // শুধু initialData থাকলে (manual entry এর জন্য)
        else if (initialData) {
          setFormData(prev => ({ 
            ...initialFormData, 
            ...initialData,
            processes: initialData.processes && initialData.processes.length > 0 
              ? initialData.processes 
              : initialFormData.processes,
            supplementaryMachines: initialData.supplementaryMachines && initialData.supplementaryMachines.length > 0
              ? initialData.supplementaryMachines
              : initialFormData.supplementaryMachines
          }));
        } else {
          setFormData(initialFormData);
        }
      } else {
        // No candidate info - set basic form data
        setFormData(prev => ({
          ...prev,
          date: today,
          supplementaryMachines: supplementaryMachineOptions.map(name => ({
            name,
            checked: false
          }))
        }))
        
        if (initialData) {
          setFormData(prev => ({ ...prev, ...initialData }));
        }
      }
    }
  }, [candidateInfo, initialData, isClient])

  // Process select করলে DOP এবং SMV auto-fill করা
  const handleProcessSelect = (index, selectedProcessName) => {
    const selectedProcess = processesList.find(process => process.name === selectedProcessName)
    
    if (selectedProcess) {
      const updatedProcesses = [...formData.processes]
      updatedProcesses[index] = {
        ...updatedProcesses[index],
        processName: selectedProcess.name,
        dop: selectedProcess.processStatus,
        smv: selectedProcess.smv
      }
      setFormData({ ...formData, processes: updatedProcesses })
    }
  }

  const updateProcess = (index, field, value) => {
    const updatedProcesses = [...formData.processes]
    if (field.startsWith('cycleTime')) {
      const cycleIndex = parseInt(field.split('-')[1])
      updatedProcesses[index].cycleTimes[cycleIndex] = parseFloat(value) || 0
    } else {
      updatedProcesses[index][field] = value
    }
    setFormData({ ...formData, processes: updatedProcesses })
  }

  const addProcess = () => {
    setFormData({
      ...formData,
      processes: [
        ...formData.processes,
        {
          machineType: '',
          processName: '',
          dop: '',
          smv: 0,
          cycleTimes: [0, 0, 0, 0, 0],
          qualityStatus: '',
          remarks: ''
        }
      ]
    })
  }

  const removeProcess = (index) => {
    const updatedProcesses = formData.processes.filter((_, i) => i !== index)
    setFormData({ ...formData, processes: updatedProcesses })
  }

  // Supplementary machine checkbox হ্যান্ডলার
  const handleSupplementaryMachineChange = (index, checked) => {
    const updatedSupplementaryMachines = [...formData.supplementaryMachines]
    updatedSupplementaryMachines[index].checked = checked
    setFormData({
      ...formData,
      supplementaryMachines: updatedSupplementaryMachines
    })
  }

  const handleOperatorNameChange = (e) => {
    const name = e.target.value
    setOperatorName(name)
    setFormData(prev => ({ ...prev, operatorName: name }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  // শুধুমাত্র isAssessment: true আছে এমন processes ফিল্টার করুন
  const assessmentProcesses = processesList.filter(process => process.isAssessment === true)
  const processOptions = assessmentProcesses.map((item) => ({
  value: item.name,
  label: item.name,
}));




  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      
      {/* Candidate Search Section */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Search Candidate</h3>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter Candidate ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchCandidateId}
                onChange={(e) => setSearchCandidateId(e.target.value)}
                placeholder="e.g., GMST-00000073"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={onSearchCandidate}
                disabled={isSearching}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
              {searchResults && (
                <button
                  type="button"
                  onClick={onClearSearch}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Search Results Display */}
        {searchResults && (
          <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">Candidate Found:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
              <div>
                <strong>Name:</strong> {searchResults.name}
              </div>
              <div>
                <strong>Candidate ID:</strong> {searchResults.candidateId}
              </div>
              <div>
                <strong>NID/BC:</strong> {searchResults.nid || searchResults.birthCertificate || 'N/A'}
              </div>
            </div>
            {searchResults.assessmentData && (
              <div className="mt-2 text-xs text-green-600">
                ✓ Previous assessment data loaded automatically
              </div>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Candidate Information Display */}
        {candidateInfo && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Candidate Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p><strong>Name:</strong> {candidateInfo.name || 'N/A'}</p>
                <p><strong>Candidate ID:</strong> {candidateInfo.candidateId || 'N/A'}</p>
              </div>
              <div>
                <p><strong>NID:</strong> {candidateInfo.nid || 'N/A'}</p>
                <p><strong>Birth Certificate:</strong> {candidateInfo.birthCertificate || 'N/A'}</p>
              </div>
              {candidateInfo.picture && (
                <div className="flex justify-center">
                  <img 
                    src={candidateInfo.picture} 
                    alt={candidateInfo.name || 'Candidate'}
                    className="w-16 h-16 object-cover rounded-md"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Operator Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sewing Floor</label>
            <input
              type="text"
              value={formData.sewingFloor}
              onChange={(e) => setFormData({ ...formData, sewingFloor: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Operator Name *</label>
            <input
              type="text"
              value={formData.operatorName}
              onChange={handleOperatorNameChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Auto-filled from candidate information
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Father/Husband Name</label>
            <input
              type="text"
              value={formData.fatherHusbandName}
              onChange={(e) => setFormData({ ...formData, fatherHusbandName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Educational Status</label>
            <select
              value={formData.educationalStatus}
              onChange={(e) => setFormData({ ...formData, educationalStatus: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Eight Above">Eight Above</option>
              <option value="Five Above">Five Above</option>
              <option value="Below Five">Below Five</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Attitude</label>
            <select
              value={formData.attitude}
              onChange={(e) => setFormData({ ...formData, attitude: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Good">Excellent</option>
              <option value="Normal">Good</option>
              <option value="Bad">Normal</option>
            </select>
          </div>
        </div>

        {/* Process Table */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Process Measurements</h3>
            <button
              type="button"
              onClick={addProcess}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Add Process
            </button>
          </div>

          <div className="">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 border">SL</th>
                  <th className="px-4 py-2 border">Machine Types</th>
                  <th className="px-4 py-2 border">Process Name</th>
                  <th className="px-4 py-2 border">DOP</th>
                  <th className="px-4 py-2 border">SMV</th>
                  {[1, 2, 3, 4, 5].map(num => (
                    <th key={num} className="px-4 py-2 border">{num}st Cycle Time</th>
                  ))}
                  <th className="px-4 py-2 border">Quality Status</th>
                  <th className="px-4 py-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {formData.processes.map((process, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border text-center">{index + 1}</td>
                    <td className="px-4 py-2 border">
                      <select
                        value={process.machineType}
                        onChange={(e) => updateProcess(index, 'machineType', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Select</option>
                        <option value="SNLS/DNLS">SNLS/DNLS</option>
                        <option value="Flat Lock">Flat Lock</option>
                        <option value="Over Lock">Over Lock</option>
                        <option value="Eyelet">Eyelet</option>
                        <option value="FOA">FOA</option>
                        <option value="Kansai">Kansai</option>
                        <option value="BH">BH</option>
                        <option value="BS">BS</option>
                        <option value="BTK">BTK</option>
                        <option value="F/Sleamer">F/Sleamer</option>
                      </select>
                    </td>
                    <td className="px-4 py-2 border min-w-[260px] z-10">
                      <Select
                        options={processOptions}
                        value={processOptions.find(
                          (opt) => opt.value === process.processName
                        )}
                        onChange={(selectedOption) =>
                          handleProcessSelect(index, selectedOption.value)
                        }
                        className="w-full"
                        classNamePrefix="select"
                        isSearchable
                      />
                    </td>
                    <td className="px-4 py-2 border">
                      <input
                        type="text"
                        value={process.dop}
                        readOnly
                        className="w-full px-2 py-1 border border-gray-300 rounded bg-gray-100"
                      />
                    </td>
                    <td className="px-4 py-2 border min-w-[80px]">
                      <input
                        type="number"
                        step="0.01"
                        value={process.smv}
                        readOnly
                        className="w-full px-2 py-1 border border-gray-300 rounded bg-gray-100"
                      />
                    </td>
                    {process.cycleTimes.map((time, cycleIndex) => (
                      <td key={cycleIndex} className="px-4 py-2 border">
                        <input
                          type="number"
                          step="0.1"
                          value={time}
                          onChange={(e) => updateProcess(index, `cycleTime-${cycleIndex}`, e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                    ))}
                    <td className="px-4 py-2 border">
                      <select
                        value={process.qualityStatus}
                        onChange={(e) => updateProcess(index, 'qualityStatus', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Select</option>
                        <option value="No Defect">No Defect</option>
                        <option value="1 Operation Defect">1 Operation Defect</option>
                        <option value="2 Operation Defect">2 Operation Defect</option>
                        <option value="3 Operation Defect">3 Operation Defect</option>
                        <option value="4 Operation Defect">4 Operation Defect</option>
                        <option value="5 Operation Defect">5 Operation Defect</option>
                      </select>
                    </td>
                    <td className="px-4 py-2 border text-center">
                      <button
                        type="button"
                        onClick={() => removeProcess(index)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Supplementary Machines Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">If he/she has been able to do any other machine</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {formData.supplementaryMachines.map((machine, index) => (
              <div key={index} className="flex items-center space-x-2 p-2 border border-gray-200 rounded">
                <input
                  type="checkbox"
                  id={`supplementary-${index}`}
                  checked={machine.checked}
                  onChange={(e) => handleSupplementaryMachineChange(index, e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor={`supplementary-${index}`} className="text-sm text-gray-700">
                  {machine.name}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end items-center pt-6 border-t border-gray-200">
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Calculate Results
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

// Assessment Results Component (একই থাকে)
function AssessmentResults({ onBackToDataEntry, assessmentData, onUseAssessment, candidateInfo }) {
  const [calculatedResults, setCalculatedResults] = useState(null)

  useEffect(() => {
    if (assessmentData) {
      const results = calculateResults(assessmentData)
      setCalculatedResults(results)
    }
  }, [assessmentData])

  if (!assessmentData || !calculatedResults) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assessment results...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Candidate Info Card */}
      {candidateInfo && (
        <div className="bg-blue-50 shadow-md rounded-lg p-6 mb-6 border border-blue-200">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">Candidate Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Name</label>
              <p className="text-gray-900 font-medium">{candidateInfo.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Candidate ID</label>
              <p className="text-gray-900">{candidateInfo.candidateId}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">NID/Birth Certificate</label>
              <p className="text-gray-900">{candidateInfo.nid || candidateInfo.birthCertificate || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Operator Info Card */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Operator Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Name</label>
            <p className="text-gray-900 font-medium">{assessmentData.operatorName}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Father/Husband</label>
            <p className="text-gray-900">{assessmentData.fatherHusbandName}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Education</label>
            <p className="text-gray-900">{assessmentData.educationalStatus}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Attitude</label>
            <p className="text-gray-900">{assessmentData.attitude}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Sewing Floor</label>
            <p className="text-gray-900">{assessmentData.sewingFloor}</p>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Process Results</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 border">SL</th>
                <th className="px-4 py-2 border">Machine Type</th>
                <th className="px-4 py-2 border">Process</th>
                <th className="px-4 py-2 border">Avg Cycle Time</th>
                <th className="px-4 py-2 border">Target</th>
                <th className="px-4 py-2 border">Capacity</th>
                <th className="px-4 py-2 border">Performance %</th>
                <th className="px-4 py-2 border">Practical Marks</th>
                <th className="px-4 py-2 border">Quality Status</th>
              </tr>
            </thead>
            <tbody>
              {calculatedResults.processes.map((process, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border text-center">{index + 1}</td>
                  <td className="px-4 py-2 border">{process.machineType}</td>
                  <td className="px-4 py-2 border">{process.processName}</td>
                  <td className="px-4 py-2 border text-center">{process.avgCycleTime.toFixed(2)}s</td>
                  <td className="px-4 py-2 border text-center">{process.target.toFixed(2)}</td>
                  <td className="px-4 py-2 border text-center">{process.capacity.toFixed(2)}</td>
                  <td className="px-4 py-2 border text-center">{process.performance.toFixed(1)}%</td>
                  <td className="px-4 py-2 border text-center">{process.practicalMarks}</td>
                  <td className="px-4 py-2 border text-center">{process.qualityStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supplementary Machines Display */}
      {assessmentData.supplementaryMachines && assessmentData.supplementaryMachines.some(machine => machine.checked) && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Others Machine Specialist</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {assessmentData.supplementaryMachines
              .filter(machine => machine.checked)
              .map((machine, index) => (
                <div key={index} className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-blue-800">{machine.name}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Final Assessment */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Final Assessment</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{calculatedResults.scores.machineScore.toFixed(1)}</div>
            <div className="text-sm text-gray-600">Machine Score</div>
            <div className="text-xs text-gray-500">/30</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{calculatedResults.scores.dopScore.toFixed(1)}</div>
            <div className="text-sm text-gray-600">DOP Score</div>
            <div className="text-xs text-gray-500">/20</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{calculatedResults.scores.practicalScore.toFixed(1)}</div>
            <div className="text-sm text-gray-600">Practical Score</div>
            <div className="text-xs text-gray-500">/30</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{calculatedResults.scores.averageQualityScore.toFixed(1)}</div>
            <div className="text-sm text-gray-600">Quality Score</div>
            <div className="text-xs text-gray-500">/10</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{calculatedResults.scores.educationScore}</div>
            <div className="text-sm text-gray-600">Education Score</div>
            <div className="text-xs text-gray-500">/5</div>
          </div>
          <div className="text-center p-4 bg-pink-50 rounded-lg">
            <div className="text-2xl font-bold text-pink-600">{calculatedResults.scores.attitudeScore}</div>
            <div className="text-sm text-gray-600">Attitude Score</div>
            <div className="text-xs text-gray-500">/5</div>
          </div>
          <div className="text-center p-4 bg-indigo-50 rounded-lg">
            <div className="text-2xl font-bold text-indigo-600">{calculatedResults.scores.totalScore.toFixed(1)}</div>
            <div className="text-sm text-gray-600">Total Score</div>
            <div className="text-xs text-gray-500">/100</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{calculatedResults.finalAssessment.grade}</div>
            <div className="text-sm text-gray-600">Grade</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-lg font-semibold text-gray-900">{calculatedResults.finalAssessment.level}</div>
            <div className="text-sm text-gray-600">Performance Level</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-lg font-semibold text-gray-900">{calculatedResults.finalAssessment.designation}</div>
            <div className="text-sm text-gray-600">Proposed Designation</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 mt-6">
        <button
          onClick={onBackToDataEntry}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Back to Data Entry
        </button>
        
        {onUseAssessment && (
          <button
            onClick={onUseAssessment}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Use This Assessment in Interview
          </button>
        )}
      </div>
    </div>
  )
}





































// Helper function for calculations (একই থাকে)



function calculateResults(data) {
  
  const processesWithCalculations = data.processes.map(process => {
    const processName = process.processName;
    const machine = process.machineType;

    const validCycleTimes = process.cycleTimes.filter(time => time > 0);
    const avgCycleTime = validCycleTimes.length > 0
        ? validCycleTimes.reduce((a, b) => a + b, 0) / validCycleTimes.length
        : 0;

    const target = 60 / process.smv;
    const capacity = 3600 / avgCycleTime;
    const performance = (capacity / target) * 100;

    let practicalMarks = 0;

    // SNLS special conditions list
    const fourProcessAndMachine = [
        { name: "Pocket-join-(Kangaro)", minCapacity: 90, machine: "SNLS/DNLS" },
        { name: "Placket-box", minCapacity: 90, machine: "SNLS/DNLS" },
        { name: "Zipper-join(2nd)", minCapacity: 60, machine: "SNLS/DNLS" },
        { name: "Back-neck-tape-top-stitch-insert-label", minCapacity: 120, machine: "SNLS/DNLS" }
    ];

    // -------------------------------
    //     SNLS/DNLS CUSTOM LOGIC
    // -------------------------------
    if (machine === "SNLS/DNLS") {
        const snlsProcesses = data.processes.filter(p => p.machineType === "SNLS/DNLS");
        let passedCount = 0;

        fourProcessAndMachine.forEach(fp => {
            const match = snlsProcesses.find(p => p.processName === fp.name);
            if (match) {
                const validCT = match.cycleTimes.filter(t => t > 0);
                const avgCT = validCT.reduce((a, b) => a + b, 0) / validCT.length;
                const cap = 3600 / avgCT;

                if (cap >= fp.minCapacity) passedCount++;
            }
        });

        if (passedCount === 4) practicalMarks = 100;
        else if (passedCount === 3) practicalMarks = 80;
        else if (passedCount === 2) practicalMarks = 60;
        else if (passedCount === 1) practicalMarks = 50;
        else practicalMarks = 30;
    }

    // -------------------------------
    //     NEW: OverLock CONDITION
    // -------------------------------
    else if (machine === "Over Lock") {

        // CASE 1: process === "Neck-join"
        if (processName.toLowerCase() === "neck-join" || processName.toLowerCase() === "neck join") {

            if (capacity > 150) practicalMarks = 100;
            else if (capacity >= 120) practicalMarks = 80;
            else if (capacity >= 100) practicalMarks = 60;
            else if (capacity >= 80) practicalMarks = 50;
            else practicalMarks = 0;
        }

        // CASE 2: Other Process (except Neck-join)
        else {
            if (capacity > 80) practicalMarks = 90;
            else if (capacity >= 70) practicalMarks = 60;
            else if (capacity >= 60) practicalMarks = 50;
            else practicalMarks = 0;
        }
    }

    // -------------------------------
    //     NEW: Flat Lock CONDITION
    // -------------------------------
    else if (machine === "Flat Lock") {

        // CASE 3: Bottom-hem Process
        if (processName.toLowerCase() === "bottom-hem" || processName.toLowerCase() === "bottom-hem") {

            if (capacity > 220) practicalMarks = 100;
            else if (capacity >= 200) practicalMarks = 80;
            else if (capacity >= 180) practicalMarks = 60;
            else if (capacity >= 160) practicalMarks = 50;
            else practicalMarks = 0;
        }

        // CASE 4: Other Process (except Bottom-hem)
        else {
            if (capacity > 120) practicalMarks = 80;
            else if (capacity >= 100) practicalMarks = 60;
            else if (capacity >= 90) practicalMarks = 50;
            else practicalMarks = 0;
        }
    }

    // -------------------------------
    //     DEFAULT PERFORMANCE SYSTEM
    // (Only used when above rules do NOT match)
    // -------------------------------
    else {
        if (performance > 90) practicalMarks = 85;
        else if (performance >= 80) practicalMarks = 80;
        else if (performance >= 70) practicalMarks = 70;
        else if (performance >= 60) practicalMarks = 60;
        else if (performance >= 50) practicalMarks = 50;
        else practicalMarks = 0;
    }

    return {
        ...process,
        avgCycleTime,
        target,
        capacity,
        performance,
        practicalMarks
    };
});


const processCapacitySingleNiddle = [
    { name: "Pocket-join-(Kangaro)", minCapacity: 90, machine: "SNLS/DNLS" },
    { name: "Placket-box", minCapacity: 90, machine: "SNLS/DNLS" },
    { name: "Zipper-join(2nd)", minCapacity: 60, machine: "SNLS/DNLS" },
    { name: "Back-neck-tape-top-stitch-insert-label", minCapacity: 120, machine: "SNLS/DNLS" }
];

const processCapacityOverLock = [
    { name: "Neck-join", minCapacity: 150, machine: "Over Lock" }
];

const processCapacityFlatLock = [
    { name: "Bottom-hem", minCapacity: 220, machine: "Flat Lock" }
];


// ======================================================
// SCORE CALCULATION
// ======================================================

const calculateMachineScore = (processes) => {
    const specialMachines = ["SNLS/DNLS", "Over Lock", "Flat Lock"];
    const semiSpecialMachines = ["F/Sleamer", "Kansai", "FOA"];

    const machinesUsed = [...new Set(processes.map(p => p.machineType))];

    // ======================================================
    // 1️⃣ CHECK CAPACITY PASSED OR NOT
    // ======================================================

    const checkPass = (requiredList) => {
        return requiredList.every(req => {
            const found = processes.find(p => p.name === req.name);
            return found && found.capacity >= req.minCapacity;
        });
    };

    const passedSingleNeedle = checkPass(processCapacitySingleNiddle);
    const passedOverLock     = checkPass(processCapacityOverLock);
    const passedFlatLock     = checkPass(processCapacityFlatLock);

    const passedAllThree = passedSingleNeedle && passedOverLock && passedFlatLock;

    if (passedAllThree) {
        return 100;
    }

    // ======================================================
    // 2️⃣ ONLY SPECIAL MACHINES USED (FAIL CAPACITY)
    // ======================================================
    const onlySpecial = machinesUsed.every(m => specialMachines.includes(m));

    if (onlySpecial && machinesUsed.length === 3) {
        return 80;
    }

    // ======================================================
    // 3️⃣ OLD SCORING CALCULATION (FALLBACK)
    // ======================================================

    // Special machine score
    const specialCount = machinesUsed.filter(m => specialMachines.includes(m)).length;

    let specialScore = 0;
    if (specialCount === 1) specialScore = 55;
    else if (specialCount === 2) specialScore = 80;
    else if (specialCount === 3) specialScore = 100;

    let totalScore = specialScore;

    // Semi-Special
    if (totalScore < 100) {
        const semiCount = machinesUsed.filter(m => semiSpecialMachines.includes(m)).length;
        totalScore += semiCount * 20;
    }

    // Other machines
    if (totalScore < 100) {
        const otherMachines = machinesUsed.filter(
            m => !specialMachines.includes(m) && !semiSpecialMachines.includes(m)
        );

        totalScore += otherMachines.length * 10;
    }

    return Math.min(totalScore, 100);
};


  const machineScore = calculateMachineScore(data.processes);
  const finalMachineScore = machineScore * 0.3;

  // DOP Score Calculation
  const dopScores = processesWithCalculations.map(process => {
    const dopPoints = {
      'Basic': 30,
      'Semi Critical': 50,
      'Critical': 100
    }
    return dopPoints[process.dop] || 0
  })

  const dopScoreCalculate = dopScores.length > 0 ? 
    Math.min(dopScores.reduce((sum, score) => sum + score, 0) / dopScores.length) : 0
  const dopScore = dopScoreCalculate * 0.20

  // Practical Score Calculation
  const totalPractical = processesWithCalculations.reduce(
    (sum, process) => sum + process.practicalMarks,
    0
  )
  const practicalCount = processesWithCalculations.length
  const practicalScore = practicalCount > 0 ? 
    (totalPractical / practicalCount) * 0.30 : 0

  // Quality Score Calculation
  const qualityScoreData = processesWithCalculations.reduce((acc, process) => {
    const qualityPoints = {
      'No Defect': 100,
      '1 Operation Defect': 80,
      '2 Operation Defect': 60,
      '3 Operation Defect': 40,
      '4 Operation Defect': 20,
      '5 Operation Defect': 0,
    }
    
    acc.totalScore += qualityPoints[process.qualityStatus] || 0
    acc.count += 1
    return acc
  }, { totalScore: 0, count: 0 })

  const averageQualityScoreCalculate = qualityScoreData.count > 0 ? 
    qualityScoreData.totalScore / qualityScoreData.count : 0
  const averageQualityScore = averageQualityScoreCalculate * 0.1

  // Education Score Calculation
  const educationScoreMap = {
    'Eight Above': 100,
    'Five Above': 50,
    'Below Five': 30
  }
  const educationScoreCalculate = educationScoreMap[data.educationalStatus] || 0
  const educationScore = educationScoreCalculate * 0.05

  // Attitude Score Calculation
  const attitudeScoreMap = {
    'Good': 100,
    'Normal': 50,
    'Bad': 30
  }
  const attitudeScoreCalculate = attitudeScoreMap[data.attitude] || 0
  const attitudeScore = attitudeScoreCalculate * 0.05

  // Total Score Calculation
  const totalScore = finalMachineScore + dopScore + practicalScore + averageQualityScore + educationScore + attitudeScore

  // Special process grade adjustment logic
  const applySpecialProcessRules = (processes, calculatedGrade, calculatedLevel, calculatedDesignation) => {
    let finalGrade = calculatedGrade;
    let finalLevel = calculatedLevel;
    let finalDesignation = calculatedDesignation;

    const fourProcess = [
        { name: "Pocket-join-(Kangaro)", minCapacity: 90, machine: "SNLS/DNLS" },
        { name: "Placket-box", minCapacity: 90, machine: "SNLS/DNLS" },
        { name: "Zipper-join(2nd)", minCapacity: 60, machine: "SNLS/DNLS" },
        { name: "Back-neck-tape-top-stitch-insert-label", minCapacity: 120, machine: "SNLS/DNLS" }
    ];

    const hasFourProcess = fourProcess.every(req => {
      const foundProcess = processes.find(p => {
        const processNameMatch = p.processName.toLowerCase().includes(req.name.toLowerCase().split(' ')[0]);
        const capacityMatch = Math.round(p.capacity) >= req.minCapacity;
        const machineMatch = p.machineType === "SNLS" || p.machineType === "DNLS" || p.machineType === "SNLS/DNLS";
        
        return processNameMatch && capacityMatch && machineMatch;
      });
      
      return !!foundProcess;
    });

    const hasMachineProcess = (machine, processName, minCapacity = 0) => {
      return processes.some(p => {
        const machineMatch = p.machineType === machine || 
                           (machine === "SNLS/DNLS" && (p.machineType === "SNLS" || p.machineType === "DNLS"));
        const processMatch = p.processName.toLowerCase().includes(processName.toLowerCase());
        const capacityMatch = Math.round(p.capacity) >= minCapacity;
        return machineMatch && processMatch && capacityMatch;
      });
    };

    const hasNeckJoinOverLock = hasMachineProcess("Over Lock", "Neck-join", 150);
    const hasBodyHemFlatLock = hasMachineProcess("Flat Lock", "Bottom-hem", 220);

    if (hasFourProcess && hasNeckJoinOverLock && hasBodyHemFlatLock) {
        finalLevel = 'Multiskill';
        finalGrade = 'A++';
        finalDesignation = 'Jr.Operator';
        console.log("Multiskill Achieved");
    } 
    else if (hasNeckJoinOverLock && hasBodyHemFlatLock) {
        finalGrade = 'A++';
        finalLevel = 'Excellent';
        finalDesignation = 'Jr.Operator';
        console.log("Both Over Lock and Flat Lock conditions met");
    } 
    else if (hasFourProcess && hasBodyHemFlatLock) {
        finalGrade = 'A++';
        finalLevel = 'Excellent';
        finalDesignation = 'Jr.Operator';
        console.log("Both Four Process and Flat Lock conditions met");
    } 
    else if (hasFourProcess && hasNeckJoinOverLock) {
        finalGrade = 'A++';
        finalLevel = 'Excellent';
        finalDesignation = 'Jr.Operator';
        console.log("Both Four Process and Over Lock conditions met");
    } else if (hasFourProcess) {
        finalGrade = 'A+';
        finalLevel = 'Very Good';
        finalDesignation = 'Jr.Operator';
        console.log("Only Four Process condition met");
    }

    // Capacity-based rules
    processes.forEach(process => {
        const capacity = Math.round(process.capacity);

        if (process.processName === "Neck-join" && process.smv === 0.35 && finalGrade !== 'A++') {
            if (capacity >= 150 && finalGrade !== 'A+') {
                finalGrade = 'A+';
                if (finalLevel !== 'Multiskill') finalLevel = 'Very Good';
                finalDesignation = 'Jr.Operator';
            } else if (capacity >= 120 && capacity <= 149 && !['A++', 'A+'].includes(finalGrade)) {
                finalGrade = 'A';
                if (finalLevel !== 'Multiskill') finalLevel = 'Good';
                finalDesignation = 'Jr.Operator';
            } else if (capacity >= 100 && capacity <= 119 && !['A++', 'A+', 'A'].includes(finalGrade)) {
                finalGrade = 'B+';
                if (finalLevel !== 'Multiskill') finalLevel = 'Medium';
                finalDesignation = 'Jr.Operator';
            }
        }
        
        else if (process.processName === "Bottom-hem" && process.smv === 0.23 && finalGrade !== 'A++') {
            if (capacity >= 220 && finalGrade !== 'A+') {
                finalGrade = 'A+';
                if (finalLevel !== 'Multiskill') finalLevel = 'Very Good';
                finalDesignation = 'Jr.Operator';
            } else if (capacity >= 200 && capacity <= 219 && !['A++', 'A+'].includes(finalGrade)) {
                finalGrade = 'A';
                if (finalLevel !== 'Multiskill') finalLevel = 'Good';
                finalDesignation = 'Jr.Operator';
            } else if (capacity >= 180 && capacity <= 199 && !['A++', 'A+', 'A'].includes(finalGrade)) {
                finalGrade = 'B+';
                if (finalLevel !== 'Multiskill') finalLevel = 'Medium';
                finalDesignation = 'Jr.Operator';
            }
        }
    });

    return { finalGrade, finalLevel, finalDesignation };
  };

  // Calculate initial grade
  let grade, level, designation;
  
  if (averageQualityScore < 5) {
    grade = 'Unskill'; 
    level = 'Unskill'; 
    designation = 'Asst.Operator';
  } else {
    // Initial assessment based on total score
    if (totalScore >= 90) {
      grade = 'A++'; level = 'Excellent'; designation = 'Jr.Operator';
    } else if (totalScore >= 80) {
      grade = 'A+'; level = 'Better'; designation = 'Jr.Operator';
    } else if (totalScore >= 75) {
      grade = 'A'; level = 'Good'; designation = 'Jr.Operator';
    } else if (totalScore >= 65) {
      grade = 'B+'; level = 'Medium'; designation = 'Jr.Operator';
    } else if (totalScore >= 50) {
      grade = 'B'; level = 'Average'; designation = 'Gen.Operator';
    } else {
      grade = 'Unskill'; level = 'Unskill'; designation = 'Asst.Operator';
    }

    // Apply special process rules if operator got lower grade
    const adjustedAssessment = applySpecialProcessRules(
      processesWithCalculations, 
      grade, 
      level, 
      designation
    );
    
    grade = adjustedAssessment.finalGrade;
    level = adjustedAssessment.finalLevel;
    designation = adjustedAssessment.finalDesignation;
  }

  return {
    processes: processesWithCalculations,
    scores: {
      machineScore: finalMachineScore,
      dopScore,
      practicalScore,
      averageQualityScore,
      educationScore,
      attitudeScore,
      totalScore
    },
    finalAssessment: {
      grade,
      level,
      designation
    }
  }
}