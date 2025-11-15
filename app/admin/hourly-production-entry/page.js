// app/admin/hourly-production-entry/page.js (fixed)

'use client'

import Layout from '@/components/Layout';
import React, { useState, useEffect, useRef } from 'react';
import SidebarNavLayout from '@/components/SidebarNavLayout';

const App = () => {
  const [date, setDate] = useState('');
  const [floor, setFloor] = useState('');
  const [line, setLine] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [hourlyData, setHourlyData] = useState({});
  const [defectsData, setDefectsData] = useState({});
  const [defectCounts, setDefectCounts] = useState({});
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [expandedOperator, setExpandedOperator] = useState(null);
  const [floorLines, setFloorLines] = useState([]);
  const [filteredLines, setFilteredLines] = useState([]);
  const [defectsList, setDefectsList] = useState([]);
  const [activeHour, setActiveHour] = useState(null);
  
  // Refs for production inputs and defects containers
  const productionInputRefs = useRef({});
  const defectsContainerRefs = useRef({});

  // Fetch defects list
  useEffect(() => {
    const fetchDefects = async () => {
      try {
        const response = await fetch('/api/defects');
        if (response.ok) {
          const data = await response.json();
          setDefectsList(data);
        } else {
          setDefectsList([
            { _id: '1', name: 'Stitch Problem', code: 'STCH' },
            { _id: '2', name: 'Fabric Hole', code: 'HOLE' },
            { _id: '3', name: 'Color Issue', code: 'CLR' },
            { _id: '4', name: 'Size Problem', code: 'SZ' },
            { _id: '5', name: 'Print Defect', code: 'PRNT' }
          ]);
        }
      } catch (err) {
        console.error('Failed to fetch defects:', err);
        setDefectsList([
          { _id: '1', name: 'Stitch Problem', code: 'STCH' },
          { _id: '2', name: 'Fabric Hole', code: 'HOLE' },
          { _id: '3', name: 'Color Issue', code: 'CLR' },
          { _id: '4', name: 'Size Problem', code: 'SZ' },
          { _id: '5', name: 'Print Defect', code: 'PRNT' }
        ]);
      }
    };
    fetchDefects();
  }, []);

  useEffect(() => {
    const fetchFloorLines = async () => {
      try {
        const response = await fetch('/api/floor-lines');
        if (!response.ok) throw new Error('Failed to fetch floor and line data');
        const data = await response.json();
        setFloorLines(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load floor and line data');
      }
    };
    fetchFloorLines();
  }, []);

  useEffect(() => {
    if (floor) {
      const linesForFloor = floorLines
        .filter(item => item.floor?.floorName === floor)
        .map(item => item.lineNumber);
      setFilteredLines(linesForFloor);
      setLine('');
    } else {
      setFilteredLines([]);
      setLine('');
    }
  }, [floor, floorLines]);

 
  useEffect(() => {
    const handleClickOutside = (event) => {
      
      const isInsideDefects = Object.values(defectsContainerRefs.current).some(
        ref => ref && ref.contains(event.target)
      );
      
      
      const isInsideInputs = Object.values(productionInputRefs.current).some(
        ref => ref && ref.contains(event.target)
      );

      
      if (!isInsideDefects && !isInsideInputs) {
        setActiveHour(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchTimeSlotsByFloor = async (selectedFloor) => {
    try {
      const response = await fetch(`/api/hours?floor=${selectedFloor}`);
      if (!response.ok) throw new Error('Failed to fetch time slots');
      const data = await response.json();
      const slots = data.map(report => report.hour);
      setTimeSlots(slots);
      return slots;
    } catch (err) {
      console.error(err.message);
      setError('Failed to load time slots.');
      const fallbackSlots = ['8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM'];
      setTimeSlots(fallbackSlots);
      return fallbackSlots;
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!date || !floor || !line) {
      setError('Please fill in the date, floor, and line.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    setSearchResults([]);
    setHourlyData({});
    setDefectsData({});
    setDefectCounts({});
    setExpandedOperator(null);
    setActiveHour(null);

    try {
      const slots = await fetchTimeSlotsByFloor(floor);
      
      const response = await fetch(`/api/daily-production/search?date=${date}&floor=${floor}&line=${line}`);
      if (!response.ok) throw new Error('Failed to fetch the requested data');
      const results = await response.json();

      if (results.length === 0) {
        setError('No data found for these criteria.');
      } else {
        setSearchResults(results);
        
        const initialHourlyData = {};
        const initialDefectsData = {};
        const initialDefectCounts = {};
        
        results.forEach(report => {
          const currentHourlyData = {};
          const currentDefectsData = {};
          const currentDefectCounts = {};

          slots.forEach(hour => {
            const existingHourData = (report.hourlyProduction || []).find(h => h.hour === hour);
            
            currentHourlyData[hour] = existingHourData ? parseInt(existingHourData.productionCount, 10) || 0 : 0;
            
            currentDefectsData[hour] = existingHourData ? (existingHourData.defects || []) : [];
            
            currentDefectCounts[hour] = {};
            if (existingHourData && existingHourData.defects) {
              existingHourData.defects.forEach(defect => {
                currentDefectCounts[hour][defect.defectId] = defect.count || 0; // Default to 1 instead of 0
              });
            }
            
            defectsList.forEach(defect => {
              if (!currentDefectCounts[hour][defect._id]) {
                currentDefectCounts[hour][defect._id] = 0; 
              }
            });
          });

          initialHourlyData[report._id] = currentHourlyData;
          initialDefectsData[report._id] = currentDefectsData;
          initialDefectCounts[report._id] = currentDefectCounts;
        });
        
        setHourlyData(initialHourlyData);
        setDefectsData(initialDefectsData);
        setDefectCounts(initialDefectCounts);
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during the search.');
    } finally {
      setLoading(false);
    }
  };

  const handleHourlyChange = (reportId, hour, value) => {
    setHourlyData(prev => ({
      ...prev,
      [reportId]: {
        ...prev[reportId],
        [hour]: value,
      },
    }));
  };

  
const handleDefectCountChange = (reportId, hour, defectId, value) => {
  // Parse the input value
  const inputValue = parseInt(value) || 0;
  
  // Apply your logic: if 0, store as 0 but will send 1 to server later
  // If more than 0, store and send the actual value
  const count = Math.max(0, inputValue);
  
  setDefectCounts(prev => ({
    ...prev,
    [reportId]: {
      ...prev[reportId],
      [hour]: {
        ...prev[reportId]?.[hour],
        [defectId]: count
      }
    }
  }));

  setDefectsData(prev => {
    const currentDefects = prev[reportId]?.[hour] || [];
    const defectExists = currentDefects.some(d => d.defectId === defectId);
    
    let updatedDefects;
    if (defectExists) {
      updatedDefects = currentDefects.map(defect => 
        defect.defectId === defectId 
          ? { ...defect, count: count }
          : defect
      );
    } else {
      const defect = defectsList.find(d => d._id === defectId);
      if (defect) {
        updatedDefects = [...currentDefects, {
          defectId: defect._id,
          name: defect.name,
          code: defect.code,
          count: count
        }];
      } else {
        updatedDefects = currentDefects;
      }
    }

    return {
      ...prev,
      [reportId]: {
        ...prev[reportId],
        [hour]: updatedDefects
      }
    };
  });
};

  const handleDefectChange = (reportId, hour, defect, isChecked) => {
    setDefectsData(prev => {
      const currentDefects = prev[reportId]?.[hour] || [];
      
      let updatedDefects;
      if (isChecked) {
        if (!currentDefects.some(d => d.defectId === defect._id)) {
          updatedDefects = [...currentDefects, {
            defectId: defect._id,
            name: defect.name,
            code: defect.code,
            count: getDefectCount(reportId, hour, defect._id)
          }];
        } else {
          updatedDefects = currentDefects;
        }
      } else {
        updatedDefects = currentDefects.filter(d => d.defectId !== defect._id);
      }

      return {
        ...prev,
        [reportId]: {
          ...prev[reportId],
          [hour]: updatedDefects
        }
      };
    });
  };

  const isDefectSelected = (reportId, hour, defect) => {
    const currentDefects = defectsData[reportId]?.[hour] || [];
    return currentDefects.some(d => d.defectId === defect._id);
  };

  const getDefectCount = (reportId, hour, defectId) => {
    return defectCounts[reportId]?.[hour]?.[defectId] || 0;
  };

  // app/admin/hourly-production-entry/page.js - handleHourlySubmit function-এর ভিতরে
const handleHourlySubmit = async (reportId) => {
  setLoading(true);
  setError(null);
  setSuccess(null);

  try {
    const report = searchResults.find(r => r._id === reportId);
    const dataToSubmit = timeSlots.map(hour => ({
      hour: hour,
      productionCount: parseInt(hourlyData[reportId]?.[hour], 10) || 0,
      processName: report.process, // ✅ processName যোগ করুন
      productionDate: report.date, // ✅ date যোগ করুন
      defects: (defectsData[reportId]?.[hour] || []).map(defect => ({
        defectId: defect.defectId,
        name: defect.name,
        code: defect.code,
        count: (defect.count === 0 ? 1 : defect.count)
      }))
    }));

    const response = await fetch('/api/daily-production/update-hourly', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: reportId, hourlyProduction: dataToSubmit })
    });

    if (!response.ok) throw new Error('Failed to submit the report');
    setSuccess('Hourly report saved successfully!');
    setSearchResults(prevResults => prevResults.map(report =>
      report._id === reportId
        ? { ...report, hourlyProduction: dataToSubmit }
        : report
    ));
  } catch (err) {
    console.error(err);
    setError('An error occurred while saving the report.');
  } finally {
    setLoading(false);
  }
};

  const toggleOperatorForm = (operatorId) => {
    setExpandedOperator(expandedOperator === operatorId ? null : operatorId);
    setActiveHour(null);
  };

  const handleProductionInputClick = (hour) => {
    setActiveHour(hour);
  };

  const setProductionInputRef = (hour, element) => {
    productionInputRefs.current[hour] = element;
  };

  const setDefectsContainerRef = (hour, element) => {
    defectsContainerRefs.current[hour] = element;
  };

  const uniqueFloors = [...new Set(floorLines.map(item => item.floor?.floorName).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8 font-sans">
      <SidebarNavLayout />
      <div className="container mx-auto max-w-7xl">
        <div className="bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
          <h1 className="text-4xl font-bold text-center text-blue-400 mb-2">Production Management System</h1>
          <p className="text-center text-gray-400 mb-6">Enter details to search for a daily report and submit hourly data.</p>
          
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="bg-gray-700 text-gray-200 border-none rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <select
              value={floor}
              onChange={e => setFloor(e.target.value)}
              className="bg-gray-700 text-gray-200 border-none rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            >
              <option value="">Select Floor</option>
              {uniqueFloors.map(floorName => (
                <option key={floorName} value={floorName}>{floorName}</option>
              ))}
            </select>
            <select
              value={line}
              onChange={e => setLine(e.target.value)}
              className="bg-gray-700 text-gray-200 border-none rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
              required
              disabled={!floor}
            >
              <option value="">Select Line</option>
              {filteredLines.map(lineNumber => (
                <option key={lineNumber} value={lineNumber}>{lineNumber}</option>
              ))}
            </select>
            <button
              type="submit"
              className="md:col-span-3 bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-300 transform hover:scale-105 disabled:bg-gray-500"
              disabled={loading || !date || !floor || !line}
            >
              {loading ? 'Searching...' : 'Search Daily Report'}
            </button>
          </form>

          {error && <div className="bg-red-500 text-white p-4 rounded-lg text-center mb-6">{error}</div>}
          {success && <div className="bg-green-500 text-white p-4 rounded-lg text-center mb-6">{success}</div>}
        </div>

        {searchResults.length > 0 && timeSlots.length > 0 && (
          <div className="bg-gray-800 rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-semibold text-blue-400 mb-6">Search Results</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-gray-700 rounded-lg overflow-hidden">
                <thead className="bg-gray-600 text-gray-200">
                  <tr>
                    <th className="py-3 px-4 text-left">Operator ID</th>
                    <th className="py-3 px-4 text-left">Operator Name</th>
                    <th className="py-3 px-4 text-left">Unique Machine</th>
                    <th className="py-3 px-4 text-left">Target</th>
                    <th className="py-3 px-4 text-left">Process</th>
                    <th className="py-3 px-4 text-left">Total Production</th>
                    <th className="py-3 px-4 text-left">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-600">
                  {searchResults.map(report => (
                    <React.Fragment key={report._id}>
                      <tr className="hover:bg-gray-600 transition-colors">
                        <td className="py-3 px-4">{report.operator.operatorId}</td>
                        <td className="py-3 px-4">{report.operator.name}</td>
                        <td className="py-3 px-4">{report.uniqueMachine}</td>
                        <td className="py-3 px-4">{report.target}</td>
                        <td className="py-3 px-4">{report.process}</td>
                        <td className="py-3 px-4">{
                          (report.hourlyProduction || []).reduce((sum, h) => sum + (parseInt(h.productionCount, 10) || 0), 0)
                        }</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => toggleOperatorForm(report._id)}
                            className="bg-green-600 text-white font-bold py-1 px-3 rounded-lg hover:bg-green-700 transition duration-300 text-sm"
                          >
                            {expandedOperator === report._id ? 'Hide Form' : 'Add Hourly Production'}
                          </button>
                        </td>
                      </tr>
                      {expandedOperator === report._id && (
                        <tr>
                          <td colSpan="6" className="p-4 bg-gray-700">
                            <div className="mt-4">
                              <h3 className="text-xl font-bold text-blue-400 mb-4 text-center">
                                {report.operator.name}&apos;s Hourly Production & Defects Report
                              </h3>
                              
                              <div className="bg-gray-600 rounded-lg p-6 shadow-md mb-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                  {timeSlots.map(hour => (
                                    <div key={hour} className="space-y-4 relative">
                                      <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-lg font-semibold text-yellow-400">{hour}</h4>
                                        <span className="text-sm text-gray-300 bg-gray-700 px-2 py-1 rounded">
                                          Defects: {defectsData[report._id]?.[hour]?.length || 0}
                                        </span>
                                      </div>
                                      
                                      {/* Production Count */}
                                      <div className="mb-4">
                                        <label className="block text-gray-300 mb-2 text-sm font-medium">
                                          Production Count
                                        </label>
                                        <input
                                          ref={(el) => setProductionInputRef(hour, el)}
                                          type="number"
                                          value={hourlyData[report._id]?.[hour] || ''}
                                          onChange={e => handleHourlyChange(report._id, hour, e.target.value)}
                                          onClick={() => handleProductionInputClick(hour)}
                                          className="bg-gray-800 text-gray-100 border border-gray-600 rounded-md p-3 w-full focus:ring-2 focus:ring-blue-500 outline-none"
                                          placeholder="Enter production"
                                          
                                        />
                                      </div>

                                      {/* Defects Selection - Only show for active hour */}
                                      {activeHour === hour && (
                                        <div 
                                          ref={(el) => setDefectsContainerRef(hour, el)}
                                          className="animate-fadeIn absolute left-0 right-0 z-10 bg-gray-700 border border-gray-500 rounded-lg shadow-xl p-4 mt-2"
                                        >
                                          <label className="block text-gray-300 mb-2 text-sm font-medium">
                                            Select Defects for {hour}
                                          </label>
                                          <div className="max-h-40 overflow-y-auto bg-gray-800 rounded-md p-3 border border-gray-600">
                                            <div className="space-y-2">
                                              {defectsList.map(defect => (
                                                <div key={defect._id} className="flex items-center justify-between p-1 hover:bg-gray-700 rounded">
                                                  <label className="flex items-center space-x-2 flex-1 cursor-pointer">
                                                    <input
                                                      type="checkbox"
                                                      checked={isDefectSelected(report._id, hour, defect)}
                                                      onChange={(e) => handleDefectChange(
                                                        report._id,
                                                        hour,
                                                        defect,
                                                        e.target.checked
                                                      )}
                                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                                                    />
                                                    <span className="text-gray-300 text-xs">
                                                      {defect.name} ({defect.code})
                                                    </span>
                                                  </label>
                                                  
                                                  {/* Fixed defect count input */}
                                                  <input 
                                                    type="number"
                                                    value={getDefectCount(report._id, hour, defect._id)}
                                                    onChange={(e) => handleDefectCountChange(
                                                      report._id,
                                                      hour,
                                                      defect._id,
                                                      e.target.value
                                                    )}
                                                    onBlur={(e) => {
                                                     
                                                      if (!e.target.value || parseInt(e.target.value) < 0) {
                                                        handleDefectCountChange(report._id, hour, defect._id, 0);
                                                      }
                                                    }}
                                                    disabled={!isDefectSelected(report._id, hour, defect)}
                                                    className="ml-1 px-1 py-0.5 bg-gray-700 text-white text-xs rounded w-12 border border-gray-600 disabled:bg-gray-800 disabled:text-gray-500"
                                                  />
                                                </div>
                                              ))}
                                            </div>
                                          </div>

                                          {defectsData[report._id]?.[hour]?.length > 0 && (
                                            <div className="mt-2 p-2 bg-gray-800 rounded-md">
                                              <p className="text-xs text-gray-300 mb-1">Selected Defects:</p>
                                              <div className="flex flex-wrap gap-1">
                                                {defectsData[report._id]?.[hour].map((defect, index) => (
                                                  <span
                                                    key={index}
                                                    className="bg-red-600 text-white text-xs px-1 py-0.5 rounded-full flex items-center space-x-1"
                                                  >
                                                    <span>{defect.name}</span>
                                                    <span className="bg-red-700 px-0.5 rounded text-xs">{getDefectCount(report._id, hour, defect.defectId)}</span>
                                                  </span>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>

                                <button
                                  onClick={() => handleHourlySubmit(report._id)}
                                  className="mt-6 w-full bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition duration-300 disabled:bg-gray-500"
                                  disabled={loading}
                                >
                                  {loading ? 'Saving...' : 'Save Hourly Report'}
                                </button>
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
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default App;

