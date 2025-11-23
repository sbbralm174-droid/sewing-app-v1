// components/operator-assessment/Mainassessment.js 
'use client'
import { useState, useEffect } from 'react'

export default function MainAssessment({ onAssessmentComplete, candidateInfo }) {
  const [currentView, setCurrentView] = useState('data-entry')
  const [assessmentData, setAssessmentData] = useState(null)
  const [operatorName, setOperatorName] = useState('')
  const [processesList, setProcessesList] = useState([]) // API থেকে প্রসেস লিস্ট

  // candidateInfo থেকে ডেটা লোড করুন
  useEffect(() => {
    if (candidateInfo) {
      // candidateInfo থেকে operator name সেট করুন
      setOperatorName(candidateInfo.name || '');
      
      // localStorage থেকে existing ডেটা লোড করুন (যদি থাকে)
      const savedData = localStorage.getItem('assessmentData');
      if (savedData) {
        try {
          const data = JSON.parse(savedData);
          setAssessmentData(data);
        } catch (error) {
          console.error('Error parsing saved data:', error);
          initializeNewData();
        }
      } else {
        initializeNewData();
      }
    }
  }, [candidateInfo]);

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

  // localStorage থেকে ডেটা লোড করা (candidateInfo না থাকলে)
  useEffect(() => {
    if (!candidateInfo) {
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
  }, [candidateInfo])

  // ডেটা সেভ করার ফাংশন - localStorage এ সেভ করবে
  const handleSaveData = (data) => {
    const completeData = {
      ...data,
      operatorName: operatorName || data.operatorName,
      // candidate info যোগ করুন
      candidateId: candidateInfo?.candidateId || data.candidateId,
      nid: candidateInfo?.nid || data.nid,
      birthCertificate: candidateInfo?.birthCertificate || data.birthCertificate,
      // timestamp যোগ করুন
      lastSaved: new Date().toISOString()
    }
    
    // localStorage এ সেভ করুন
    localStorage.setItem('assessmentData', JSON.stringify(completeData))
    setAssessmentData(completeData)
    setCurrentView('results')
    
    console.log('Data saved to localStorage:', completeData)
  }

  // ডেটা এন্ট্রিতে ফিরে যাওয়ার ফাংশন - ডেটা হারাবে না
  const handleBackToDataEntry = () => {
    setCurrentView('data-entry')
  }

  // localStorage থেকে ডেটা ক্লিয়ার করার ফাংশন
  const handleClearData = () => {
    localStorage.removeItem('assessmentData')
    setAssessmentData(null)
    setOperatorName('')
    if (candidateInfo) {
      initializeNewData()
    }
  }

  // Assessment সম্পূর্ণ হলে parent component কে ডেটা পাঠানো - UPDATED
  const handleUseAssessment = () => {
    if (assessmentData) {
      const calculatedResults = calculateResults(assessmentData)
      
      // Process capacity calculation - সংশোধিত
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
      
      // Candidate information যোগ করুন - UPDATED
      const assessmentResult = {
        // Candidate info from props
        candidateInfo: candidateInfo ? {
          name: candidateInfo.name,
          candidateId: candidateInfo.candidateId,
          nid: candidateInfo.nid,
          birthCertificate: candidateInfo.birthCertificate,
          picture: candidateInfo.picture
        } : null,
        
        // Assessment results
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

      console.log('Assessment Result with Candidate Info:', assessmentResult)
      
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
          />
        ) : (
          <AssessmentResults 
            onBackToDataEntry={handleBackToDataEntry}
            assessmentData={assessmentData}
            onUseAssessment={onAssessmentComplete ? handleUseAssessment : null}
            candidateInfo={candidateInfo}
          />
        )}
      </div>
    </div>
  )
}

// Data Entry Component - Updated with better localStorage handling
function DataEntry({ onSave, onCancel, initialData, operatorName, setOperatorName, processesList, candidateInfo, onClearData }) {
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

  // Supplementary machines list
  const supplementaryMachineOptions = [
     'Eyelet', 'FOA', 
    'Kansai', 'BH', 'BS', 'BTK', 'F/Sleamer'
  ]

  // candidateInfo থেকে initial values সেট করুন - UPDATED
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
          // processes array properly merge করুন
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
      
      

      {/* Candidate Information Display - NEW SECTION */}
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Father's/Husband's Name</label>
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
  )
}

// Assessment Results Component - Updated with candidate info
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
      {/* Candidate Info Card - NEW SECTION */}
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

// UPDATED Helper function for calculations with MULTISKILL logic
// UPDATED Helper function for calculations with MULTISKILL logic and DEBUGGING
function calculateResults(data) {
  const processesWithCalculations = data.processes.map(process => {
    const validCycleTimes = process.cycleTimes.filter(time => time > 0);
    const avgCycleTime = validCycleTimes.length > 0 
      ? validCycleTimes.reduce((a, b) => a + b, 0) / validCycleTimes.length 
      : 0;
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

  // UPDATED: Machine Score Calculation with MULTISKILL logic
  const calculateMachineScore = (processes) => {
    const specialMachines = ["SNLS/DNLS", "Over Lock", "Flat Lock"];
    const semiSpecialMachines = ["F/Sleamer", "Kansai", "FOA"];

    const machinesUsed = [...new Set(processes.map(p => p.machineType))];

    // -------- MULTISKILL CHECK --------
    // যদি Over Lock, SNLS/DNLS, Flat Lock এই তিনটি মেশিনের সবগুলোতে পারদর্শী হয়
    const hasAllThreeSpecial = specialMachines.every(machine => 
      machinesUsed.includes(machine)
    );

    if (hasAllThreeSpecial) {
      return 100; // Multiskill - সর্বোচ্চ স্কোর
    }

    // -------- Special Machine Score --------
    const specialCount = machinesUsed.filter(m => specialMachines.includes(m)).length;

    let specialScore = 0;
    if (specialCount === 1) specialScore = 40;
    else if (specialCount === 2) specialScore = 70;
    else if (specialCount === 3) specialScore = 100;

    let totalScore = specialScore;

    // -------- Semi-Special Score --------
    if (totalScore < 100) {
      const semiCount = machinesUsed.filter(m => semiSpecialMachines.includes(m)).length;
      totalScore += semiCount * 20;
    }

    // -------- Other Machines Score --------
    if (totalScore < 100) {
      const otherMachines = machinesUsed.filter(
        m => !specialMachines.includes(m) && !semiSpecialMachines.includes(m)
      );

      totalScore += otherMachines.length * 10;
    }

    // -------- Cap at 100 --------
    return Math.min(totalScore, 100);
  };

  const machineScore = calculateMachineScore(data.processes);
  const finalMachineScore = machineScore * 0.3;

  // DOP Score Calculation (process status)
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

  // Total Score Calculation (now out of 100)
  const totalScore = finalMachineScore + dopScore + practicalScore + averageQualityScore + educationScore + attitudeScore

  // UPDATED: Special process grade adjustment logic with MULTISKILL and DEBUGGING
  const applySpecialProcessRules = (processes, calculatedGrade, calculatedLevel, calculatedDesignation) => {
    console.log("🔍 === SPECIAL PROCESS RULES DEBUG START ===");
    console.log("Initial Assessment:");
    console.log("- Grade:", calculatedGrade);
    console.log("- Level:", calculatedLevel);
    console.log("- Designation:", calculatedDesignation);
    console.log("- Total Score:", totalScore);

    let finalGrade = calculatedGrade;
    let finalLevel = calculatedLevel;
    let finalDesignation = calculatedDesignation;

    // A++ এবং Multiskill লেভেলের জন্য প্রয়োজনীয় বিশেষ প্রসেসগুলির সংজ্ঞা
    const fourProcess = [
        { name: "Pocket join (Kangaro)", minCapacity: 90, machine: "SNLS/DNLS" },
        { name: "Placket box", minCapacity: 120, machine: "SNLS/DNLS" },
        { name: "Zipper join(2nd)", minCapacity: 80, machine: "SNLS/DNLS" },
        { name: "Back neck piping & cut", minCapacity: 120, machine: "SNLS/DNLS" }
    ];

    // ডিবাগিং: সমস্ত প্রসেস দেখানো
    console.log("📊 All Processes:");
    processes.forEach((p, index) => {
      console.log(`  ${index + 1}. ${p.processName} | Machine: ${p.machineType} | Capacity: ${Math.round(p.capacity)} | SMV: ${p.smv}`);
    });

    // চেক করুন যে সমস্ত fourProcess সম্পন্ন হয়েছে কিনা (প্রসেসের নাম এবং ক্ষমতা)
    const hasFourProcess = fourProcess.every(req => {
      const foundProcess = processes.find(p => {
        const processNameMatch = p.processName.toLowerCase().includes(req.name.toLowerCase().split(' ')[0]);
        const capacityMatch = Math.round(p.capacity) >= req.minCapacity;
        const machineMatch = p.machineType === "SNLS" || p.machineType === "DNLS" || p.machineType === "SNLS/DNLS";
        
        const isMatch = processNameMatch && capacityMatch && machineMatch;
        
        if (isMatch) {
          console.log(`✅ Found matching process: ${p.processName} (Required: ${req.name}) - Capacity: ${Math.round(p.capacity)} >= ${req.minCapacity}`);
        } else {
          console.log(`❌ Missing/Not matching: ${req.name} | Looking for: ${req.name} in ${p.processName} | Capacity: ${Math.round(p.capacity)} vs ${req.minCapacity} | Machine: ${p.machineType}`);
        }
        
        return isMatch;
      });
      
      return !!foundProcess;
    });

    // নির্দিষ্ট মেশিন এবং প্রসেসগুলি পরীক্ষা করার জন্য সহায়ক ফাংশন  ekhane
    const hasMachineProcess = (machine, processName, minCapacity = 0) => {
    const found = processes.some(p => {
        const machineMatch = p.machineType === machine || 
                           (machine === "SNLS/DNLS" && (p.machineType === "SNLS" || p.machineType === "DNLS"));
        const processMatch = p.processName.toLowerCase().includes(processName.toLowerCase());
        const capacityMatch = Math.round(p.capacity) >= minCapacity;
        const isMatch = machineMatch && processMatch && capacityMatch;
        
        if (isMatch) {
          console.log(`✅ Found ${machine} + ${processName}: ${p.processName} | Capacity: ${Math.round(p.capacity)} >= ${minCapacity}`);
        } else if (machineMatch && processMatch) {
          console.log(`❌ ${machine} + ${processName} found but capacity ${Math.round(p.capacity)} < ${minCapacity}`);
        }
        
        return isMatch;
    });
    
    if (!found) {
      console.log(`❌ Missing ${machine} + ${processName} with capacity >= ${minCapacity}`);
    }
    
    return found;
};

// এখন capacity requirement সহ check করুন
const hasNeckJoinOverLock = hasMachineProcess("Over Lock", "Neck join", 150);  // Neck join capacity 150 er upore
const hasBodyHemFlatLock = hasMachineProcess("Flat Lock", "Body hem", 220);    // Body hem capacity 220 er upore

    console.log("📋 Condition Checks:");
    console.log("- Has Four Process:", hasFourProcess);
    console.log("- Has Neck Join OverLock:", hasNeckJoinOverLock);
    console.log("- Has Body Hem FlatLock:", hasBodyHemFlatLock);

    // --- নতুন A++ এবং Multiskill নিয়ম ---

    // 1. (fourProcess) capacity= above 90/120/80/120, "Over Lock" process "Neck join", "Flat Lock" process "Body hem"
    if (hasFourProcess && hasNeckJoinOverLock && hasBodyHemFlatLock) {
        console.log("🎯 Condition 1 MET: All four process + Neck Join + Body Hem");
        finalLevel = 'Multiskill';
        finalGrade = 'A++';
        finalDesignation = 'Jr.Operator';
    } 
    // 2. machine = "Over Lock" ebong process "Neck join", machine = "Flat Lock" eobng process "Body hem"
    else if (hasNeckJoinOverLock && hasBodyHemFlatLock) {
        console.log("🎯 Condition 2 MET: Neck Join + Body Hem");
        finalGrade = 'A++';
        finalLevel = 'Excellent';
        finalDesignation = 'Jr.Operator';
    } 
    // 3. machine = SNLS/DNLS ebong process uporer charta (fourProcess), machine "Flat Lock" eobng process "Body hem"
    else if (hasFourProcess && hasBodyHemFlatLock) {
        console.log("🎯 Condition 3 MET: Four Process + Body Hem");
        finalGrade = 'A++';
        finalLevel = 'Excellent';
        finalDesignation = 'Jr.Operator';
    } 
    // 4. machine = SNLS/DNLS ebong process uporer charta (fourProcess), machine "Over Lock" eobng process "Neck join"
    else if (hasFourProcess && hasNeckJoinOverLock) {
        console.log("🎯 Condition 4 MET: Four Process + Neck Join");
        finalGrade = 'A++';
        finalLevel = 'Excellent';
        finalDesignation = 'Jr.Operator';
    }else if (hasFourProcess) {
        console.log("🎯 Condition 5 MET: Four Process");
        finalGrade = 'A+';
        finalLevel = 'Very Good';
        finalDesignation = 'Jr.Operator';
    }
    else {
      console.log("❌ No A++ conditions met");
    }

    // --- পুরানো নিয়ম (Multiskill Level Check) ---
    // শুধুমাত্র গ্রেড এবং লেভেল নতুন নিয়মে সেট না হলেই এই অংশটি বিবেচিত হবে。
    
    // যদি উপরের নতুন A++ শর্তে finalLevel 'Multiskill' সেট না হয়ে থাকে
    if (finalLevel !== 'Multiskill') {
        const specialMachines = ["SNLS/DNLS", "Over Lock", "Flat Lock"];
        const machinesUsed = [...new Set(processes.map(p => p.machineType))];
        const hasAllThreeSpecial = specialMachines.every(machine => 
            machinesUsed.includes(machine)
        );
    
        console.log("🔧 Multiskill Machine Check:");
        console.log("- Machines Used:", machinesUsed);
        console.log("- Has All Three Special:", hasAllThreeSpecial);
    
        // MULTISKILL LEVEL CHECK - যদি তিনটি বিশেষ মেশিনে পারদর্শী হয়
        // if (hasAllThreeSpecial) {
        //     console.log("🎯 Multiskill Condition MET: All three special machines");
        //     finalLevel = 'Multiskill';
        //     // Multiskill হলে গ্রেড A++ বা A+ হলে designation Jr.Operator হবে
        //     if (finalGrade === 'A++' || finalGrade === 'A+') {
        //         finalDesignation = 'Jr.Operator';
        //     }
        // }
    }

    // --- পুরানো Capacity-ভিত্তিক নিয়ম ---
    
    console.log("🔧 Capacity-based rules checking:");
    processes.forEach(process => {
        const capacity = Math.round(process.capacity);

        // Neck join process rules
        if (process.processName === "Neck join" && process.smv === 0.35 && finalGrade !== 'A++') {
            console.log(`📊 Neck Join Check: Capacity ${capacity}, SMV ${process.smv}, Current Grade ${finalGrade}`);
            if (capacity >= 150 && finalGrade !== 'A+') {
                console.log("🎯 Neck Join Condition 1: Capacity >= 150");
                finalGrade = 'A+';
                if (finalLevel !== 'Multiskill') finalLevel = 'Very Good';
                finalDesignation = 'Jr.Operator';
            } else if (capacity >= 120 && capacity <= 149 && !['A++', 'A+'].includes(finalGrade)) {
                console.log("🎯 Neck Join Condition 2: Capacity 120-149");
                finalGrade = 'A';
                if (finalLevel !== 'Multiskill') finalLevel = 'Good';
                finalDesignation = 'Jr.Operator';
            } else if (capacity >= 100 && capacity <= 119 && !['A++', 'A+', 'A'].includes(finalGrade)) {
                console.log("🎯 Neck Join Condition 3: Capacity 100-119");
                finalGrade = 'B+';
                if (finalLevel !== 'Multiskill') finalLevel = 'Medium';
                finalDesignation = 'Jr.Operator';
            }
        }
        
        // Bottom Hem process rules
        else if (process.processName === "Bottom Hem" && process.smv === 0.35 && finalGrade !== 'A++') {
            console.log(`📊 Bottom Hem Check: Capacity ${capacity}, SMV ${process.smv}, Current Grade ${finalGrade}`);
            if (capacity >= 220 && finalGrade !== 'A+') {
                console.log("🎯 Bottom Hem Condition 1: Capacity >= 220");
                finalGrade = 'A+';
                if (finalLevel !== 'Multiskill') finalLevel = 'Very Good';
                finalDesignation = 'Jr.Operator';
            } else if (capacity >= 200 && capacity <= 219 && !['A++', 'A+'].includes(finalGrade)) {
                console.log("🎯 Bottom Hem Condition 2: Capacity 200-219");
                finalGrade = 'A';
                if (finalLevel !== 'Multiskill') finalLevel = 'Good';
                finalDesignation = 'Jr.Operator';
            } else if (capacity >= 180 && capacity <= 199 && !['A++', 'A+', 'A'].includes(finalGrade)) {
                console.log("🎯 Bottom Hem Condition 3: Capacity 180-199");
                finalGrade = 'B+';
                if (finalLevel !== 'Multiskill') finalLevel = 'Medium';
                finalDesignation = 'Jr.Operator';
            }
        }
    });

    console.log("📈 Final Assessment:");
    console.log("- Grade:", finalGrade);
    console.log("- Level:", finalLevel);
    console.log("- Designation:", finalDesignation);
    console.log("🔍 === SPECIAL PROCESS RULES DEBUG END ===");

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
    } else if (totalScore >= 70) {
      grade = 'A'; level = 'Good'; designation = 'Jr.Operator';
    } else if (totalScore >= 55) {
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