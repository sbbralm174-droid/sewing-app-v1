// components/NidOrBirthCertificateSearch.js
'use client';
import { useState, useEffect } from 'react';

export default function NidOrBirthCertificateSearch({ 
  nidOrBirthCertificateValue = '',
  autoSearch = false 
}) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  // autoSearch true thakle automatically search kore
  useEffect(() => {
    if (autoSearch && nidOrBirthCertificateValue) {
      handleSearch();
    }
  }, [nidOrBirthCertificateValue, autoSearch]);

  const handleSearch = async () => {
    if (!nidOrBirthCertificateValue.trim()) {
      alert('Please provide NID or Birth Certificate number');
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

  // Function to format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-BD');
  };

  // Function to render process and score data
  const renderProcessAndScore = (processAndScore) => {
    if (!processAndScore || Object.keys(processAndScore).length === 0) {
      return 'N/A';
    }
    
    return Object.entries(processAndScore).map(([process, score]) => (
      <div key={process} style={{ marginBottom: '4px' }}>
        <strong>{process}:</strong> {score}
      </div>
    ));
  };

  const closePopup = () => {
    setShowPopup(false);
    setResults(null);
  };

  return (
    <>
      {/* Popup Modal */}
      {showPopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '1200px',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            {/* Close Button */}
            <button
              onClick={closePopup}
              style={{
                position: 'absolute',
                top: '10px',
                right: '15px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              ×
            </button>

            <h2 style={{ marginBottom: '20px', color: '#333' }}>
              Search Results for: {nidOrBirthCertificateValue}
            </h2>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p>Searching...</p>
              </div>
            ) : results ? (
              results.success ? (
                <>
                  <div style={{ 
                    marginBottom: '20px', 
                    padding: '15px', 
                    backgroundColor: '#f0f8ff', 
                    borderRadius: '5px' 
                  }}>
                    <h3>Summary:</h3>
                    <p><strong>Total Records:</strong> {results.summary.totalRecords}</p>
                    <p><strong>Models with Data:</strong> {results.summary.modelsWithData.join(', ')}</p>
                  </div>

                  {Object.entries(results.results).map(([key, modelData]) => (
                    modelData.count > 0 && (
                      <div key={key} style={{ 
                        marginBottom: '25px', 
                        border: '1px solid #ddd', 
                        padding: '15px',
                        borderRadius: '5px'
                      }}>
                        <h4 style={{ 
                          backgroundColor: '#f5f5f5', 
                          padding: '10px', 
                          margin: '-15px -15px 15px -15px',
                          borderBottom: '1px solid #ddd'
                        }}>
                          {modelData.model} ({modelData.count} records)
                        </h4>
                        
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ 
                            width: '100%', 
                            borderCollapse: 'collapse',
                            fontSize: '14px'
                          }}>
                            <thead>
                              <tr style={{ backgroundColor: '#e9ecef' }}>
                                {modelData.model === 'IepInterviewStepOne' && (
                                  <>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Candidate ID</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Name</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>NID</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Result</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Date</th>
                                  </>
                                )}
                                
                                {modelData.model === 'IepInterviewDownAdmin' && (
                                  <>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Candidate ID</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Result</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Date</th>
                                  </>
                                )}
                                
                                {modelData.model === 'IepInterview' && (
                                  <>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Candidate ID</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Name</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>NID</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Interviewer</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Department</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Grade</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Result</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Process & Score</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Date</th>
                                  </>
                                )}
                                
                                {modelData.model === 'Operator' && (
                                  <>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Operator ID</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Name</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>NID</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Designation</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Grade</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Allowed Processes</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Joining Date</th>
                                  </>
                                )}
                                
                                {modelData.model === 'ResignHistory' && (
                                  <>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Operator ID</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Name</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>NID</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Designation</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Resignation Date</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Approved By</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Reason</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Allowed Processes</th>
                                  </>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {modelData.data.map((item, index) => (
                                <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                                  {modelData.model === 'IepInterviewStepOne' && (
                                    <>
                                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.candidateId}</td>
                                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.name}</td>
                                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.nid}</td>
                                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.result}</td>
                                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{formatDate(item.createdAt)}</td>
                                    </>
                                  )}
                                  
                                  {modelData.model === 'IepInterviewDownAdmin' && (
                                    <>
                                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.candidateId}</td>
                                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.result}</td>
                                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{formatDate(item.createdAt)}</td>
                                    </>
                                  )}
                                  
                                  {modelData.model === 'IepInterview' && (
                                    <>
                                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.candidateId}</td>
                                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.name}</td>
                                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.nid}</td>
                                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.interviewer}</td>
                                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.department}</td>
                                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.grade}</td>
                                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.result}</td>
                                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                                        {renderProcessAndScore(item.processAndScore)}
                                      </td>
                                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{formatDate(item.interviewDate)}</td>
                                    </>
                                  )}
                                  
                                  {modelData.model === 'Operator' && (
                                    <>
                                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.operatorId}</td>
                                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.name}</td>
                                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.nid}</td>
                                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.designation}</td>
                                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.grade}</td>
                                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                                        {renderProcessAndScore(item.allowedProcesses)}
                                      </td>
                                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{formatDate(item.joiningDate)}</td>
                                    </>
                                  )}
                                  
                                  {modelData.model === 'ResignHistory' && (
                                    <>
                                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.operatorId}</td>
                                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.name}</td>
                                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.nid}</td>
                                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.designation}</td>
                                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{formatDate(item.resignationDate)}</td>
                                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.approvedBy}</td>
                                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.reason}</td>
                                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                                        {renderProcessAndScore(item.allowedProcesses)}
                                      </td>
                                    </>
                                  )}
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
                <div style={{ 
                  color: 'red', 
                  padding: '15px', 
                  backgroundColor: '#ffe6e6', 
                  borderRadius: '5px',
                  textAlign: 'center'
                }}>
                  <h3>Error</h3>
                  <p>{results.message}</p>
                </div>
              )
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p>No results to display</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}