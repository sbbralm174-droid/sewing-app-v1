'use client';
import { useState, useEffect } from 'react';

export default function NidOrBirthCertificateSearch({ 
  nidOrBirthCertificateValue = '',
  autoSearch = false 
}) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const displayNames = {
    'IepInterviewStepOne': 'SECURITY (GATE)',
    'IepInterviewDownAdmin': 'ADMIN (SELECTION)',
    'IepInterview': 'IE (ASSESSMENT)',
    'AdminInterview': 'ADMIN (RECRUITMENT)',
    'Operator': 'Employee Main Record',
    'ResignHistory': 'Previous Resignation History'
  };

  useEffect(() => {
    if (autoSearch && nidOrBirthCertificateValue) {
      handleSearch();
    }
  }, [nidOrBirthCertificateValue, autoSearch]);

  const handleSearch = async () => {
    if (!nidOrBirthCertificateValue || !nidOrBirthCertificateValue.trim()) {
      return;
    }
    
    setLoading(true);
    setShowPopup(true);
    
    try {
      const params = new URLSearchParams();
      params.append('nidOrBirthCertificate', nidOrBirthCertificateValue);
      
      const response = await fetch(`/api/findOperatorByNidOrBirtcirtificate?${params}`);
      const data = await response.json();
      
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
      setResults({
        success: false,
        message: 'Search failed. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-BD');
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    setResults(null);
  };

  return (
    <>
      {showPopup && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white', padding: '20px', borderRadius: '8px',
            width: '95%', maxWidth: '1200px', maxHeight: '90vh',
            overflow: 'auto', position: 'relative', boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
          }}>
            <button onClick={closePopup} style={{
                position: 'absolute', top: '10px', right: '15px',
                background: '#eee', border: 'none', fontSize: '20px',
                cursor: 'pointer', borderRadius: '50%', width: '30px', height: '30px'
              }}>×</button>

            <h2 style={{ marginBottom: '20px', color: '#333', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
              Search Results for: {String(nidOrBirthCertificateValue)}
            </h2>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}><p>Searching... Please wait</p></div>
            ) : results && typeof results === 'object' ? (
              results.success ? (
                <>
                  <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '5px' }}>
                    <p><strong>Total Records Found:</strong> {results.summary?.totalRecords || 0}</p>
                    <p><strong>Data Sections:</strong> {
                      results.summary?.modelsWithData
                        ? results.summary.modelsWithData.map(m => displayNames[m] || m).join(', ')
                        : 'None'
                    }</p>
                  </div>

                  {results.results && Object.entries(results.results).map(([key, modelData]) => (
                    modelData.count > 0 && (
                      <div key={key} style={{ marginBottom: '25px', border: '1px solid #ddd', borderRadius: '5px', overflow: 'hidden' }}>
                        <h4 style={{ backgroundColor: '#f8f9fa', padding: '10px', margin: 0, borderBottom: '1px solid #ddd' }}>
                          {displayNames[modelData.model] || modelData.model} ({modelData.count})
                        </h4>
                        
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ backgroundColor: '#f1f1f1' }}>
                              <tr>
                                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Candidate ID</th>
                                {modelData.model === 'AdminInterview' ? (
                                  <>
                                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>NID / Birth Cert</th>
                                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>Result</th>
                                    {modelData.data.some(d => d.result === 'FAILED') && (
                                      <th style={{ padding: '10px', border: '1px solid #ddd' }}>Cancel Reason</th>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>Result</th>
                                  </>
                                )}
                                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {modelData.data.map((item, idx) => (
                                <tr key={idx}>
                                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                    {/* এখানে চেক করা হচ্ছে: candidateId যদি অবজেক্ট হয় তবে ভেতর থেকে মান নিবে, নাহলে সরাসরি মান দেখাবে */}
                                    {typeof item.candidateId === 'object' 
                                      ? (item.candidateId?.candidateId || 'N/A') 
                                      : (item.candidateId || 'N/A')}
                                  </td>
                                  
                                  {modelData.model === 'AdminInterview' ? (
                                    <>
                                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{String(item.nid || item.birthCertificate || 'N/A')}</td>
                                      <td style={{ padding: '10px', border: '1px solid #ddd', color: item.result === 'FAILED' ? 'red' : 'green', fontWeight: 'bold' }}>
                                        {String(item.result || 'N/A')}
                                      </td>
                                      {modelData.data.some(d => d.result === 'FAILED') && (
                                        <td style={{ padding: '10px', border: '1px solid #ddd', color: 'red' }}>
                                          {item.result === 'FAILED' ? String(item.canceledReason || 'Not Specified') : '-'}
                                        </td>
                                      )}
                                    </>
                                  ) : (
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{String(item.result || 'N/A')}</td>
                                  )}
                                  
                                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{formatDate(item.createdAt || item.interviewDate)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )
                  ))}
                </>
              ) : (
                <div style={{ color: 'red', textAlign: 'center', padding: '20px' }}>
                  {String(results.message || 'No data found')}
                </div>
              )
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}