// components/viva-interview/CandidateInfoHeader.js
'use client'

export default function CandidateInfoHeader({ candidateInfo, onSearch, onBackToSearch }) {
  return (
    <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-indigo-900">Skill Matrix</h1>
        <p className="text-gray-600 mt-2">All information related to the candidate&apos;s skills</p>
      </div>
      
      {/* Candidate Details with View Details Button */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Candidate Details
          </h3>
          
          <button 
            onClick={onSearch}
            disabled={!candidateInfo.nid && !candidateInfo.birthCertificate}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 text-sm"
          >
            <span>🔍 View Details</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p><strong>Name:</strong> {candidateInfo.name || 'N/A'}</p>
            <p><strong>Candidate ID:</strong> {candidateInfo.candidateId || 'N/A'}</p>
            {candidateInfo.nid ? (
              <p><strong>NID:</strong> {candidateInfo.nid}</p>
            ) : candidateInfo.birthCertificate ? (
              <p><strong>Birth Certificate:</strong> {candidateInfo.birthCertificate}</p>
            ) : (
              <p className="text-red-500 text-sm">
                ⚠️ No NID or Birth Certificate available for search
              </p>
            )}
          </div>
          {candidateInfo.picture && (
            <div>
              <p><strong>Picture:</strong></p>
              <img 
                src={candidateInfo.picture} 
                alt={candidateInfo.name || 'Candidate'}
                className="w-24 h-24 object-cover rounded-md mt-2"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={onBackToSearch}
          className="text-indigo-600 hover:text-indigo-800 font-medium"
        >
          ← Back to Search
        </button>
      </div>
    </div>
  );
}