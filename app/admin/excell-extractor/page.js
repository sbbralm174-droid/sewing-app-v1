'use client';

import React, { useState, useEffect } from 'react';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState([]);
  const [savedData, setSavedData] = useState(null);
  const [uploadHistory, setUploadHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedHistoryData, setSelectedHistoryData] = useState(null);
  const [viewMode, setViewMode] = useState('new'); // 'new' or 'history'
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch upload history on component mount
  useEffect(() => {
    fetchUploadHistory();
  }, []);

  const fetchUploadHistory = async () => {
    try {
      const response = await fetch('/api/excell-upload');
      const result = await response.json();
      if (result.success) {
        setUploadHistory(result.data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  // Fetch single document data
  const fetchHistoryData = async (id, fileName) => {
    setHistoryLoading(true);
    setViewMode('history');
    setMessage(`Loading ${fileName}...`);
    
    try {
      const response = await fetch(`/api/excell-upload/${id}`);
      const result = await response.json();
      
      if (result.success) {
        setSelectedHistoryData(result.data);
        setExtractedData(result.data.data || []);
        setMessage(`✅ Loaded: ${fileName} (${result.data.totalRecords} records)`);
      } else {
        setMessage(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      setMessage(`❌ Failed to load data: ${error.message}`);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Delete a document
  const deleteHistoryData = async (id, fileName) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/excell-upload/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      
      if (result.success) {
        setMessage(`✅ Deleted: ${fileName}`);
        
        // Remove from history list
        setUploadHistory(prev => prev.filter(item => item._id !== id));
        
        // Clear if currently viewing deleted data
        if (selectedHistoryData && selectedHistoryData._id === id) {
          setSelectedHistoryData(null);
          setExtractedData([]);
          setViewMode('new');
        }
      } else {
        setMessage(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      setMessage(`❌ Failed to delete: ${error.message}`);
    }
  };

  // File input handler
  const handleFileChange = (e) => {
    const selectedFile = e.target.files ? e.target.files[0] : null;
    setFile(selectedFile);
    setMessage(selectedFile ? `File selected: ${selectedFile.name}` : 'No file selected.');
    setExtractedData([]);
    setSavedData(null);
    setSelectedHistoryData(null);
    setViewMode('new');
  };

  // Save button click handler
  const handleSave = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please select an Excel file first.');
      return;
    }

    setLoading(true);
    setMessage('Uploading file and processing data...');

    const formData = new FormData();
    formData.append('excelFile', file);

    try {
      const response = await fetch('/api/excell-upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setExtractedData(result.data || []);
        setSavedData({
          id: result.mongoId,
          fileName: file.name,
          totalRecords: result.totalRecords,
          savedAt: result.savedAt
        });
        setViewMode('new');
       // setMessage(`✅ Data successfully saved to database! )`);
        
        // Refresh history
        fetchUploadHistory();
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
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Clear current view
  const handleClearView = () => {
    setExtractedData([]);
    setSavedData(null);
    setSelectedHistoryData(null);
    setViewMode('new');
    setMessage('View cleared');
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Upload Card */}
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 mb-10 max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
              📁 Excel Data Upload & Save
            </h1>
            <p className="text-gray-500 italic">
              Extract data from breakdown sheet and save to MongoDB database.
            </p>
          </div>
          
          {extractedData.length > 0 && (
            <button
              onClick={handleClearView}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
            >
              Clear View
            </button>
          )}
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <input
            type="file"
            accept=".xls,.xlsx,.xlsm"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100 border border-gray-300 rounded-md p-2"
          />

          <button
            type="submit"
            disabled={!file || loading}
            className={`w-full py-3 px-4 rounded-md font-bold text-white transition-all
              ${loading || !file 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'}`}
          >
            {loading ? 'Processing...' : '💾 Save to Database'}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-3 rounded-md text-sm font-medium ${message.includes('✅') ? 'bg-green-100 text-green-800' : message.includes('❌') ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
            {message}
          </div>
        )}

        {savedData && viewMode === 'new' && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-bold text-blue-800 mb-2">✅ New Data Saved!</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="font-medium">File Name:</span> {savedData.fileName}</div>
              <div><span className="font-medium">Total Records:</span> {savedData.totalRecords}</div>
              {/* <div><span className="font-medium">Database ID:</span> <code className="text-xs bg-blue-100 px-1 rounded">{savedData.id}</code></div> */}
              <div><span className="font-medium">Saved At:</span> {formatDate(savedData.savedAt)}</div>
            </div>
          </div>
        )}

        {selectedHistoryData && viewMode === 'history' && (
          <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                {/* <h3 className="font-bold text-purple-800 mb-2">📋 Viewing Historical Data</h3> */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-medium">File Name:</span> {selectedHistoryData.fileName}</div>
                  <div><span className="font-medium">Total Records:</span> {selectedHistoryData.totalRecords}</div>
                  <div><span className="font-medium">Uploaded:</span> {formatDate(selectedHistoryData.uploadedAt)}</div>
                  <div><span className="font-medium">Database ID:</span> <code className="text-xs bg-purple-100 px-1 rounded">{selectedHistoryData._id}</code></div>
                </div>
              </div>
              <button
                onClick={() => deleteHistoryData(selectedHistoryData._id, selectedHistoryData.fileName)}
                className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {/* History Section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              <span className="text-lg">{showHistory ? '▼' : '▶'}</span>
              <span>Upload History</span>
              <span className="bg-gray-200 px-2 py-1 rounded text-xs">
                {uploadHistory.length} files
              </span>
            </button>
            
            <button
              onClick={fetchUploadHistory}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              ↻ Refresh
            </button>
          </div>

          {showHistory && (
            <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
              {uploadHistory.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No upload history found
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="p-3 text-left">File Name</th>
                        <th className="p-3 text-left">Records</th>
                        <th className="p-3 text-left">Uploaded</th>
                        <th className="p-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadHistory.map((item) => (
                        <tr 
                          key={item._id} 
                          className={`border-b hover:bg-gray-50 ${selectedHistoryData?._id === item._id ? 'bg-purple-50' : ''}`}
                        >
                          <td className="p-3">
                            <button
                              onClick={() => fetchHistoryData(item._id, item.fileName)}
                              className="text-left text-blue-600 hover:text-blue-800 hover:underline font-medium flex items-center gap-2"
                              disabled={historyLoading}
                            >
                              {item.fileName}
                              {historyLoading && selectedHistoryData?._id === item._id && (
                                <span className="text-xs text-gray-500">(Loading...)</span>
                              )}
                            </button>
                          </td>
                          <td className="p-3">{item.totalRecords}</td>
                          <td className="p-3 text-gray-500 text-xs">{formatDate(item.uploadedAt)}</td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => fetchHistoryData(item._id, item.fileName)}
                                className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded"
                                disabled={historyLoading}
                              >
                                View
                              </button>
                              <button
                                onClick={() => deleteHistoryData(item._id, item.fileName)}
                                className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 border-t">
                Click on file name to view data
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Data Table Display */}
      {extractedData.length > 0 && (
        <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200 animate-in fade-in duration-500">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              {/* <h2 className="text-xl font-semibold text-gray-700">
                {viewMode === 'history' ? ' Historical Data' : ' Newly Uploaded Data'}
              </h2> */}
              <p className="text-sm text-gray-500 mt-1">
                {viewMode === 'history' 
                  ? `Viewing: ${selectedHistoryData?.fileName}` 
                  : 'This data is now saved in MongoDB'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500">
                {extractedData.length} records
              </div>
              {/* <div className={`px-3 py-1 rounded-full text-xs font-medium ${viewMode === 'history' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                {viewMode === 'history' ? 'Historical' : 'New Upload'}
              </div> */}
            </div>
          </div>
          
          <div className="overflow-x-auto max-h-[500px]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left">S/NO</th>
                  <th className="px-4 py-3 text-left">Process</th>
                  <th className="px-4 py-3 text-left">MC Type & HP</th>
                  <th className="px-4 py-3 text-left">SMV</th>
                  <th className="px-4 py-3 text-left">Capacity</th>
                  <th className="px-4 py-3 text-left">Man Power</th>
                  <th className="px-4 py-3 text-left">Balance</th>
                  <th className="px-4 py-3 text-left">Support Operation</th>
                  <th className="px-4 py-3 text-left">Target</th>
                  <th className="px-4 py-3 text-left">Remarks</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100 text-sm text-gray-700">
                {extractedData.map((row, index) => (
                  <tr key={index} className="hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 text-center">{row.sno}</td>
                    <td className="px-4 py-3">{row.process}</td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs font-semibold">{row.mcTypeHp}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-blue-600 text-center">{row.smv}</td>
                    <td className="px-4 py-3 text-center">{Math.round(row.capacity)}</td>
                    <td className="px-4 py-3 text-center">{row.manPower}</td>
                    <td className="px-4 py-3 text-center text-red-600 font-medium">{Math.round(row.balanceCapacity)}</td>
                    <td className="px-4 py-3 text-gray-600 text-sm max-w-xs truncate">{row.supportOperation || '-'}</td>
                    <td className="px-4 py-3 text-center font-bold text-green-600">{Math.round(row.adjustTarget)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs italic max-w-xs truncate" title={row.remarks}>
                      {row.remarks || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Showing {extractedData.length} records
            </div>
            <div className="text-xs text-gray-500">
              {viewMode === 'history' 
                ? `Uploaded: ${selectedHistoryData ? formatDate(selectedHistoryData.uploadedAt) : ''}` 
                : 'Newly uploaded data'}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {extractedData.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4 text-6xl"></div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">No Data to Display</h3>
          <p className="text-gray-500">
            {viewMode === 'history' 
              ? 'Select a file from history to view data' 
              : 'Upload an Excel file to see data here'}
          </p>
        </div>
      )}
    </div>
  );
}