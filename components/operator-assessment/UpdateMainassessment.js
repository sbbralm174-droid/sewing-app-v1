// components/operator-assessment/Mainassessment.js
'use client'
import { useState, useEffect } from 'react'

export default function MainAssessment({ onAssessmentComplete, candidateInfo, existingAssessmentData }) {
  const [currentView, setCurrentView] = useState('data-entry')
  const [assessmentData, setAssessmentData] = useState(null)
  const [operatorName, setOperatorName] = useState('')
  const [processesList, setProcessesList] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [isLoadingPreviousData, setIsLoadingPreviousData] = useState(false)

  // localStorage থেকে candidate info লোড করুন এবং পূর্বের ডেটা লোড করুন
  useEffect(() => {
    // localStorage থেকে candidate info লোড করুন
    const savedCandidateInfo = localStorage.getItem('selectedCandidateForAssessment')
    
    if (savedCandidateInfo && !candidateInfo) {
      try {
        const parsedCandidateInfo = JSON.parse(savedCandidateInfo)
        console.log('📥 Candidate info loaded from localStorage:', parsedCandidateInfo)
        
        // candidateInfo prop না থাকলে localStorage থেকে ব্যবহার করুন
        if (!candidateInfo) {
          initializeWithCandidateInfo(parsedCandidateInfo)
          // API call করে পূর্বের assessment data লোড করুন
          loadPreviousAssessmentData(parsedCandidateInfo.candidateId)
        }
      } catch (error) {
        console.error('Error parsing saved candidate info:', error)
      }
    }

    // Existing assessment data থাকলে লোড করুন
    if (existingAssessmentData) {
      console.log('📥 Loading existing assessment data:', existingAssessmentData);
      
      if (existingAssessmentData.rawData) {
        setAssessmentData(existingAssessmentData.rawData);
        setOperatorName(existingAssessmentData.rawData.operatorName || '');
        setIsEditing(true);
        setCurrentView('results');
      }
    } else if (candidateInfo) {
      initializeNewData();
      // Candidate info থাকলে পূর্বের ডেটা লোড করুন
      if (candidateInfo.candidateId) {
        loadPreviousAssessmentData(candidateInfo.candidateId)
      }
    }
  }, [existingAssessmentData, candidateInfo])

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

  // Candidate info দিয়ে ডেটা ইনিশিয়ালাইজ করার ফাংশন
  const initializeWithCandidateInfo = (candidateInfo) => {
    const initialData = {
      operatorName: candidateInfo.name || '',
      candidateId: candidateInfo.candidateId || '',
      nid: candidateInfo.nid || '',
      birthCertificate: candidateInfo.birthCertificate || '',
      date: new Date().toISOString().split('T')[0],
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

  // নতুন ডেটা ইনিশিয়ালাইজ করার ফাংশন
  const initializeNewData = () => {
    if (candidateInfo) {
      const initialData = {
        operatorName: candidateInfo.name || '',
        candidateId: candidateInfo.candidateId || '',
        nid: candidateInfo.nid || '',
        birthCertificate: candidateInfo.birthCertificate || '',
        date: new Date().toISOString().split('T')[0],
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

  // 🔥 API call দিয়ে পূর্বের assessment data লোড করার ফাংশন
  const loadPreviousAssessmentData = async (candidateId) => {
    if (!candidateId) return
    
    setIsLoadingPreviousData(true)
    try {
      const response = await fetch(`/api/iep-interview/update-iep-interview-ass-calculator/candidate-iep-data?candidateId=${candidateId}`)
      const result = await response.json()

      if (response.ok && result.data && result.data.processMeasurements.length > 0) {
        const previousData = result.data
        
        console.log('📊 Previous assessment data loaded from API:', previousData)

        // Process measurements সেট করুন
        const updatedProcesses = previousData.processMeasurements.map(process => ({
          machineType: process.machineType || '',
          processName: process.processName || '',
          dop: process.dop || '',
          smv: process.smv || 0,
          cycleTimes: process.cycleTimes || [0, 0, 0, 0, 0],
          qualityStatus: process.qualityStatus || 'No Defect',
          remarks: process.remarks || ''
        }))

        // Supplementary machines সেট করুন
        const supplementaryMachineOptions = [
          'Eyelet', 'FOA', 'Kansai', 'BH', 'BS', 'BTK', 'F/Sleamer'
        ]
        
        const updatedSupplementaryMachines = supplementaryMachineOptions.map(name => ({
          name,
          checked: previousData.supplementaryMachines?.[name] || false
        }))

        // Form data update করুন
        setAssessmentData(prev => ({
          ...prev,
          processes: updatedProcesses.length > 0 ? updatedProcesses : prev.processes,
          supplementaryMachines: updatedSupplementaryMachines
        }))

        console.log('✅ Auto-filled with previous process measurements')
      } else {
        console.log('ℹ️ No previous assessment data found for this candidate')
      }
    } catch (error) {
      console.error('❌ Error loading previous assessment data:', error)
    } finally {
      setIsLoadingPreviousData(false)
    }
  }

  // localStorage থেকে ডেটা লোড করা (candidateInfo না থাকলে)
  useEffect(() => {
    if (!candidateInfo && !existingAssessmentData) {
      const savedData = localStorage.getItem('assessmentData')
      if (savedData) {
        try {
          const data = JSON.parse(savedData)
          setAssessmentData(data)
          setOperatorName(data.operatorName || '')
        } catch (error) {
          console.error('Error parsing saved data:', error);
        }
      }
    }
  }, [candidateInfo, existingAssessmentData])

  // ডেটা সেভ করার ফাংশন
  const handleSaveData = (data) => {
    const completeData = {
      ...data,
      operatorName: operatorName || data.operatorName,
      candidateId: candidateInfo?.candidateId || data.candidateId,
      nid: candidateInfo?.nid || data.nid,
      birthCertificate: candidateInfo?.birthCertificate || data.birthCertificate,
      lastSaved: new Date().toISOString()
    }
    
    // localStorage এ সেভ করুন
    localStorage.setItem('assessmentData', JSON.stringify(completeData))
    setAssessmentData(completeData)
    setCurrentView('results')
    
    console.log('Data saved:', completeData)
  }

  // ডেটা এন্ট্রিতে ফিরে যাওয়ার ফাংশন
  const handleBackToDataEntry = () => {
    setCurrentView('data-entry')
  }

  // ডেটা এডিট করার ফাংশন
  const handleEditData = () => {
    setCurrentView('data-entry')
  }

  // localStorage থেকে ডেটা ক্লিয়ার করার ফাংশন
  const handleClearData = () => {
    localStorage.removeItem('assessmentData')
    setAssessmentData(null)
    setOperatorName('')
    setIsEditing(false)
    if (candidateInfo) {
      initializeNewData()
    }
  }

  // Assessment সম্পূর্ণ হলে parent component কে ডেটা পাঠানো
  const handleUseAssessment = () => {
    if (assessmentData) {
      const calculatedResults = calculateResults(assessmentData)
      
      // Process capacity calculation
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
      
      // Supplementary machines যোগ করা
      const supplementaryMachinesData = {}
      if (assessmentData.supplementaryMachines) {
        assessmentData.supplementaryMachines.forEach(machine => {
          if (machine.checked) {
            supplementaryMachinesData[machine.name] = true
          }
        })
      }
      
      // Candidate information সহ assessment result তৈরি করুন
      const assessmentResult = {
        candidateInfo: candidateInfo ? {
          name: candidateInfo.name,
          candidateId: candidateInfo.candidateId,
          nid: candidateInfo.nid,
          birthCertificate: candidateInfo.birthCertificate,
          picture: candidateInfo.picture
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

      console.log('Assessment Result:', assessmentResult)
      
      if (onAssessmentComplete) {
        onAssessmentComplete(assessmentResult)
      }
    }
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
                  title="Clear all saved data"
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
            candidateInfo={candidateInfo}
            onClearData={handleClearData}
            isEditing={isEditing}
            isLoadingPreviousData={isLoadingPreviousData}
            onLoadPreviousData={loadPreviousAssessmentData}
          />
        ) : (
          <AssessmentResults 
            onBackToDataEntry={handleBackToDataEntry}
            assessmentData={assessmentData}
            onUseAssessment={onAssessmentComplete ? handleUseAssessment : null}
            candidateInfo={candidateInfo}
            onEditData={handleEditData}
          />
        )}
      </div>
    </div>
  )
}

// Data Entry Component
function DataEntry({ onSave, onCancel, initialData, operatorName, setOperatorName, processesList, candidateInfo, onClearData, isEditing = false, isLoadingPreviousData, onLoadPreviousData }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
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
    supplementaryMachines: []
  })

  const supplementaryMachineOptions = [
    'Eyelet', 'FOA', 'Kansai', 'BH', 'BS', 'BTK', 'F/Sleamer'
  ]

  // candidateInfo থেকে initial values সেট করুন
  useEffect(() => {
    if (candidateInfo) {
      setOperatorName(candidateInfo.name || '');
      
      const initialFormData = {
        date: new Date().toISOString().split('T')[0],
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

      // যদি আগের saved data থাকে, সেটা ব্যবহার করুন
      if (initialData) {
        console.log('Loading initial data from localStorage:', initialData);
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
      // Initialize supplementary machines
      setFormData(prev => ({
        ...prev,
        supplementaryMachines: supplementaryMachineOptions.map(name => ({
          name,
          checked: false
        }))
      }))
      
      // candidateInfo না থাকলে localStorage থেকে ডেটা লোড করুন
      if (initialData) {
        console.log('Loading initial data without candidateInfo:', initialData);
        setFormData(prev => ({ ...prev, ...initialData }));
      }
    }
  }, [candidateInfo, initialData])

  // Auto-fill বাটন যোগ করুন
  const handleAutoFillFromPrevious = async () => {
    if (candidateInfo?.candidateId) {
      await onLoadPreviousData(candidateInfo.candidateId)
    }
  }

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
    console.log('Submitting form data:', formData);
    onSave(formData)
  }

  // শুধুমাত্র isAssessment: true আছে এমন processes ফিল্টার করুন
  const assessmentProcesses = processesList.filter(process => process.isAssessment === true)

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
      {/* Header with Edit Mode Indicator */}
      <div className="mb-6 pb-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">
            Operator Skill Assessment
            {isEditing && (
              <span className="ml-3 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                Editing Existing Assessment
              </span>
            )}
            {isLoadingPreviousData && (
              <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                Loading Previous Data...
              </span>
            )}
          </h2>
          {isEditing && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Back to Results
            </button>
          )}
        </div>
        {isEditing && (
          <p className="text-sm text-yellow-600 mt-2">
            You are editing an existing assessment. Changes will be saved when you click Update Results.
          </p>
        )}
      </div>

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
          
          {/* Auto-fill Button in Candidate Info Section */}
          <div className="mt-3 pt-3 border-t border-blue-200">
            <button
              type="button"
              onClick={handleAutoFillFromPrevious}
              disabled={isLoadingPreviousData}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>
                {isLoadingPreviousData ? 'Loading...' : 'Auto-fill from Previous Interview'}
              </span>
            </button>
            <p className="text-xs text-gray-600 mt-1">
              Automatically fill process measurements from candidates previous assessment
            </p>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Fathers/Husbands Name</label>
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
          <div className="flex space-x-2">
            {candidateInfo && (
              <button
                type="button"
                onClick={handleAutoFillFromPrevious}
                disabled={isLoadingPreviousData}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm flex items-center space-x-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Auto-fill</span>
              </button>
            )}
            <button
              type="button"
              onClick={addProcess}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              Add Process
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
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
                  <td className="px-4 py-2 border">
                    <select
                      value={process.processName}
                      onChange={(e) => handleProcessSelect(index, e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select Process</option>
                      {assessmentProcesses.map((processItem) => (
                        <option key={processItem._id} value={processItem.name}>
                          {processItem.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2 border">
                    <input
                      type="text"
                      value={process.dop}
                      readOnly
                      className="w-full px-2 py-1 border border-gray-300 rounded bg-gray-100"
                    />
                  </td>
                  <td className="px-4 py-2 border">
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
            {isEditing ? 'Cancel' : 'Back'}
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {isEditing ? 'Update Results' : 'Calculate Results'}
          </button>
        </div>
      </div>
    </form>
  )
}

// Assessment Results Component (একই থাকে)
function AssessmentResults({ onBackToDataEntry, assessmentData, onUseAssessment, candidateInfo, onEditData }) {
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
            <div className="text-xs text-gray-500">/30</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{calculatedResults.scores.practicalScore.toFixed(1)}</div>
            <div className="text-sm text-gray-600">Practical Score</div>
            <div className="text-xs text-gray-500">/20</div>
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
      <div className="flex justify-between space-x-4 mt-6">
        <div className="flex space-x-4">
          <button
            onClick={onBackToDataEntry}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back to Data Entry
          </button>
          
          {/* Edit Button */}
          <button
            onClick={onEditData}
            className="px-6 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
          >
            Edit Assessment Data
          </button>
        </div>
        
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

// Helper function for calculations with MULTISKILL logic (একই থাকে)
function calculateResults(data) {
  const processesWithCalculations = data.processes.map(process => {
    const avgCycleTime = process.cycleTimes.reduce((a, b) => a + b, 0) / process.cycleTimes.length
    const target = 60 / process.smv
    const capacity = 3600 / avgCycleTime
    const performance = (capacity / target) * 100

    let practicalMarks = 0
    if (performance > 90) practicalMarks = 100
    else if (performance >= 80) practicalMarks = 80
    else if (performance >= 70) practicalMarks = 70
    else if (performance >= 60) practicalMarks = 60
    else if (performance >= 50) practicalMarks = 50

    return {
      ...process,
      avgCycleTime,
      target,
      capacity,
      performance,
      practicalMarks
    }
  })

  // Machine Score Calculation with MULTISKILL logic
  const calculateMachineScore = (processes) => {
    const specialMachines = ["SNLS/DNLS", "Over Lock", "Flat Lock"];
    const semiSpecialMachines = ["F/Sleamer", "Kansai", "FOA"];

    const machinesUsed = [...new Set(processes.map(p => p.machineType))];

    // MULTISKILL CHECK
    const hasAllThreeSpecial = specialMachines.every(machine => 
      machinesUsed.includes(machine)
    );

    if (hasAllThreeSpecial) {
      return 100;
    }

    // Special Machine Score
    const specialCount = machinesUsed.filter(m => specialMachines.includes(m)).length;

    let specialScore = 0;
    if (specialCount === 1) specialScore = 40;
    else if (specialCount === 2) specialScore = 70;
    else if (specialCount === 3) specialScore = 100;

    let totalScore = specialScore;

    // Semi-Special Score
    if (totalScore < 100) {
      const semiCount = machinesUsed.filter(m => semiSpecialMachines.includes(m)).length;
      totalScore += semiCount * 20;
    }

    // Other Machines Score
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
  const dopScore = dopScoreCalculate * 0.3

  // Practical Score Calculation
  const totalPractical = processesWithCalculations.reduce(
    (sum, process) => sum + process.practicalMarks,
    0
  )
  const practicalCount = processesWithCalculations.length
  const practicalScore = practicalCount > 0 ? 
    (totalPractical / practicalCount) * 0.2 : 0

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

  // Special process grade adjustment logic with MULTISKILL
  const applySpecialProcessRules = (processes, calculatedGrade, calculatedLevel, calculatedDesignation) => {
    let finalGrade = calculatedGrade;
    let finalLevel = calculatedLevel;
    let finalDesignation = calculatedDesignation;

    // MULTISKILL LEVEL CHECK
    const specialMachines = ["SNLS/DNLS", "Over Lock", "Flat Lock"];
    const machinesUsed = [...new Set(processes.map(p => p.machineType))];
    const hasAllThreeSpecial = specialMachines.every(machine => 
      machinesUsed.includes(machine)
    );

    if (hasAllThreeSpecial) {
      finalLevel = 'Multiskill';
      if (calculatedGrade === 'A++' || calculatedGrade === 'A+') {
        finalDesignation = 'Jr.Operator';
      }
    }

    processes.forEach(process => {
      const capacity = Math.round(process.capacity);
      
      // Neck join process rules
      if (process.processName === "Neck join" && process.smv === 0.35) {
        if (capacity >= 150 && calculatedGrade !== 'A++') {
          finalGrade = 'A+';
          if (finalLevel !== 'Multiskill') finalLevel = 'Very Good';
          finalDesignation = 'Jr.Operator';
        } else if (capacity >= 120 && capacity <= 149 && !['A++', 'A+'].includes(calculatedGrade)) {
          finalGrade = 'A';
          if (finalLevel !== 'Multiskill') finalLevel = 'Good';
          finalDesignation = 'Jr.Operator';
        } else if (capacity >= 100 && capacity <= 119 && !['A++', 'A+', 'A'].includes(calculatedGrade)) {
          finalGrade = 'B+';
          if (finalLevel !== 'Multiskill') finalLevel = 'Medium';
          finalDesignation = 'Jr.Operator';
        }
      }
      
      // Bottom Hem process rules
      else if (process.processName === "Bottom Hem" && process.smv === 0.35) {
        if (capacity >= 220 && calculatedGrade !== 'A++') {
          finalGrade = 'A+';
          if (finalLevel !== 'Multiskill') finalLevel = 'Very Good';
          finalDesignation = 'Jr.Operator';
        } else if (capacity >= 200 && capacity <= 219 && !['A++', 'A+'].includes(calculatedGrade)) {
          finalGrade = 'A';
          if (finalLevel !== 'Multiskill') finalLevel = 'Good';
          finalDesignation = 'Jr.Operator';
        } else if (capacity >= 180 && capacity <= 199 && !['A++', 'A+', 'A'].includes(calculatedGrade)) {
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
      grade = 'A++'; level = 'Multiskill'; designation = 'Jr.Operator';
    } else if (totalScore >= 80) {
      grade = 'A+'; level = 'Very Good'; designation = 'Jr.Operator';
    } else if (totalScore >= 70) {
      grade = 'A'; level = 'Good'; designation = 'Jr.Operator';
    } else if (totalScore >= 60) {
      grade = 'B+'; level = 'Medium'; designation = 'Jr.Operator';
    } else if (totalScore >= 50) {
      grade = 'B'; level = 'Average'; designation = 'Gen.Operator';
    } else {
      grade = 'Unskill'; level = 'Unskill'; designation = 'Asst.Operator';
    }

    // Apply special process rules
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