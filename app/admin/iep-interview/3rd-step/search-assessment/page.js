// app/admin/iep-interview/search/page.js
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CandidateSearch() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchType, setSearchType] = useState('candidateId')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState(null)

  const handleSearch = async (e) => {
    e.preventDefault()
    
    if (!searchTerm.trim()) {
      setError('Please enter a search term')
      return
    }

    setLoading(true)
    setError('')
    setSearchResults([])
    setSelectedCandidate(null)

    try {
      const response = await fetch(`/api/iep-interview/update-iep-interview-ass-calculator/search?${searchType}=${encodeURIComponent(searchTerm)}`)
      const data = await response.json()

      if (response.ok) {
        if (data.data && data.data.length > 0) {
          setSearchResults(data.data)
        } else {
          setError('No candidates found with the specified criteria')
        }
      } else {
        setError(data.error || 'Search failed')
      }
    } catch (error) {
      setError('Search error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectCandidate = (candidate) => {
    setSelectedCandidate(candidate)
    
    // Direct assessment এর জন্য localStorage এ candidate info সেভ করুন
    if (candidate) {
      localStorage.setItem('selectedCandidateForAssessment', JSON.stringify({
        candidateId: candidate.candidateId,
        name: candidate.name,
        nid: candidate.nid,
        birthCertificate: candidate.birthCertificate,
        picture: candidate.picture
      }))
    }
  }

  const handleProceedToInterview = () => {
    if (selectedCandidate) {
      router.push(`/admin/iep-interview/3rd-step/form?candidateId=${selectedCandidate.candidateId}`)
    }
  }

  const handleViewAllCandidates = () => {
    router.push('/admin/iep-interview')
  }

  const handleDirectAssessment = () => {
    if (selectedCandidate) {
      router.push('/operator-assessment')
    } else {
      alert('Please select a candidate first')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Candidate Search</h1>
          <p className="text-gray-600 mt-2">Search for candidates to conduct IEP interviews</p>
        </div>

        {/* Search Form */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Type
                </label>
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="candidateId">Candidate ID</option>
                  <option value="name">Name</option>
                  <option value="nid">NID</option>
                  <option value="birthCertificate">Birth Certificate</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Term
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={`Enter ${searchType === 'candidateId' ? 'Candidate ID' : searchType}...`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Search Results ({searchResults.length})
            </h2>
            
            <div className="space-y-4">
              {searchResults.map((candidate) => (
                <div
                  key={candidate._id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedCandidate?._id === candidate._id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => handleSelectCandidate(candidate)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {candidate.picture && (
                        <img
                          src={candidate.picture}
                          alt={candidate.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">{candidate.name}</h3>
                        <p className="text-sm text-gray-600">
                          Candidate ID: {candidate.candidateId}
                        </p>
                        <p className="text-sm text-gray-600">
                          {candidate.nid && `NID: ${candidate.nid}`}
                          {candidate.birthCertificate && `Birth Certificate: ${candidate.birthCertificate}`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        candidate.interviewStatus === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : candidate.interviewStatus === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {candidate.interviewStatus || 'Not Started'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Candidate Actions */}
            {selectedCandidate && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-blue-900">
                      Selected: {selectedCandidate.name}
                    </h3>
                    <p className="text-sm text-blue-700">
                      Candidate ID: {selectedCandidate.candidateId}
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setSelectedCandidate(null)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Change Selection
                    </button>
                    <button
                      onClick={handleDirectAssessment}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                    >
                      Direct Assessment
                    </button>
                    <button
                      onClick={handleProceedToInterview}
                      className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      Proceed to Interview
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleViewAllCandidates}
              className="p-4 border border-gray-200 rounded-lg text-left hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-semibold text-gray-900">View All Candidates</h3>
              <p className="text-sm text-gray-600 mt-1">
                Browse all candidates in the system
              </p>
            </button>
            
            <button
              onClick={() => router.push('/admin/iep-interview/form')}
              className="p-4 border border-gray-200 rounded-lg text-left hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-semibold text-gray-900">Start New Interview</h3>
              <p className="text-sm text-gray-600 mt-1">
                Create a new interview without searching
              </p>
            </button>

            <button
              onClick={() => router.push('/admin/operator-assessment')}
              className="p-4 border border-gray-200 rounded-lg text-left hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-semibold text-gray-900">Direct Assessment</h3>
              <p className="text-sm text-gray-600 mt-1">
                Go directly to operator assessment
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}