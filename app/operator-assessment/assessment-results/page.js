// app/assessment-results/page.js
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AssessmentResults() {
  const router = useRouter()
  const [assessmentData, setAssessmentData] = useState(null)
  const [calculatedResults, setCalculatedResults] = useState(null)

  useEffect(() => {
    const data = localStorage.getItem('assessmentData')
    if (data) {
      const parsedData = JSON.parse(data)
      setAssessmentData(parsedData)
      calculateResults(parsedData)
    } else {
      router.push('/operator-assessment/data-entry')
    }
  }, [router])

  const calculateResults = (data) => {
  const processesWithCalculations = data.processes.map(process => {
    const avgCycleTime = process.cycleTimes.reduce((a, b) => a + b, 0) / process.cycleTimes.length
    const target = 60 / process.smv
    const capacity = 60 / ((avgCycleTime + (avgCycleTime * 0.1)) / 60)
    const performance = (capacity / target) * 100

    // Calculate practical marks (0-5 per process)
    let practicalMarks = 0
    if (performance > 90) practicalMarks = 5
    else if (performance >= 80) practicalMarks = 4
    else if (performance >= 70) practicalMarks = 3
    else if (performance >= 60) practicalMarks = 2
    else if (performance >= 50) practicalMarks = 1

    return {
      ...process,
      avgCycleTime,
      target,
      capacity,
      performance,
      practicalMarks
    }
  })

  // 1. Machine Score - maximum 15 porjonto
  const machineScore = Math.min(
    processesWithCalculations.reduce((sum, process) => {
      const machinePoints = {
        'SNLS/DNLS': 4,
        'Over Lock': 5,
        'Flat Lock': 6,
        'Kansai': 6
      }
      return sum + (machinePoints[process.machineType] || 0)
    }, 0),
    15
  )

  // 2. DOP Score - average value, maximum 10 porjonto
  const dopScores = processesWithCalculations.map(process => {
    const dopPoints = {
      'Basic': 5,
      'Semi Critical': 7,
      'Critical': 10
    }
    return dopPoints[process.dop] || 0
  })

  const dopScore = Math.min(
    dopScores.reduce((sum, score) => sum + score, 0) / dopScores.length,
    10
  )

  // 3. Practical Score - maximum 50 porjonto
  // Updated practical score calculation
const practicalScore = Math.min(
  processesWithCalculations.reduce((sum, process) => {
    let practicalMarks = 0
    if (process.performance > 90) practicalMarks = 5
    else if (process.performance >= 80) practicalMarks = 4
    else if (process.performance >= 70) practicalMarks = 3
    else if (process.performance >= 60) practicalMarks = 2
    else if (process.performance >= 50) practicalMarks = 1
    
    return sum + practicalMarks
  }, 0) , // Each mark multiplied by 10 to get actual score
  50 // Maximum 50 porjonto
)

  // Quality Score (unchanged)
  const qualityScore = processesWithCalculations.reduce((sum, process) => {
    const qualityPoints = {
      'No Defect': 30,
      '1 Operation Defect': 24,
      '2 Operation Defect': 18
    }
    return sum + (qualityPoints[process.qualityStatus] || 0)
  }, 0)

  const educationScore = data.educationalStatus === 'Five Above' ? 5 : 3

  const totalScore = machineScore + dopScore + practicalScore + qualityScore + educationScore

  // Determine grade and designation
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

  setCalculatedResults({
    processes: processesWithCalculations,
    scores: {
      machineScore,
      dopScore,
      practicalScore,
      qualityScore,
      educationScore,
      totalScore
    },
    finalAssessment: {
      grade,
      level,
      designation
    }
  })
}

  if (!assessmentData || !calculatedResults) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">GMS Textiles Ltd.</h1>
              <p className="text-sm text-gray-600">Operator Skill Assessment - Results</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Operator Info Card */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Operator Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Name</label>
              <p className="text-gray-900">{assessmentData.operatorName}</p>
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
                </tr>
              </thead>
              <tbody>
                {calculatedResults.processes.map((process, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border text-center">{index + 1}</td>
                    <td className="px-4 py-2 border">{process.machineType}</td>
                    <td className="px-4 py-2 border">{process.processName}</td>
                    <td className="px-4 py-2 border text-center">{process.avgCycleTime.toFixed(2)}</td>
                    <td className="px-4 py-2 border text-center">{process.target.toFixed(2)}</td>
                    <td className="px-4 py-2 border text-center">{process.capacity.toFixed(2)}</td>
                    <td className="px-4 py-2 border text-center">{process.performance.toFixed(2)}%</td>
                    <td className="px-4 py-2 border text-center">{process.practicalMarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Final Assessment */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Final Assessment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{calculatedResults.scores.machineScore}</div>
              <div className="text-sm text-gray-600">Machine Score</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{calculatedResults.scores.dopScore}</div>
              <div className="text-sm text-gray-600">DOP Score</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{calculatedResults.scores.practicalScore}</div>
              <div className="text-sm text-gray-600">Practical Score</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{calculatedResults.scores.qualityScore}</div>
              <div className="text-sm text-gray-600">Quality Score</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{calculatedResults.scores.educationScore}</div>
              <div className="text-sm text-gray-600">Education Score</div>
            </div>
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600">{calculatedResults.scores.totalScore}</div>
              <div className="text-sm text-gray-600">Total Score</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-900">{calculatedResults.finalAssessment.grade}</div>
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
            onClick={() => router.push('/operator-assessment/data-entry')}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back to Data Entry
          </button>
          <button
            onClick={() => router.push('/print')}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            View Print Version
          </button>
        </div>
      </div>
    </div>
  )
}