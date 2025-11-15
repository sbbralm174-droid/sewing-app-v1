'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import React Select with SSR disabled
const Select = dynamic(() => import('react-select'), {
  ssr: false,
  loading: () => (
    <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 animate-pulse">
      Loading...
    </div>
  )
});

export default function OccurrenceReportSearch() {
  const [searchData, setSearchData] = useState({
    searchType: 'operatorId',
    searchValue: ''
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [operators, setOperators] = useState([]);
  const [operatorsLoading, setOperatorsLoading] = useState(true);
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [isClient, setIsClient] = useState(false);

  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch operators for dropdown
  useEffect(() => {
    const fetchOperators = async () => {
      try {
        const response = await fetch('/api/operators');
        const data = await response.json();
        
        if (response.ok) {
          setOperators(data);
        } else {
          setError('Failed to load operators');
        }
      } catch (error) {
        setError('Error loading operators');
      } finally {
        setOperatorsLoading(false);
      }
    };

    fetchOperators();
  }, []);

  // Format operators for React Select
  const operatorOptions = operators.map(operator => ({
    value: operator.operatorId,
    label: `${operator.operatorId} - ${operator.name}`,
    operatorData: operator
  }));

  const handleSearchChange = (e) => {
    const newSearchType = e.target.value;
    setSearchData({
      searchType: newSearchType,
      searchValue: ''
    });
    setSelectedOperator(null);
  };

  const handleOperatorSelect = (selectedOption) => {
    setSelectedOperator(selectedOption);
    setSearchData({
      ...searchData,
      searchValue: selectedOption ? selectedOption.value : ''
    });
  };

  const handleManualInputChange = (e) => {
    setSearchData({
      ...searchData,
      searchValue: e.target.value
    });
    if (selectedOperator && selectedOperator.value !== e.target.value) {
      setSelectedOperator(null);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await fetch('/api/occurrence-report/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchData),
      });

      const data = await response.json();

      if (response.ok) {
        setResults(data);
      } else {
        setError(data.error || 'Search failed');
      }
    } catch (error) {
      setError('Error searching occurrence reports');
    } finally {
      setLoading(false);
    }
  };

  // Custom styles for React Select
  const selectStyles = {
    control: (base) => ({
      ...base,
      border: '1px solid #d1d5db',
      borderRadius: '0.375rem',
      boxShadow: 'none',
      minHeight: '42px',
      '&:hover': {
        borderColor: '#d1d5db'
      },
      '&:focus-within': {
        borderColor: '#3b82f6',
        boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)'
      }
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? '#eff6ff' : state.isSelected ? '#3b82f6' : 'white',
      color: state.isSelected ? 'white' : '#374151',
      '&:hover': {
        backgroundColor: '#eff6ff'
      }
    })
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Search Occurrence Reports</h2>
        
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search By
              </label>
              <select
                name="searchType"
                value={searchData.searchType}
                onChange={handleSearchChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="operatorId">Operator ID</option>
                <option value="nid">NID</option>
                <option value="birthCertificate">Birth Certificate</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Value
              </label>
              
              {searchData.searchType === 'operatorId' ? (
                <div className="space-y-2">
                  {isClient && (
                    <Select
                      options={operatorOptions}
                      value={selectedOperator}
                      onChange={handleOperatorSelect}
                      placeholder="Select an operator..."
                      isSearchable
                      isLoading={operatorsLoading}
                      loadingMessage={() => "Loading operators..."}
                      noOptionsMessage={() => "No operators found"}
                      styles={selectStyles}
                      className="react-select-container"
                      classNamePrefix="react-select"
                      instanceId="operator-select"
                    />
                  )}
                  
                  <div className="text-center text-sm text-gray-500">OR</div>
                  
                  <input
                    type="text"
                    value={searchData.searchValue}
                    onChange={handleManualInputChange}
                    placeholder="Type operator ID manually"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ) : (
                <input
                  type="text"
                  name="searchValue"
                  value={searchData.searchValue}
                  onChange={handleManualInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Enter ${searchData.searchType}`}
                />
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || operatorsLoading}
            className="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-md">
            {error}
          </div>
        )}
      </div>

      {results && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-800">Operator Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p><strong>Name:</strong> {results.operator.name}</p>
              <p><strong>Operator ID:</strong> {results.operator.operatorId}</p>
              <p><strong>Designation:</strong> {results.operator.designation}</p>
            </div>
            <div>
              <p><strong>Grade:</strong> {results.operator.grade}</p>
              <p><strong>NID:</strong> {results.operator.nid || 'N/A'}</p>
              <p><strong>Birth Certificate:</strong> {results.operator.birthCertificate || 'N/A'}</p>
            </div>
          </div>

          <h3 className="text-xl font-bold mb-4 text-gray-800">Occurrence Reports</h3>
          {results.occurrenceReports.length === 0 ? (
            <p className="text-gray-600">No occurrence reports found.</p>
          ) : (
            <div className="space-y-4">
              {results.occurrenceReports.map((report, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-lg">{report.type}</h4>
                    <span className="text-sm text-gray-500">
                      {new Date(report.date).toLocaleDateString()} at{' '}
                      {new Date(report.date).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2">{report.details}</p>
                  <p className="text-sm text-gray-600">
                    <strong>Reported by:</strong> {report.reportedBy}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}