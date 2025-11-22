// app/admin/iep-interview/form/page.js
'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import InterviewForm from '@/components/viva-interview/UpdateInterviewForm'

export default function InterviewFormPage() {
  const searchParams = useSearchParams()
  const candidateId = searchParams.get('candidateId')
  const [candidateInfo, setCandidateInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // URL থেকে candidateId পেলে candidate information লোড করুন
  useEffect(() => {
    if (candidateId) {
      loadCandidateInfo(candidateId)
    }
  }, [candidateId])

  const loadCandidateInfo = async (id) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/iep-interview/update-iep-interview-ass-calculator/candidate?candidateId=${id}`)
      const data = await response.json()

      if (response.ok && data.data) {
        setCandidateInfo(data.data)
      } else {
        setError(data.error || 'Candidate not found')
      }
    } catch (error) {
      setError('Error loading candidate information')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToSearch = () => {
    window.history.back()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading candidate information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">IEP Interview Form</h1>
              <p className="text-gray-600 mt-2">
                {candidateInfo 
                  ? `Interviewing: ${candidateInfo.name} (${candidateInfo.candidateId})`
                  : 'Create new interview'
                }
              </p>
            </div>
            
            <button
              onClick={handleBackToSearch}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Back to Search
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* Interview Form Component */}
        <InterviewForm 
          candidateInfo={candidateInfo}
          onBackToSearch={handleBackToSearch}
        />
      </div>
    </div>
  )
}