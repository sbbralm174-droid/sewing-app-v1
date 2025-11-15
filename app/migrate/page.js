'use client';

import { useState } from 'react';

export default function MigratePage() {
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [updatedList, setUpdatedList] = useState([]);

  const runMigration = async () => {
    setLoading(true);
    setMsg('');
    setUpdatedList([]);

    try {
      const res = await fetch('/api/migrateAllowedProcesses', { method: 'POST' });
      const data = await res.json();
      setMsg(data.message || 'Migration completed!');
      if (data.updatedOperators) setUpdatedList(data.updatedOperators);
    } catch (err) {
      setMsg('Migration failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>AllowedProcesses Migration</h1>
      <p>
        This page will convert all existing <code>allowedProcesses</code> fields
        from array of strings to new Map/Object format with default score 0.
      </p>

      <button
        onClick={runMigration}
        disabled={loading}
        style={{
          padding: '0.5rem 1rem',
          background: '#0070f3',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginTop: '1rem'
        }}
      >
        {loading ? 'Running Migration...' : 'Run Migration'}
      </button>

      {msg && (
        <div
          style={{
            marginTop: '1rem',
            padding: '1rem',
            background: '#f1f1f1',
            borderRadius: '5px'
          }}
        >
          {msg}
        </div>
      )}

      {updatedList.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h3>Updated Operators:</h3>
          <ul>
            {updatedList.map(opId => (
              <li key={opId}>{opId}</li>
            ))}
          </ul>
        </div>
      )}

      <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#666' }}>
        After migration, you can remove this page for safety.
      </p>
    </div>
  );
}
