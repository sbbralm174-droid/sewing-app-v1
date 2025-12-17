'use client';

import React, { useState, useEffect } from 'react';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState([]);
  const [dbData, setDbData] = useState([]);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'view'
  const [stats, setStats] = useState({
    totalRecords: 0,
    lastUpload: null
  });

  // Fetch data from database on component mount
  useEffect(() => {
    fetchDbData();
  }, []);

  const fetchDbData = async () => {
    try {
      const response = await fetch('/api/excell-upload?limit=500');
      const result = await response.json();
      
      if (result.success) {
        setDbData(result.data);
        setStats(prev => ({
          ...prev,
          totalRecords: result.totalRecords
        }));
      }
    } catch (error) {
      console.error('Error fetching DB data:', error);
    }
  };

  // File input handler
  const handleFileChange = (e) => {
    const selectedFile = e.target.files ? e.target.files[0] : null;
    setFile(selectedFile);
    setMessage(selectedFile ? `File selected: ${selectedFile.name}` : 'No file selected.');
    setExtractedData([]);
  };

  // Save button click handler
  const handleSave = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please select an Excel file first.');
      return;
    }

    setLoading(true);
    setMessage('Uploading file and saving to database...');

    const formData = new FormData();
    formData.append('excelFile', file);

    try {
      const response = await fetch('/api/excell-upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(`✅ ${result.message} (Extracted: ${result.totalExtracted}, Saved: ${result.savedToDB})`);
        
        if (result.errors && result.errors.length > 0) {
          console.warn('Errors during save:', result.errors);
        }
        
        // Refresh database data
        fetchDbData();
        // Show extracted data
        setExtractedData(result.data || []);
        setActiveTab('view');
      } else {
        setMessage(`❌ Error: ${result.message || 'Unknown error occurred'}`);
      }
    } catch (error) {
      setMessage(`❌ Connection failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Stats Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow mb-6 border border-blue-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-semibold text-gray-500">Total Records in DB</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalRecords}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-semibold text-gray-500">Last Upload</h3>
            <p className="text-lg font-medium text-gray-700">
              {dbData[0] ? formatDate(dbData[0].uploadedAt) : 'No data'}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-semibold text-gray-500">Current File</h3>
            <p className="text-lg font-medium text-gray-700 truncate">
              {file ? file.name : 'No file selected'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`px-6 py-3 font-medium text-lg ${activeTab === 'upload' 
            ? 'border-b-2 border-blue-600 text-blue-600' 
            : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('upload')}
        >
          📤 Upload Excel
        </button>
        <button
          className={`px-6 py-3 font-medium text-lg ${activeTab === 'view' 
            ? 'border-b-2 border-blue-600 text-blue-600' 
            : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('view')}
        >
          📋 View Database Records
        </button>
      </div>

      {/* Upload Card */}
      {activeTab === 'upload' && (
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 mb-10 max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            📁 Excel Data Upload
          </h1>
          <p className="text-gray-500 mb-6 italic">
            Upload Excel file to extract data and save to MongoDB database.
          </p>

          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <input
              type="file"
              accept=".xls,.xlsx,.xlsm"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-3 file:px-6
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-100 file:text-blue-700
                hover:file:bg-blue-200 border-2 border-dashed border-gray-300 rounded-lg p-4"
            />

            <button
              type="submit"
              disabled={!file || loading}
              className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all
                ${loading || !file 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'}`}
            >
              {loading ? '⏳ Processing & Saving to DB...' : '💾 Upload & Save to Database'}
            </button>
          </form>

          {message && (
            <div className={`mt-4 p-4 rounded-lg text-sm font-medium ${message.includes('✅') 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'}`}>
              {message}
            </div>
          )}
        </div>
      )}

      {/* Data Display Section */}
      {activeTab === 'view' && (
        <div className="space-y-6">
          {/* Database Records */}
          {dbData.length > 0 && (
            <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-700">
                  📊 Database Records (Latest {dbData.length})
                </h2>
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                  Total: {stats.totalRecords}
                </span>
              </div>
              
              <div className="overflow-x-auto max-h-[600px]">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr className="text-gray-600 uppercase text-xs font-bold">
                      <th className="px-4 py-3 text-left">S/NO</th>
                      <th className="px-4 py-3 text-left">Process</th>
                      <th className="px-4 py-3 text-left">M/C Type & HP</th>
                      <th className="px-4 py-3 text-left">SMV</th>
                      <th className="px-4 py-3 text-left">Capacity</th>
                      <th className="px-4 py-3 text-left">Man Power</th>
                      <th className="px-4 py-3 text-left">Balance</th>
                      <th className="px-4 py-3 text-left">Target</th>
                      <th className="px-4 py-3 text-left">Uploaded At</th>
                      <th className="px-4 py-3 text-left">File</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100 text-sm text-gray-700">
                    {dbData.map((row, index) => (
                      <tr key={row._id || index} className="hover:bg-blue-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{row.sno}</td>
                        <td className="px-4 py-3">{row.process}</td>
                        <td className="px-4 py-3">
                          <span className="bg-gray-200 px-2 py-1 rounded text-xs font-semibold">
                            {row.mcTypeHp}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-blue-600">{row.smv}</td>
                        <td className="px-4 py-3">{Math.round(row.capacity)}</td>
                        <td className="px-4 py-3">{row.manPower}</td>
                        <td className="px-4 py-3 text-red-500 font-medium">
                          {Math.round(row.balanceCapacity)}
                        </td>
                        <td className="px-4 py-3 font-bold">{Math.round(row.adjustTarget)}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {formatDate(row.uploadedAt)}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 truncate max-w-[150px]">
                          {row.fileName || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="bg-gray-50 px-6 py-3 text-right text-xs text-gray-500 border-t border-gray-200">
                Showing latest {dbData.length} records
              </div>
            </div>
          )}

          {/* Recently Extracted Data (if any) */}
          {extractedData.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-blue-100">
              <div className="bg-blue-50 px-6 py-4 border-b border-blue-200">
                <h2 className="text-xl font-semibold text-blue-700">
                  🆕 Recently Extracted Data
                </h2>
                <p className="text-sm text-blue-600">Preview of data just uploaded</p>
              </div>
              
              <div className="overflow-x-auto max-h-[400px]">
                <table className="min-w-full divide-y divide-blue-100">
                  <thead className="bg-blue-50">
                    <tr className="text-blue-700 uppercase text-xs font-bold">
                      <th className="px-4 py-3 text-left">S/NO</th>
                      <th className="px-4 py-3 text-left">Process</th>
                      <th className="px-4 py-3 text-left">M/C Type</th>
                      <th className="px-4 py-3 text-left">SMV</th>
                      <th className="px-4 py-3 text-left">Capacity</th>
                      <th className="px-4 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-blue-50 text-sm">
                    {extractedData.slice(0, 20).map((row, index) => (
                      <tr key={index} className="hover:bg-blue-25 transition-colors">
                        <td className="px-4 py-3 font-medium">{row.sno}</td>
                        <td className="px-4 py-3">{row.process}</td>
                        <td className="px-4 py-3">{row.mcTypeHp}</td>
                        <td className="px-4 py-3">{row.smv}</td>
                        <td className="px-4 py-3">{Math.round(row.capacity)}</td>
                        <td className="px-4 py-3">
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            Extracted
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}