// app/test-search/page.js
'use client';
import { useState } from 'react';

export default function TestSearch() {
  const [searchValue, setSearchValue] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const params = new URLSearchParams();
      params.append('nidOrBirthCertificate', searchValue);
      
      const response = await fetch(`/api/findOperatorByNidOrBirtcirtificate?${params}`);
      const data = await response.json();
      
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
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

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Operator Search Test</h1>
      
      <form onSubmit={handleSearch} style={{ marginBottom: '20px' }}>
        <div style={{ margin: '10px 0' }}>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="NID বা Birth Certificate নম্বর লিখুন"
            style={{ padding: '8px', width: '300px' }}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading || !searchValue}
          style={{ padding: '8px 16px' }}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {results && (
        <div>
          <h2>Results for: {results.searchValue}</h2>
          
          {results.success ? (
            <>
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '5px' }}>
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
            <div style={{ color: 'red', padding: '15px', backgroundColor: '#ffe6e6', borderRadius: '5px' }}>
              Error: {results.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}