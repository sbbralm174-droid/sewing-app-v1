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
    if (!nidOrBirthCertificateValue?.trim()) return;

    setLoading(true);
    setShowPopup(true);

    try {
      const params = new URLSearchParams();
      params.append('nidOrBirthCertificate', nidOrBirthCertificateValue);

      const res = await fetch(`/api/findOperatorByNidOrBirtcirtificate?${params}`);
      const data = await res.json();

      setResults(data);
    } catch (error) {
      console.error(error);
      setResults({
        success: false,
        message: 'Search failed'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-BD');
    } catch {
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
        <div style={styles.overlay}>
          <div style={styles.modal}>
            
            {/* Close Button */}
            <button onClick={closePopup} style={styles.closeBtn}>×</button>

            <h2 style={styles.title}>
              Search Results: {nidOrBirthCertificateValue}
            </h2>

            {/* Loading */}
            {loading ? (
              <p style={styles.center}>Searching...</p>
            ) : results?.success ? (

              <>
                {results.results && Object.entries(results.results).map(([key, modelData]) => (
                  modelData.count > 0 && (
                    <div key={key} style={styles.card}>
                      
                      <h4 style={styles.cardTitle}>
                        {displayNames[modelData.model] || modelData.model}
                      </h4>

                      <div style={{ overflowX: 'auto' }}>
                        <table style={styles.table}>
                          <thead>
                            <tr style={styles.thead}>
                              <th style={styles.th}>
                                {modelData.model === 'ResignHistory' ? 'Operator ID' : 'Candidate ID'}
                              </th>
                              <th style={styles.th}>
                                {modelData.model === 'ResignHistory' ? 'Reason' : 'Result'}
                              </th>
                              <th style={styles.th}>
                                {modelData.model === 'ResignHistory' ? 'Floor' : 'Floor'}
                              </th>
                              <th style={styles.th}>Date (M/D/Y)</th>
                            </tr>
                          </thead>

                          <tbody>
                            {modelData.data.map((item, idx) => {
                              const candidateId =
                                typeof item.candidateId === 'object'
                                  ? item.candidateId?.candidateId
                                  : item.candidateId;

                              return (
                                <tr key={idx}>
                                  <td style={styles.td}>
                                    {modelData.model === 'ResignHistory'
                                      ? item.operatorId || 'N/A'
                                      : candidateId || 'N/A'}
                                  </td>

                                  <td style={{
                                    ...styles.td,
                                    color:
                                      modelData.model === 'ResignHistory'
                                        ? '#374151'
                                        : item.result === 'FAILED'
                                        ? '#dc2626'
                                        : '#16a34a',
                                    fontWeight: '600'
                                  }}>
                                    {modelData.model === 'ResignHistory'
                                      ? item.reason || 'N/A'
                                      : item.result || 'N/A'}
                                  </td>

                                  <td style={styles.td}>
                                    {modelData.model === 'ResignHistory'
                                      ? item.floor 
                                      : item.floor}
                                  </td>

                                  <td style={styles.td}>
                                    {modelData.model === 'ResignHistory'
                                      ? formatDate(item.resignationDate || item.createdAt)
                                      : formatDate(item.createdAt || item.interviewDate)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                ))}
              </>

            ) : (
              <p style={{ ...styles.center, color: 'red' }}>
                {results?.message || 'No data found'}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* 🎨 CLEAN MODERN STYLES */
const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999
  },
  modal: {
    backgroundColor: '#ffffff',
    color: '#1f2937',   // 🔥 fixed visibility
    padding: '20px',
    borderRadius: '10px',
    width: '95%',
    maxWidth: '1100px',
    maxHeight: '90vh',
    overflow: 'auto',
    position: 'relative'
  },
  closeBtn: {
    position: 'absolute',
    top: '10px',
    right: '15px',
    border: 'none',
    background: '#eee',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    cursor: 'pointer',
    fontSize: '18px'
  },
  title: {
    marginBottom: '15px',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '10px',
    fontSize: '20px',
    fontWeight: '600'
  },
  center: {
    textAlign: 'center',
    padding: '20px'
  },
  card: {
    marginBottom: '20px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    overflow: 'hidden'
  },
  cardTitle: {
    backgroundColor: '#f9fafb',
    padding: '10px',
    fontWeight: '600',
    borderBottom: '1px solid #e5e7eb'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  thead: {
    backgroundColor: '#f3f4f6'
  },
  th: {
    padding: '10px',
    border: '1px solid #e5e7eb',
    textAlign: 'left',
    fontSize: '14px'
  },
  td: {
    padding: '10px',
    border: '1px solid #e5e7eb',
    fontSize: '14px'
  }
};