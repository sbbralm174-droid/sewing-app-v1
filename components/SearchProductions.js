// components/SearchProductions.js

"use client";

import React, { useState } from 'react';
import ProductionTable from './ProductionTable';

const SearchProductions = () => {
  const [searchParams, setSearchParams] = useState({
    date: new Date().toISOString().split('T')[0],
    floor: '',
    line: ''
  });
  
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState([]);

  // Search function
  const handleSearch = async () => {
    if (!searchParams.date || !searchParams.floor || !searchParams.line) {
      setError('Please fill all search fields');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams(searchParams);
      const response = await fetch(`/api/daily-production/searchforproductiontable?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const data = await response.json();
      setSearchResults(data.data || []);
      setEditableData(data.data || []);
    } catch (err) {
      setError(err.message || 'Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle editing mode
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      // Copy search results to editable data
      setEditableData([...searchResults]);
    }
  };

  // Handle row data changes
  const handleRowChange = (index, field, value) => {
    setEditableData(prev => {
      const newData = [...prev];
      if (field === 'target') {
        newData[index].target = Number(value);
      } else if (field.startsWith('hourly.')) {
        const [_, hourIndex, subField] = field.split('.');
        if (subField === 'productionCount') {
          newData[index].hourlyProduction[hourIndex].productionCount = Number(value);
        } else if (subField === 'defectCount') {
          const [defectIndex] = subField.split('_');
          // Handle defect count updates here
        }
      } else {
        newData[index][field] = value;
      }
      return newData;
    });
  };

  // Handle hourly production changes
  const handleHourlyChange = (rowIndex, hourIndex, hourData) => {
    setEditableData(prev => {
      const newData = [...prev];
      if (!newData[rowIndex].hourlyProduction) {
        newData[rowIndex].hourlyProduction = [];
      }
      newData[rowIndex].hourlyProduction[hourIndex] = {
        ...newData[rowIndex].hourlyProduction[hourIndex],
        ...hourData
      };
      return newData;
    });
  };

  // Save all changes
  const handleSaveAll = async () => {
    setIsLoading(true);
    
    try {
      const updates = editableData.map(item => ({
        id: item._id,
        target: item.target,
        hourlyProduction: item.hourlyProduction,
        process: item.process,
        breakdownProcess: item.breakdownProcess,
        smv: item.smv,
        workAs: item.workAs,
        // Add other fields as needed
      }));
      
      const response = await fetch('/api/daily-productions/bulk-update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update');
      }
      
      const result = await response.json();
      
      if (result.success) {
        alert(`Successfully updated ${result.updatedCount} records`);
        setIsEditing(false);
        // Refresh data
        handleSearch();
      } else {
        throw new Error('Update failed');
      }
    } catch (err) {
      setError(err.message || 'Save failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Add new hourly slot to a row
  const addHourlySlot = (rowIndex) => {
    setEditableData(prev => {
      const newData = [...prev];
      if (!newData[rowIndex].hourlyProduction) {
        newData[rowIndex].hourlyProduction = [];
      }
      
      // Find the last hour to determine next hour
      const lastHour = newData[rowIndex].hourlyProduction.length > 0 
        ? newData[rowIndex].hourlyProduction[newData[rowIndex].hourlyProduction.length - 1].hour
        : '09-10 AM';
      
      // Simple hour increment logic (you might need more sophisticated logic)
      const hourMap = {
        '09-10 AM': '10-11 AM',
        '10-11 AM': '11-12 PM',
        '11-12 PM': '12-01 PM',
        '12-01 PM': '01-02 PM',
        '01-02 PM': '02-03 PM',
        '02-03 PM': '03-04 PM',
        '03-04 PM': '04-05 PM',
        '04-05 PM': '05-06 PM',
        '05-06 PM': '06-07 PM',
        '06-07 PM': '07-08 PM',
        '07-08 PM': '08-09 PM'
      };
      
      const newHour = hourMap[lastHour] || '09-10 AM';
      
      newData[rowIndex].hourlyProduction.push({
        hour: newHour,
        productionCount: 0,
        defects: [],
        createdAt: new Date()
      });
      
      return newData;
    });
  };

  // Remove hourly slot
  const removeHourlySlot = (rowIndex, hourIndex) => {
    setEditableData(prev => {
      const newData = [...prev];
      newData[rowIndex].hourlyProduction.splice(hourIndex, 1);
      return newData;
    });
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Search Productions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={searchParams.date}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Floor
            </label>
            <input
              type="text"
              name="floor"
              value={searchParams.floor}
              onChange={handleInputChange}
              placeholder="Enter floor"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Line
            </label>
            <input
              type="text"
              name="line"
              value={searchParams.line}
              onChange={handleInputChange}
              placeholder="Enter line"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
          
          {searchResults.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={toggleEditMode}
                className={`px-4 py-2 rounded-md ${
                  isEditing 
                    ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isEditing ? 'Cancel Edit' : 'Edit Data'}
              </button>
              
              {isEditing && (
                <button
                  onClick={handleSaveAll}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save All Changes'}
                </button>
              )}
            </div>
          )}
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded border border-red-200">
            {error}
          </div>
        )}
      </div>

      {/* Results Section */}
      {searchResults.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              Search Results ({searchResults.length} records found)
              <span className="ml-2 text-sm font-normal text-gray-500">
                Sorted by Row No
              </span>
            </h3>
            
            <div className="text-sm text-gray-600">
              Date: {searchParams.date} | Floor: {searchParams.floor} | Line: {searchParams.line}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Row No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Operator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Machine
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Process
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    SMV
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Hourly Production
                  </th>
                  {isEditing && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {editableData.map((item, rowIndex) => (
                  <React.Fragment key={item._id}>
                    <tr className={`hover:bg-gray-50 ${isEditing ? 'bg-blue-50' : ''}`}>
                      <td className="px-6 py-4 text-center font-bold">
                        {item.rowNo}
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="bg-blue-50 p-3 rounded">
                          <div className="font-medium">{item.operator?.name}</div>
                          <div className="text-sm text-gray-500">
                            ID: {item.operator?.operatorId}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="bg-green-50 p-3 rounded">
                          <div className="font-medium">{item.uniqueMachine}</div>
                          <div className="text-sm text-gray-500">
                            {item.machineType}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={item.process}
                            onChange={(e) => handleRowChange(rowIndex, 'process', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded"
                          />
                        ) : (
                          <div>{item.process}</div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <input
                            type="number"
                            value={item.target}
                            onChange={(e) => handleRowChange(rowIndex, 'target', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded"
                            min="0"
                          />
                        ) : (
                          <div className="font-medium">{item.target}</div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={item.smv}
                            onChange={(e) => handleRowChange(rowIndex, 'smv', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded"
                          />
                        ) : (
                          <div>{item.smv}</div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          Total: {item.hourlyProduction?.reduce((sum, hp) => sum + (hp.productionCount || 0), 0) || 0}
                          <br />
                          <span className="text-gray-500">
                            Hours: {item.hourlyProduction?.length || 0}
                          </span>
                        </div>
                      </td>
                      
                      {isEditing && (
                        <td className="px-6 py-4">
                          <button
                            onClick={() => addHourlySlot(rowIndex)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm mr-2"
                          >
                            Add Hour
                          </button>
                        </td>
                      )}
                    </tr>
                    
                    {/* Hourly Production Details */}
                    {item.hourlyProduction && item.hourlyProduction.length > 0 && (
                      <tr className="bg-gray-50">
                        <td colSpan={isEditing ? 8 : 7} className="px-6 py-4">
                          <div className="pl-8 border-l-4 border-blue-300">
                            <h4 className="font-medium mb-2">Hourly Production Details:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {item.hourlyProduction.map((hourly, hourIndex) => (
                                <div 
                                  key={hourIndex} 
                                  className="bg-white p-3 rounded border border-gray-200"
                                >
                                  <div className="flex justify-between items-center mb-2">
                                    <div className="font-medium">{hourly.hour}</div>
                                    {isEditing && (
                                      <button
                                        onClick={() => removeHourlySlot(rowIndex, hourIndex)}
                                        className="text-red-600 hover:text-red-800 text-sm"
                                      >
                                        Remove
                                      </button>
                                    )}
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <div>
                                      <label className="text-sm text-gray-600">Production:</label>
                                      {isEditing ? (
                                        <input
                                          type="number"
                                          value={hourly.productionCount || 0}
                                          onChange={(e) => handleHourlyChange(rowIndex, hourIndex, {
                                            productionCount: Number(e.target.value)
                                          })}
                                          className="w-full px-2 py-1 border border-gray-300 rounded mt-1"
                                          min="0"
                                        />
                                      ) : (
                                        <div className="font-medium">{hourly.productionCount || 0}</div>
                                      )}
                                    </div>
                                    
                                    {/* Defects section - you can expand this */}
                                    {hourly.defects && hourly.defects.length > 0 && (
                                      <div className="text-sm text-gray-500">
                                        Defects: {hourly.defects.length}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {searchResults.length === 0 && !isLoading && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Found</h3>
          <p className="text-gray-500">
            Use the search form above to find production data
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchProductions;