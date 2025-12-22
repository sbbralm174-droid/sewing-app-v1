// components/ProductionTable.jsx

"use client";

import React, { useState, useEffect, useMemo } from 'react';

const ProductionTable = ({
  tableData,
  highlightedRow,
  processes,
  breakdownProcesses,
  originalBreakdownProcesses,
  selectedFileId,
  isHeaderComplete,
  onAddRow,
  onRemoveRow,
  onCancelMachine,
  onRowChange,
  getBreakdownSelectionCount,
  isBreakdownDisabled,
  calculateTarget,
  floor
}) => {
  const [hours, setHours] = useState([]);
  const [hourlyInputs, setHourlyInputs] = useState({});
  const [isLoadingHours, setIsLoadingHours] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

  // Calculate production statistics - CORRECTED LOGIC
  const productionStats = useMemo(() => {
    // 1. ঘরের ক্রমিক numbering (প্রতিটি ঘরের জন্য, production বসুক বা না বসুক)
    const numberedHourlyInputs = {};
    let slotNumber = 0; // মোট ঘরের সংখ্যা
    
    // All possible hour slots (from fetched hours)
    const allHourSlots = hours || [];
    
    // প্রতিটি ঘরের জন্য ক্রমিক নম্বর দিন
    allHourSlots.forEach((hourSlot) => {
      // Check each row for this hour slot
      tableData.forEach(row => {
        const key = `${row.id}-${hourSlot}`;
        const value = hourlyInputs[key];
        
        slotNumber++; // প্রতিটি ঘরের জন্য একটি নম্বর
        
        // যদি এই ঘরে production বসে (value > 0)
        if (value && parseInt(value) > 0) {
          numberedHourlyInputs[key] = slotNumber; // ঘরের ক্রমিক নম্বর
        } else {
          numberedHourlyInputs[key] = 0; // খালি ঘর
        }
      });
    });
    
    // 2. সর্বশেষ কোন ঘরে production বসেছে
    let lastProductionNumber = 0;
    
    // সব ঘর চেক করে সর্বোচ্চ নম্বর যেখানে production বসেছে
    Object.keys(numberedHourlyInputs).forEach(key => {
      const number = numberedHourlyInputs[key];
      if (number > lastProductionNumber) {
        lastProductionNumber = number;
      }
    });
    
    // 3. Total Target = (সব row এর target যোগফল) × সর্বশেষ ঘর নম্বর
    const totalTargetValue = tableData.reduce((sum, row) => {
      const target = parseFloat(row.target) || 0;
      return sum + target;
    }, 0);
    
    const totalTarget = totalTargetValue * lastProductionNumber;
    
    // 4. Achievement = সব hourly inputs এর যোগফল
    const achievement = Object.keys(hourlyInputs).reduce((sum, key) => {
      const value = hourlyInputs[key] || '0';
      return sum + (parseInt(value) || 0);
    }, 0);
    
    // 5. Deviation
    const deviation = totalTarget - achievement;
    
    // 6. মোট কতটা ঘরে production বসেছে (শুধু production বসেছে এমন ঘর)
    const productionFilledSlots = Object.values(numberedHourlyInputs)
      .filter(num => num > 0).length;
    
    // 7. Production বসেছে এমন ঘরগুলোর নম্বর লিস্ট
    const productionSequence = [];
    for (let i = 1; i <= lastProductionNumber; i++) {
      const hasProduction = Object.values(numberedHourlyInputs).some(n => n === i);
      productionSequence.push({
        number: i,
        hasProduction
      });
    }
    
    return {
      numberedHourlyInputs,
      lastProductionNumber,
      totalTarget,
      achievement,
      deviation,
      totalSlots: slotNumber,
      productionFilledSlots,
      productionSequence,
      totalHourlyInputs: Object.keys(hourlyInputs).length,
      filledHourlyInputs: Object.values(hourlyInputs).filter(v => v && parseInt(v) > 0).length
    };
  }, [tableData, hourlyInputs, hours]);

  // floor পরিবর্তন হলে hours fetch করুন
  useEffect(() => {
    if (floor) {
      fetchHoursForFloor();
    }
  }, [floor]);

  // API থেকে hours fetch করার ফাংশন
  const fetchHoursForFloor = async () => {
    if (!floor) return;

    try {
      setIsLoadingHours(true);
      const response = await fetch('/api/hours');
      const data = await response.json();

      const filteredHours = data
        .filter(item => item.floor.toUpperCase() === floor.toUpperCase())
        .map(item => item.hour)
        .sort((a, b) => {
          const get24HourValue = (hourStr) => {
            const [range, modifier] = hourStr.split(' '); 
            let hour = parseInt(range.split('-')[0]);

            if (hour === 12) {
              hour = modifier === 'AM' ? 0 : 12;
            } else {
              if (modifier === 'PM') {
                hour += 12;
              }
            }
            return hour;
          };

          return get24HourValue(a) - get24HourValue(b);
        });

      setHours(filteredHours);

      const initialInputs = {};
      tableData.forEach(row => {
        filteredHours.forEach(hour => {
          initialInputs[`${row.id}-${hour}`] = '';
        });
      });
      setHourlyInputs(initialInputs);
      
    } catch (error) {
      console.error('Error fetching hours:', error);
    } finally {
      setIsLoadingHours(false);
    }
  };

  // tableData পরিবর্তন হলে hourly inputs আপডেট করুন
  useEffect(() => {
    if (hours.length > 0) {
      const updatedInputs = { ...hourlyInputs };
      let hasChanges = false;
      
      tableData.forEach(row => {
        hours.forEach(hour => {
          const key = `${row.id}-${hour}`;
          if (!(key in updatedInputs)) {
            updatedInputs[key] = '';
            hasChanges = true;
          }
        });
      });
      
      Object.keys(updatedInputs).forEach(key => {
        const [rowId, hour] = key.split('-');
        const rowExists = tableData.some(row => row.id.toString() === rowId);
        const hourExists = hours.includes(hour);
        
        if (!rowExists || !hourExists) {
          delete updatedInputs[key];
          hasChanges = true;
        }
      });
      
      if (hasChanges) {
        setHourlyInputs(updatedInputs);
      }
    }
  }, [tableData, hours]);

  // hourly input change handler
  const handleHourlyInputChange = (rowId, hour, value) => {
    const key = `${rowId}-${hour}`;
    setHourlyInputs(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // toggle row expansion
  const toggleRowExpansion = (rowId) => {
    setExpandedRow(expandedRow === rowId ? null : rowId);
  };

  // Helper function to render hourly inputs section for each row
  const renderHourlySection = (row) => {
    if (hours.length === 0) return null;

    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-medium text-gray-700">
            Hourly Production - Row {row.rowNumber}
            <span className="ml-2 text-xs text-blue-600">
              (Filled: {productionStats.filledHourlyInputs}/{productionStats.totalHourlyInputs})
            </span>
          </h4>
          <button
            onClick={() => setExpandedRow(null)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Close
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {hours.map(hour => {
            const key = `${row.id}-${hour}`;
            const inputNumber = productionStats.numberedHourlyInputs[key] || 0;
            const hasProduction = inputNumber > 0;
            
            return (
              <div key={key} className={`bg-white p-3 rounded border ${hasProduction ? 'border-blue-300' : 'border-gray-200'}`}>
                <div className="flex justify-between items-start mb-1">
                  <div className="text-xs font-medium text-gray-500">
                    {hour}
                  </div>
                  {hasProduction && (
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full">
                      #{inputNumber}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  value={hourlyInputs[key] || ''}
                  onChange={(e) => handleHourlyInputChange(row.id, hour, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Qty"
                  min="0"
                  disabled={!row.operator}
                />
                {!hasProduction && hourlyInputs[key] && parseInt(hourlyInputs[key]) > 0 && (
                  <div className="text-xs text-blue-500 mt-1 text-right">
                    Will be: #{productionStats.lastProductionNumber + 1}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Hourly total calculation */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-700">Total Production:</span>
            <span className="font-bold text-blue-600">
              {hours.reduce((total, hour) => {
                const value = hourlyInputs[`${row.id}-${hour}`] || '0';
                return total + (parseInt(value) || 0);
              }, 0)} pcs
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Helper function to render row content
  const renderRowContent = (row, index) => {
    const isBreakdownAllocated = row.breakdownProcess && (() => {
      const bp = originalBreakdownProcesses.find(b => b.process === row.breakdownProcess);
      const selectedCount = getBreakdownSelectionCount(row.breakdownProcess);
      const manpower = bp?.manPower || 1;
      return selectedCount >= manpower;
    })();

    return (
      <>
        <tr 
          key={row.id} 
          className={`
            hover:bg-gray-50 
            ${!row.operator ? 'bg-gray-50' : ''}
            ${row.operator && row.uniqueMachine ? 'bg-green-50' : ''}
            ${highlightedRow === index ? 'bg-yellow-100 animate-pulse' : ''}
            ${expandedRow === row.id ? 'border-b-0' : ''}
          `}
        >
          {/* Row Number */}
          <td className="px-6 py-4 text-center">
            <div className="font-bold text-gray-700">{index + 1}</div>
            {!row.operator && (
              <div className="text-xs text-gray-400 mt-1">Waiting for operator</div>
            )}
            {highlightedRow === index && (
              <div className="text-xs text-yellow-600 mt-1 animate-pulse">
                ✓ Process Selected
              </div>
            )}
          </td>

          {/* Operator */}
          <td className="px-6 py-4">
            {row.operator ? (
              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <div className="text-sm font-medium text-gray-900">
                  {row.operator.name}
                </div>
                <div className="text-sm text-gray-500">
                  ID: {row.operator.operatorId}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {row.operator.designation}
                </div>
              </div>
            ) : (
              <div className="text-center p-4">
                <div className="text-gray-400 text-sm mb-2">No Operator</div>
                <div className="text-xs text-gray-500">
                  Scan operator QR above
                </div>
              </div>
            )}
          </td>

          {/* Machine */}
          <td className="px-6 py-4">
            {row.uniqueMachine ? (
              <div className="bg-green-50 p-3 rounded border border-green-200">
                <div className="text-sm font-medium text-gray-900">
                  {row.uniqueMachine}
                </div>
                {row.machineType && (
                  <div className="text-xs text-gray-500 mt-1">
                    {row.machineType}
                  </div>
                )}
                <button
                  onClick={() => onCancelMachine(index)}
                  className="text-xs text-red-600 hover:text-red-800 mt-2"
                  title="Remove machine"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="text-center p-4">
                <div className="text-gray-400 text-sm mb-2">No Machine</div>
                {row.operator ? (
                  <div className="text-xs text-green-500">
                    Ready for machine scan
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">
                    Add operator first
                  </div>
                )}
              </div>
            )}
          </td>

          {/* Process */}
          <td className="px-6 py-4">
            <select
              value={row.process}
              onChange={(e) => onRowChange(index, "process", e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                row.operator ? 'border-gray-300' : 'border-gray-200 bg-gray-100'
              } ${highlightedRow === index ? 'ring-2 ring-yellow-400' : ''}`}
              disabled={!row.operator || row.breakdownProcess}
            >
              <option value="">Select Process</option>
              {row.operator && row.allowedProcesses && Object.keys(row.allowedProcesses).length > 0 ? (
                Object.keys(row.allowedProcesses).map((process) => (
                  <option key={process} value={process}>
                    {process}
                  </option>
                ))
              ) : (
                processes.map((process) => (
                  <option key={process._id} value={process._id}>
                    {process.name} {process.smv && `(SMV: ${process.smv})`}
                  </option>
                ))
              )}
            </select>
            
            {row.breakdownProcess && (
              <div className="text-xs text-gray-500 mt-1">
                <span className="text-orange-600">Breakdown process selected</span>
              </div>
            )}
          </td>

          {/* Breakdown Process */}
          <td className="px-6 py-4">
            <select
              value={row.breakdownProcess}
              onChange={(e) => onRowChange(index, "breakdownProcess", e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                row.operator ? 'border-gray-300' : 'border-gray-200 bg-gray-100'
              }`}
              disabled={!row.operator || !selectedFileId || row.process || breakdownProcesses.length === 0}
            >
              <option value="">Select Breakdown Process</option>
              {breakdownProcesses.map((bp) => {
                const selectedCount = getBreakdownSelectionCount(bp.process);
                const manpower = parseInt(bp.manPower) || 1;
                const isDisabled = isBreakdownDisabled(bp);
                
                return (
                  <option 
                    key={bp.id} 
                    value={bp.process}
                    disabled={isDisabled}
                    className={isDisabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}
                  >
                    {bp.process} 
                    <span className={`text-xs ml-2 ${isDisabled ? 'text-red-500' : 'text-gray-500'}`}>
                      (Man Power: {manpower})
                      {selectedCount > 0 && 
                        ` - Selected: ${selectedCount}/${manpower}`
                      }
                      {isDisabled && ' - Fully Allocated'}
                    </span>
                  </option>
                );
              })}
            </select>
            
            {row.process && (
              <div className="text-xs text-gray-500 mt-1">
                <span className="text-blue-600">Process selected</span>
              </div>
            )}
            
            {!selectedFileId && breakdownProcesses.length === 0 && (
              <div className="text-xs text-gray-400 mt-1">
                Select an Excel file to load breakdown processes
              </div>
            )}
            
            {row.breakdownProcess && (
              <div className="text-xs text-gray-500 mt-1">
                {(() => {
                  const bp = originalBreakdownProcesses.find(b => b.process === row.breakdownProcess);
                  const selectedCount = getBreakdownSelectionCount(row.breakdownProcess);
                  const manpower = bp?.manPower || 1;
                  const remaining = manpower - selectedCount;
                  
                  if (remaining <= 0) {
                    return <span className="text-red-600 font-medium">⚠️ Fully allocated ({selectedCount}/{manpower})</span>;
                  } else {
                    return <span className="text-green-600">✓ {remaining} slot(s) remaining ({selectedCount}/{manpower})</span>;
                  }
                })()}
              </div>
            )}
          </td>

          {/* SMV */}
          <td className="px-6 py-4">
            {row.selectedSMV ? (
              <div className={`p-2 rounded border ${row.selectedSMVType === 'process' ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
                <div className="text-sm font-medium text-gray-900">
                  {row.selectedSMV}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {row.selectedSMVType === 'process' ? 'From Process' : 'From Breakdown'}
                </div>
                {row.selectedSMV && (
                  <div className="text-xs text-green-600 mt-1">
                    Target: {calculateTarget(row.selectedSMV)} pcs/hour
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-2">
                <div className="text-gray-400 text-sm">N/A</div>
                <div className="text-xs text-gray-500">
                  Select process or breakdown
                </div>
              </div>
            )}
          </td>

          {/* Work As */}
          <td className="px-6 py-4">
            <select
              value={row.workAs}
              onChange={(e) => onRowChange(index, "workAs", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              disabled={!row.operator}
            >
              <option value="operator">Operator</option>
              <option value="helper">Helper</option>
            </select>
          </td>

          {/* Target */}
          <td className="px-6 py-4">
            <input
              type="number"
              value={row.target}
              onChange={(e) => onRowChange(index, "target", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Enter target"
              min="0"
              disabled={!row.operator}
            />
            
            {row.selectedSMV && (
              <div className="text-xs text-gray-600 mt-1">
                Auto-calculated: {calculateTarget(row.selectedSMV)} 
                <button
                  onClick={() => onRowChange(index, "target", calculateTarget(row.selectedSMV))}
                  className="text-blue-600 hover:text-blue-800 ml-2"
                  title="Use calculated target"
                >
                  Use
                </button>
              </div>
            )}
            
            {row.allowedProcesses && row.process && row.allowedProcesses[row.process] && (
              <button
                onClick={() => onRowChange(index, "target", row.allowedProcesses[row.process])}
                className="text-xs text-blue-600 hover:text-blue-800 mt-1 block"
                title="Use suggested target"
              >
                Use suggested: {row.allowedProcesses[row.process]}
              </button>
            )}
          </td>

          {/* Hourly Section Toggle Button */}
          <td className="px-6 py-4">
            <button
              onClick={() => toggleRowExpansion(row.id)}
              className={`px-3 py-1 rounded text-sm font-medium ${
                expandedRow === row.id 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              {expandedRow === row.id ? 'Hide Hours' : 'Show Hours'}
            </button>
          </td>

          {/* Actions */}
          <td className="px-6 py-4">
            <button
              onClick={() => onRemoveRow(index)}
              className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 text-sm font-medium"
              disabled={tableData.length <= 1}
            >
              Remove
            </button>
          </td>
        </tr>
        
        {/* Hourly Inputs Section - Expanded View */}
        {expandedRow === row.id && (
          <tr className="bg-blue-50">
            <td colSpan={10} className="p-0">
              {renderHourlySection({...row, rowNumber: index + 1})}
            </td>
          </tr>
        )}
      </>
    );
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            Operator Production Details
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({tableData.length} rows)
            </span>
            {selectedFileId && (
              <span className="ml-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                Breakdown processes available
              </span>
            )}
            {floor && (
              <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                Floor: {floor} - Hours: {hours.length}
              </span>
            )}
            {isLoadingHours && (
              <span className="ml-2 text-xs text-gray-500">
                Loading hours...
              </span>
            )}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={onAddRow}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm flex items-center gap-1"
              disabled={!isHeaderComplete}
            >
              <span>+</span> Add New Row
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {tableData.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Operators Added Yet</h3>
              <p className="text-gray-500 mb-4">
                {isHeaderComplete 
                  ? "Scan operator QR code in the scanner section above" 
                  : "Complete header fields first to enable scanning"}
              </p>
            </div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Row
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Operator
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Machine
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Process
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Breakdown Process
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SMV
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Work As
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Target
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tableData.map((row, index) => renderRowContent(row, index))}
                </tbody>
              </table>
              
              {/* Production Stats Section - CORRECTED */}
              <div className="bg-gray-50 p-4 border-t border-gray-200">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="text-sm text-gray-700">
                    <span className="font-semibold">Production Sequence: </span>
                    {productionStats.lastProductionNumber > 0 ? (
                      <span className="font-bold text-blue-600">
                        {productionStats.productionSequence.map((slot, idx) => (
                          <span key={slot.number}>
                            <span className={slot.hasProduction ? 'text-blue-600' : 'text-gray-400'}>
                              {slot.number}
                              {!slot.hasProduction && <span className="text-gray-300 text-xs ml-1">(empty)</span>}
                            </span>
                            {idx < productionStats.productionSequence.length - 1 && ', '}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span className="text-gray-500">No production inputs yet</span>
                    )}
                    <span className="ml-4 text-gray-600">
                      (Last Input: <span className="font-bold">#{productionStats.lastProductionNumber || 0}</span>)
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="text-sm">
                      <span className="font-semibold text-gray-700">Total Target: </span>
                      <span className="font-bold text-blue-600">
                        {productionStats.totalTarget.toLocaleString()}
                        <span className="text-xs text-gray-500 ml-1">
                          (Sum Targets: {tableData.reduce((sum, row) => sum + (parseFloat(row.target) || 0), 0).toLocaleString()} × Last Input: {productionStats.lastProductionNumber})
                        </span>
                      </span>
                    </div>
                    
                    <div className="text-sm">
                      <span className="font-semibold text-gray-700">Achievement: </span>
                      <span className="font-bold text-green-600">
                        {productionStats.achievement.toLocaleString()}
                        <span className="text-xs text-gray-500 ml-1">
                          ({productionStats.filledHourlyInputs} inputs)
                        </span>
                      </span>
                    </div>
                    
                    <div className="text-sm">
                      <span className="font-semibold text-gray-700">Deviation: </span>
                      <span className={`font-bold ${productionStats.deviation > 0 ? 'text-red-600' : productionStats.deviation < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                        {productionStats.deviation.toLocaleString()}
                        {productionStats.deviation > 0 && ' (Behind)'}
                        {productionStats.deviation < 0 && ' (Ahead)'}
                        {productionStats.deviation === 0 && ' (On Track)'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ProductionTable;