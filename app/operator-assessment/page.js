// app/operator-assessment/page.js
'use client'
import { useState, useEffect } from 'react'
import DataEntry from './data-entry/page'
import AssessmentResults from './assessment-results/page'

export default function OperatorAssessment() {
  const [currentView, setCurrentView] = useState('data-entry')
  const [assessmentData, setAssessmentData] = useState(null)

  // localStorage থেকে ডেটা লোড করা
  useEffect(() => {
    const data = localStorage.getItem('assessmentData')
    if (data) {
      setAssessmentData(JSON.parse(data))
    }
  }, [])

  // ডেটা সেভ করার ফাংশন
  const handleSaveData = (data) => {
    localStorage.setItem('assessmentData', JSON.stringify(data))
    setAssessmentData(data)
    setCurrentView('results')
  }

  // ডেটা এন্ট্রিতে ফিরে যাওয়ার ফাংশন
  const handleBackToDataEntry = () => {
    setCurrentView('data-entry')
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
          />
        ) : (
          <AssessmentResults 
            onBackToDataEntry={handleBackToDataEntry}
            assessmentData={assessmentData}
          />
        )}
      </div>
    </div>
  )
}