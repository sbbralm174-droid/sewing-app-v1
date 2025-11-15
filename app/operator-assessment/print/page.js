// app/print/page.js
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PrintView() {
  const router = useRouter()
  const [assessmentData, setAssessmentData] = useState(null)
  const [calculatedResults, setCalculatedResults] = useState(null)

  useEffect(() => {
    const data = localStorage.getItem('assessmentData')
    if (data) {
      const parsedData = JSON.parse(data)
      setAssessmentData(parsedData)
      // Recalculate results for print view
      calculateResults(parsedData)
    } else {
      router.push('/data-entry')
    }
  }, [router])

  const calculateResults = (data) => {
    // Same calculation logic as in assessment-results
    const processesWithCalculations = data.processes.map(process => {
      const avgCycleTime = process.cycleTimes.reduce((a, b) => a + b, 0) / process.cycleTimes.length
      const target = 60 / process.smv
      const capacity = 60 / ((avgCycleTime + (avgCycleTime * 0.1)) / 60)
      const performance = (capacity / target) * 100

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

    const machineScore = processesWithCalculations.reduce((sum, process) => {
      const machinePoints = {
        'SNLS/DNLS': 4,
        'Over Lock': 5,
        'Flat Lock': 6,
        'Kansai': 6
      }
      return sum + (machinePoints[process.machineType] || 0)
    }, 0)

    const dopScore = processesWithCalculations.reduce((sum, process) => {
      const dopPoints = {
        'Basic': 5,
        'Semi Critical': 7,
        'Critical': 10
      }
      return sum + (dopPoints[process.dop] || 0)
    }, 0)

    const practicalScore = processesWithCalculations.reduce((sum, process) => sum + process.practicalMarks, 0)
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

  const handlePrint = () => {
    window.print()
  }

  if (!assessmentData || !calculatedResults) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-white print:bg-white">
      {/* Print Header - Hidden on screen, shown in print */}
      <div className="hidden print:block text-center mb-8">
        <h1 className="text-2xl font-bold">GMS Textiles Ltd.</h1>
        <p className="text-lg">Tansutrapur, Kaliakair, Gazipur</p>
        <h2 className="text-xl font-semibold mt-2">Operator Skill Assessment Sheet</h2>
      </div>

      {/* Screen Controls */}
      <div className="print:hidden bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">GMS Textiles Ltd.</h1>
              <p className="text-sm text-gray-600">Print Preview</p>
            </div>
            <div className="space-x-4">
              <button
                onClick={() => router.push('/assessment-results')}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Back to Results
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Print Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:py-4">
        {/* Operator Information */}
        <div className="bg-white border-2 border-gray-300 rounded-lg p-6 mb-6 print:border print:mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Date</label>
              <p className="text-gray-900">{assessmentData.date}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Operator Name</label>
              <p className="text-gray-900">{assessmentData.operatorName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Father/Husband Name</label>
              <p className="text-gray-900">{assessmentData.fatherHusbandName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Educational Status</label>
              <p className="text-gray-900">{assessmentData.educationalStatus}</p>
            </div>
          </div>
        </div>

        {/* Detailed Results Table */}
        <div className="bg-white border-2 border-gray-300 rounded-lg p-6 mb-6 print:border print:mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Process Assessment Details</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-2">SL</th>
                  <th className="border px-4 py-2">Machine Type</th>
                  <th className="border px-4 py-2">Process Name</th>
                  <th className="border px-4 py-2">DOP</th>
                  <th className="border px-4 py-2">SMV</th>
                  <th className="border px-4 py-2">Avg Cycle Time</th>
                  <th className="border px-4 py-2">Target</th>
                  <th className="border px-4 py-2">Capacity</th>
                  <th className="border px-4 py-2">Performance %</th>
                  <th className="border px-4 py-2">Quality Status</th>
                </tr>
              </thead>
              <tbody>
                {calculatedResults.processes.map((process, index) => (
                  <tr key={index}>
                    <td className="border px-4 py-2 text-center">{index + 1}</td>
                    <td className="border px-4 py-2">{process.machineType}</td>
                    <td className="border px-4 py-2">{process.processName}</td>
                    <td className="border px-4 py-2 text-center">{process.dop}</td>
                    <td className="border px-4 py-2 text-center">{process.smv}</td>
                    <td className="border px-4 py-2 text-center">{process.avgCycleTime.toFixed(2)}</td>
                    <td className="border px-4 py-2 text-center">{process.target.toFixed(2)}</td>
                    <td className="border px-4 py-2 text-center">{process.capacity.toFixed(2)}</td>
                    <td className="border px-4 py-2 text-center">{process.performance.toFixed(2)}%</td>
                    <td className="border px-4 py-2 text-center">{process.qualityStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Scoring Summary */}
        <div className="bg-white border-2 border-gray-300 rounded-lg p-6 mb-6 print:border print:mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Scoring Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-3 border border-gray-300 rounded">
              <div className="text-xl font-bold">Machine</div>
              <div className="text-2xl font-bold text-blue-600">{calculatedResults.scores.machineScore}/15</div>
            </div>
            <div className="text-center p-3 border border-gray-300 rounded">
              <div className="text-xl font-bold">DOP</div>
              <div className="text-2xl font-bold text-green-600">{calculatedResults.scores.dopScore}/10</div>
            </div>
            <div className="text-center p-3 border border-gray-300 rounded">
              <div className="text-xl font-bold">Practical</div>
              <div className="text-2xl font-bold text-yellow-600">{calculatedResults.scores.practicalScore}/50</div>
            </div>
            <div className="text-center p-3 border border-gray-300 rounded">
              <div className="text-xl font-bold">Quality</div>
              <div className="text-2xl font-bold text-red-600">{calculatedResults.scores.qualityScore}/30</div>
            </div>
            <div className="text-center p-3 border border-gray-300 rounded">
              <div className="text-xl font-bold">Education</div>
              <div className="text-2xl font-bold text-purple-600">{calculatedResults.scores.educationScore}/5</div>
            </div>
            <div className="text-center p-3 border-2 border-gray-400 rounded bg-gray-50">
              <div className="text-xl font-bold">Total</div>
              <div className="text-2xl font-bold text-gray-900">{calculatedResults.scores.totalScore}/110</div>
            </div>
          </div>
        </div>

        {/* Final Assessment */}
        <div className="bg-white border-2 border-gray-300 rounded-lg p-6 print:border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Final Assessment</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border border-gray-300 rounded">
              <div className="text-sm text-gray-600 mb-2">Performance Level</div>
              <div className="text-2xl font-bold text-gray-900">{calculatedResults.finalAssessment.level}</div>
            </div>
            <div className="text-center p-4 border border-gray-300 rounded">
              <div className="text-sm text-gray-600 mb-2">Grade</div>
              <div className="text-2xl font-bold text-gray-900">{calculatedResults.finalAssessment.grade}</div>
            </div>
            <div className="text-center p-4 border border-gray-300 rounded">
              <div className="text-sm text-gray-600 mb-2">Proposed Designation</div>
              <div className="text-2xl font-bold text-gray-900">{calculatedResults.finalAssessment.designation}</div>
            </div>
          </div>
        </div>

        {/* Signatures Section */}
        <div className="mt-8 print:mt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-center">
            <div>
              <div className="border-t border-gray-400 mt-12 pt-2">
                <p className="text-sm">Officer/Sr. Officer (IEP)</p>
              </div>
            </div>
            <div>
              <div className="border-t border-gray-400 mt-12 pt-2">
                <p className="text-sm">APM/DPM/PM (Production)</p>
              </div>
            </div>
            <div>
              <div className="border-t border-gray-400 mt-12 pt-2">
                <p className="text-sm">Sr. Manager (IEP)</p>
              </div>
            </div>
            <div>
              <div className="border-t border-gray-400 mt-12 pt-2">
                <p className="text-sm">Sr. Manager/AGM (Production)</p>
              </div>
            </div>
            <div>
              <div className="border-t border-gray-400 mt-12 pt-2">
                <p className="text-sm">Head of HR & Compliance</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 20px;
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:border {
            border: 1px solid #000 !important;
          }
          .print\\:py-4 {
            padding-top: 1rem !important;
            padding-bottom: 1rem !important;
          }
          .print\\:mb-4 {
            margin-bottom: 1rem !important;
          }
          .print\\:mt-6 {
            margin-top: 1.5rem !important;
          }
        }
      `}</style>
    </div>
  )
}