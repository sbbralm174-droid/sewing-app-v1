'use client';
import { useState, useEffect } from 'react';

export default function ProcessCreator() {
  const [processNames, setProcessNames] = useState('');
  const [buyers, setBuyers] = useState([]);
  const [selectedBuyers, setSelectedBuyers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [results, setResults] = useState([]);
  const [existingProcesses, setExistingProcesses] = useState([]);
  const [activeTab, setActiveTab] = useState('create');

  // Fetch buyers from API
  useEffect(() => {
    const fetchBuyers = async () => {
      try {
        const response = await fetch('/api/buyers');
        const data = await response.json();
        
        if (data.success) {
          setBuyers(data.data);
        }
      } catch (error) {
        console.error('Error fetching buyers:', error);
      }
    };

    fetchBuyers();
  }, []);

  // Fetch existing processes
  const fetchProcesses = async () => {
    try {
      const response = await fetch('/api/unique-process');
      const data = await response.json();
      
      if (data.success) {
        setExistingProcesses(data.data);
      }
    } catch (error) {
      console.error('Error fetching processes:', error);
    }
  };

  // Handle buyer selection
  const toggleBuyer = (buyerId) => {
    setSelectedBuyers(prev => 
      prev.includes(buyerId) 
        ? prev.filter(id => id !== buyerId)
        : [...prev, buyerId]
    );
  };

  // Select all buyers
  const selectAllBuyers = () => {
    setSelectedBuyers(buyers.map(buyer => buyer._id));
  };

  // Clear all selections
  const clearAllSelections = () => {
    setSelectedBuyers([]);
  };

  // Parse process names from textarea
  const parseProcessNames = () => {
    if (!processNames.trim()) return [];
    
    // Split by comma or new line and filter out empty strings
    return processNames
      .split(/[,\n]/)
      .map(name => name.trim())
      .filter(name => name.length > 0);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const processes = parseProcessNames();
    
    if (processes.length === 0) {
      setMessage('Please enter at least one process name');
      return;
    }

    if (selectedBuyers.length === 0) {
      setMessage('Please select at least one buyer');
      return;
    }

    setLoading(true);
    setMessage('');
    setResults([]);

    try {
      const response = await fetch('/api/unique-process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          processes,
          selectedBuyers
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`Successfully processed ${data.data.length} entries!`);
        setResults(data.data);
        setProcessNames('');
        setSelectedBuyers([]);
        // Refresh processes list
        fetchProcesses();
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('An error occurred while creating processes');
    } finally {
      setLoading(false);
    }
  };

  // Delete a process
  const handleDeleteProcess = async (processId) => {
    if (!confirm('Are you sure you want to delete this process?')) {
      return;
    }

    try {
      const response = await fetch(`/api/unique-process?id=${processId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Process deleted successfully');
        // Refresh processes list
        fetchProcesses();
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('An error occurred while deleting the process');
    }
  };

  // Load existing processes when tab changes
  useEffect(() => {
    if (activeTab === 'view') {
      fetchProcesses();
    }
  }, [activeTab]);

  const parsedProcesses = parseProcessNames();

  return (
    <div className="min-h-screen mt-19 bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Process Management System
        </h1>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('create')}
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === 'create'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Create Processes
          </button>
          <button
            onClick={() => setActiveTab('view')}
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === 'view'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            View All Processes
          </button>
        </div>

        {/* Create Processes Tab */}
        {activeTab === 'create' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Process Names Textarea */}
              <div>
                <label htmlFor="processNames" className="block text-sm font-medium text-gray-700 mb-2">
                  Process Names * (Separate by comma or new line)
                </label>
                <textarea
                  id="processNames"
                  value={processNames}
                  onChange={(e) => setProcessNames(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter process names separated by comma or new line&#10;Example:&#10;sleeve join&#10;collar attach&#10;button stitch, hemming"
                  required
                />
                <div className="mt-1 text-sm text-gray-500">
                  {parsedProcesses.length} process(es) detected: {parsedProcesses.join(', ')}
                </div>
              </div>

              {/* Buyers Selection */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Select Buyers *
                  </label>
                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={selectAllBuyers}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={clearAllSelections}
                      className="text-sm text-red-600 hover:text-red-800 font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Buyers List */}
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                  {buyers.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Loading buyers...
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-4">
                      {buyers.map((buyer) => (
                        <label
                          key={buyer._id}
                          className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedBuyers.includes(buyer._id)}
                            onChange={() => toggleBuyer(buyer._id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">{buyer.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="mt-2 text-sm text-gray-500">
                  {selectedBuyers.length} buyer(s) selected
                </div>
              </div>

              {/* Preview */}
              {parsedProcesses.length > 0 && selectedBuyers.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-md">
                  <h3 className="font-medium text-blue-800 mb-2">Preview - Total: {parsedProcesses.length * selectedBuyers.length} entries:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                    {parsedProcesses.map(processName => 
                      selectedBuyers.map(buyerId => {
                        const buyer = buyers.find(b => b._id === buyerId);
                        return buyer ? (
                          <div key={`${processName}-${buyerId}`} className="text-sm text-blue-700 bg-blue-100 p-2 rounded">
                            {processName}-{buyer.name}
                          </div>
                        ) : null;
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
              >
                {loading ? 'Creating Processes...' : `Create ${parsedProcesses.length * selectedBuyers.length} Processes`}
              </button>
            </form>

            {/* Message Display */}
            {message && (
              <div className={`mt-4 p-4 rounded-md ${
                message.includes('Error') 
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {message}
              </div>
            )}
          </div>
        )}

        {/* View Processes Tab */}
        {activeTab === 'view' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                All Processes ({existingProcesses.length})
              </h2>
              <button
                onClick={fetchProcesses}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
              >
                Refresh
              </button>
            </div>

            {existingProcesses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No processes found. Create some processes first.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Process Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Buyer Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unique ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {existingProcesses.map((process) => (
                      <tr key={process._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {process.processName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {process.buyerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                          {process.uniqueId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(process.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDeleteProcess(process._id)}
                            className="text-red-600 hover:text-red-900 transition duration-200"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Results Display */}
        {results.length > 0 && activeTab === 'create' && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Process Creation Results
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Process Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Buyer Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unique ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((result, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {result.processName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.buyer}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {result.uniqueId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          result.status === 'created'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {result.status}
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
    </div>
  );
}