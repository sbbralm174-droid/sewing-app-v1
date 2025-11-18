// components/operator-assessment/Mainassessment.js
'use client'
import { useState, useEffect } from 'react'

export default function MainAssessment({ onAssessmentComplete }) {
  const [currentView, setCurrentView] = useState('data-entry')
  const [assessmentData, setAssessmentData] = useState(null)
  const [operatorName, setOperatorName] = useState('')

  // localStorage থেকে ডেটা লোড করা
  useEffect(() => {
    const savedData = localStorage.getItem('assessmentData')
    if (savedData) {
      const data = JSON.parse(savedData)
      setAssessmentData(data)
      setOperatorName(data.operatorName || '')
    }
  }, [])

  // ডেটা সেভ করার ফাংশন
  const handleSaveData = (data) => {
    const completeData = {
      ...data,
      operatorName: operatorName || data.operatorName
    }
    localStorage.setItem('assessmentData', JSON.stringify(completeData))
    setAssessmentData(completeData)
    setCurrentView('results')
  }

  // ডেটা এন্ট্রিতে ফিরে যাওয়ার ফাংশন
  const handleBackToDataEntry = () => {
    setCurrentView('data-entry')
  }

  // Assessment সম্পূর্ণ হলে parent component কে ডেটা পাঠানো
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
      
      // Parent component-এ পাঠানোর জন্য ডেটা প্রস্তুত করা
      const assessmentResult = {
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
        rawData: assessmentData
      }

      console.log('Process Capacity Data:', processCapacity)
      console.log('Sending assessment data to parent:', assessmentResult)
      
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
          />
        ) : (
          <AssessmentResults 
            onBackToDataEntry={handleBackToDataEntry}
            assessmentData={assessmentData}
            onUseAssessment={onAssessmentComplete ? handleUseAssessment : null}
          />
        )}
      </div>
    </div>
  )
}

// Data Entry Component - Updated
function DataEntry({ onSave, onCancel, initialData, operatorName, setOperatorName }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    operatorName: operatorName || 'Most. Rahima Khatun',
    fatherHusbandName: 'Md. Afser Khan',
    educationalStatus: 'Eight Above',
    attitude: 'Good',
    sewingFloor: 'Sewing Floor',
    processes: [
      {
        machineType: 'SNLS/DNLS',
        processName: 'Main Lavel Attach',
        dop: 'Basic',
        smv: 0.3,
        cycleTimes: [22, 23, 25, 22, 23],
        qualityStatus: 'No Defect',
        remarks: ''
      },
      {
        machineType: 'Flat Lock',
        processName: 'Body Hem',
        dop: 'Critical',
        smv: 0.33,
        cycleTimes: [28, 27, 26, 25, 24],
        qualityStatus: '',
        remarks: ''
      }
    ]
  })

  // initialData থাকলে সেট করা
  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
      setOperatorName(initialData.operatorName)
    }
  }, [initialData, setOperatorName])

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

  const handleOperatorNameChange = (e) => {
    const name = e.target.value
    setOperatorName(name)
    setFormData(prev => ({ ...prev, operatorName: name }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
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
                <th className="px-4 py-2 border">Remarks</th>
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
                      <option value="Kansai">Kansai</option>
                      <option value="BH">BH</option>
                      <option value="BS">BS</option>
                      <option value="BTK">BTK</option>
                      <option value="F/Sleamer">F/Sleamer</option>
                    </select>
                  </td>
                  <td className="px-4 py-2 border">
                    <input
                      type="text"
                      value={process.processName}
                      onChange={(e) => updateProcess(index, 'processName', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter process name"
                    />
                  </td>
                  <td className="px-4 py-2 border">
                    <select
                      value={process.dop}
                      onChange={(e) => updateProcess(index, 'dop', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select</option>
                      <option value="Basic">Basic</option>
                      <option value="Semi Critical">Semi Critical</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </td>
                  <td className="px-4 py-2 border">
                    <input
                      type="number"
                      step="0.01"
                      value={process.smv}
                      onChange={(e) => updateProcess(index, 'smv', parseFloat(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                  <td className="px-4 py-2 border">
                    <input
                      type="text"
                      value={process.remarks}
                      onChange={(e) => updateProcess(index, 'remarks', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
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

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
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
    </form>
  )
}

// Assessment Results Component - Updated
function AssessmentResults({ onBackToDataEntry, assessmentData, onUseAssessment }) {
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

        {/* Process Capacity Summary */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Process Capacity Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {calculatedResults.processes.map((process, index) => (
              <div key={index} className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-700 truncate">{process.processName}</div>
                <div className="text-lg font-bold text-blue-600">{Math.round(process.capacity)} pcs</div>
                <div className="text-xs text-gray-500">per hour</div>
              </div>
            ))}
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

// Helper function for calculations - UPDATED
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

  // Machine Score Calculation
  const machineScore = processesWithCalculations.reduce((sum, process) => {
    const machinePoints = {
      'SNLS/DNLS': 4,
      'Over Lock': 5,
      'Flat Lock': 6,
      'Kansai': 6,
      'BH': 3,
      'BS': 3,
      'BTK': 3,
      'F/Sleamer': 6,
    }
    return sum + (machinePoints[process.machineType] || 0)
  }, 0)

  const machineCount = processesWithCalculations.length
  const averageMachineScore = machineCount > 0 ? machineScore / machineCount : 0
  const finalMachineScore = ((averageMachineScore / 6) * 100) * 0.30

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

  // Education Score Calculation - UPDATED
  const educationScoreMap = {
    'Eight Above': 5,
    'Five Above': 3,
    'Below Five': 2
  }
  const educationScore = educationScoreMap[data.educationalStatus] || 0

  // Attitude Score Calculation - UPDATED
  const attitudeScoreMap = {
    'Good': 5,
    'Normal': 3,
    'Bad': 2
  }
  const attitudeScore = attitudeScoreMap[data.attitude] || 0

  // Total Score Calculation - UPDATED (now out of 100)
  const totalScore = finalMachineScore + dopScore + practicalScore + averageQualityScore + educationScore + attitudeScore

  // Final Assessment
  let grade, level, designation
  if (totalScore >= 90) {
    grade = 'A++'; level = 'Multiskill'; designation = 'Jr.Operator'
  } else if (totalScore >= 80) {
    grade = 'A+'; level = 'Very Good'; designation = 'Jr.Operator'
  } else if (totalScore >= 70) {
    grade = 'A'; level = 'Good'; designation = 'Jr.Operator'
  } else if (totalScore >= 60) {
    grade = 'B+'; level = 'Medium'; designation = 'Jr.Operator'
  } else if (totalScore >= 50) {
    grade = 'B'; level = 'Average'; designation = 'Gen.Operator'
  } else {
    grade = 'Unskill'; level = 'Unskill'; designation = 'Asst.Operator'
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