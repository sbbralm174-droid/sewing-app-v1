// components/viva-interview/CandidateInfoHeader.js
'use client'

export default function CandidateInfoHeader({ 
  candidateInfo, 
  onSearch, 
  onBackToSearch,
  apiData // নতুন prop হিসেবে API ডেটা গ্রহণ
}) {
  console.log('Full candidateInfo in Header:', candidateInfo);
  console.log('API Data in Header:', apiData); // API ডেটা লগ করুন
  
  // API ডেটা প্রাধান্য দিন, যদি না থাকে তবে candidateInfo ব্যবহার করুন
  const experienceMachines = apiData?.experienceMachines || candidateInfo?.experienceMachines || {};
  const designation = apiData?.designation || candidateInfo?.designation || {};
  const chairmanCertificate = apiData?.chairmanCertificate ?? candidateInfo?.chairmanCertificate ?? false;
  const educationCertificate = apiData?.educationCertificate ?? candidateInfo?.educationCertificate ?? false;
  const status = apiData?.status || candidateInfo?.status || 'N/A';
  const result = apiData?.result || candidateInfo?.result || 'N/A';
  const stepCompleted = apiData?.stepCompleted || candidateInfo?.stepCompleted || 'N/A';

  console.log('Final experienceMachines:', experienceMachines);
  console.log('Final designation:', designation);
  console.log('Final certificates:', { chairmanCertificate, educationCertificate });

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
            disabled={!candidateInfo?.nid && !candidateInfo?.birthCertificate}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 text-sm"
          >
            <span>🔍 View Details</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p><strong>Name:</strong> {candidateInfo?.name || 'N/A'}</p>
            <p><strong>Candidate ID:</strong> {candidateInfo?.candidateId || 'N/A'}</p>
            {candidateInfo?.nid ? (
              <p><strong>NID:</strong> {candidateInfo.nid}</p>
            ) : candidateInfo?.birthCertificate ? (
              <p><strong>Birth Certificate:</strong> {candidateInfo.birthCertificate}</p>
            ) : (
              <p className="text-red-500 text-sm">
                ⚠️ No NID or Birth Certificate available for search
              </p>
            )}
          </div>
          {candidateInfo?.picture && (
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

        {/* API Data Section */}
        {apiData && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
            <h4 className="font-semibold text-blue-700 mb-2">API Data:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <p><strong>Status:</strong> <span className="capitalize">{status}</span></p>
              <p><strong>Result:</strong> <span className="font-bold">{result}</span></p>
              <p><strong>Step Completed:</strong> {stepCompleted}</p>
            </div>
          </div>
        )}

        {/* Experience Machines Section */}
        <div className="mt-4 p-3 bg-white rounded-md border">
          <h4 className="font-semibold text-gray-700 mb-2">Experience Machines:</h4>
          <div className="flex flex-wrap gap-4">
            {Object.keys(experienceMachines).length > 0 ? (
              <>
                <div className={`px-3 py-1 rounded-full text-sm ${
                  experienceMachines.SNLS_DNLS ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  SNLS/DNLS: {experienceMachines.SNLS_DNLS ? 'Yes' : 'No'}
                </div>
                <div className={`px-3 py-1 rounded-full text-sm ${
                  experienceMachines.OverLock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  OverLock: {experienceMachines.OverLock ? 'Yes' : 'No'}
                </div>
                <div className={`px-3 py-1 rounded-full text-sm ${
                  experienceMachines.FlatLock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  FlatLock: {experienceMachines.FlatLock ? 'Yes' : 'No'}
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-sm">No machine experience data available</p>
            )}
          </div>
        </div>

        {/* Designation Section */}
        <div className="mt-4 p-3 bg-white rounded-md border">
          <h4 className="font-semibold text-gray-700 mb-2">Designation:</h4>
          <div className="flex flex-wrap gap-4">
            {Object.keys(designation).length > 0 ? (
              <>
                <div className={`px-3 py-1 rounded-full text-sm ${
                  designation.ASST_OPERATOR ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  Assistant Operator: {designation.ASST_OPERATOR ? 'Yes' : 'No'}
                </div>
                <div className={`px-3 py-1 rounded-full text-sm ${
                  designation.OPERATOR ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  Operator: {designation.OPERATOR ? 'Yes' : 'No'}
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-sm">No designation data available</p>
            )}
          </div>
        </div>

        {/* Certificate Status Section */}
        <div className="mt-4 p-3 bg-white rounded-md border">
          <h4 className="font-semibold text-gray-700 mb-2">Certificate Status:</h4>
          <div className="flex flex-wrap gap-4">
            <div className={`px-3 py-1 rounded-full text-sm ${
              chairmanCertificate ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              Chairman Certificate: {chairmanCertificate ? 'Available' : 'Not Available'}
            </div>
            <div className={`px-3 py-1 rounded-full text-sm ${
              educationCertificate ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              Education Certificate: {educationCertificate ? 'Available' : 'Not Available'}
            </div>
          </div>
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