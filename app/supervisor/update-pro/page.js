// app/page.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Save, Loader2, RefreshCw, ChevronDown, X, Plus, Minus, Eye, EyeOff, AlertTriangle } from 'lucide-react';

export default function DailyProductionPage() {
  const [searchParams, setSearchParams] = useState({
    date: new Date().toISOString().split('T')[0],
    floor: '',
    line: ''
  });
  
  const [productionData, setProductionData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [floors, setFloors] = useState([]);
  const [lines, setLines] = useState([]);
  
  // New states for file upload and dropdowns
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [fileData, setFileData] = useState(null);
  const [machines, setMachines] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [showBreakdownDropdown, setShowBreakdownDropdown] = useState(null);
  const [showMachineDropdown, setShowMachineDropdown] = useState(null);
  const [showProcessDropdown, setShowProcessDropdown] = useState(null);
  
  // Search states for dropdowns
  const [breakdownSearch, setBreakdownSearch] = useState('');
  const [machineSearch, setMachineSearch] = useState('');
  const [processSearch, setProcessSearch] = useState('');

  // Hours data state
  const [hours, setHours] = useState([]);
  const [filteredHours, setFilteredHours] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});

  // State to track breakdown process counts and manPower
  const [breakdownProcessCounts, setBreakdownProcessCounts] = useState({});
  const [breakdownProcessManPower, setBreakdownProcessManPower] = useState({});

  // Work As dropdown options
  const workAsOptions = ['Operator', 'Helper'];
  
  // State for showing/hiding breakdown process status
  const [showBreakdownStatus, setShowBreakdownStatus] = useState(false);

  // Track duplicate rowNos
  const [duplicateRowNos, setDuplicateRowNos] = useState({});
  const [duplicateWarnings, setDuplicateWarnings] = useState({});

  // Fetch floors from API
  const fetchFloors = async () => {
    try {
      const response = await fetch('/api/floors');
      if (!response.ok) throw new Error('Failed to fetch floors');
      
      const result = await response.json();
      if (result.success) {
        setFloors(result.data);
      }
    } catch (error) {
      console.error('Error fetching floors:', error);
    }
  };

  // Fetch lines based on selected floor
  const fetchLinesByFloor = async (floorId) => {
    if (!floorId) return;
    
    try {
      const response = await fetch(`/api/floor-lines?floorId=${floorId}`);
      if (!response.ok) throw new Error('Failed to fetch lines');
      
      const data = await response.json();
      setLines(data);
    } catch (error) {
      console.error('Error fetching lines:', error);
    }
  };

  // Filtered data based on search
  const filteredFileData = fileData?.data?.filter(item => 
    item.process?.toLowerCase().includes(breakdownSearch.toLowerCase()) ||
    item.mcTypeHp?.toLowerCase().includes(breakdownSearch.toLowerCase())
  ) || [];

  const filteredMachines = machines.filter(machine =>
    machine.uniqueId?.toLowerCase().includes(machineSearch.toLowerCase()) ||
    machine.currentStatus?.toLowerCase().includes(machineSearch.toLowerCase()) ||
    machine.lastLocation?.line?.toLowerCase().includes(machineSearch.toLowerCase())
  );

  const filteredProcesses = processes.filter(process =>
    process.name?.toLowerCase().includes(processSearch.toLowerCase()) ||
    process.code?.toLowerCase().includes(processSearch.toLowerCase()) ||
    process.machineType?.toLowerCase().includes(processSearch.toLowerCase())
  );

  // Calculate counts for live display
  const calculateProcessCounts = () => {
    let mainProcessCount = 0;
    let breakdownProcessCount = 0;
    
    productionData.forEach(item => {
      if (item.process && item.process.trim() !== '') {
        mainProcessCount++;
      }
      if (item.breakdownProcess && item.breakdownProcess.trim() !== '') {
        breakdownProcessCount++;
      }
    });
    
    return { mainProcessCount, breakdownProcessCount };
  };

  const processCounts = calculateProcessCounts();

  // Calculate breakdown process counts and get all available processes
  useEffect(() => {
    const counts = {};
    const manPowerMap = {};
    
    // First, store all available processes from fileData
    if (fileData?.data) {
      fileData.data.forEach(item => {
        const processName = item.process;
        if (processName && !manPowerMap[processName]) {
          manPowerMap[processName] = parseInt(item.manPower) || 0;
        }
      });
    }
    
    // Count how many times each breakdown process is selected in the table
    productionData.forEach(item => {
      if (item.breakdownProcess && item.breakdownProcess.trim() !== '') {
        const processName = item.breakdownProcess;
        counts[processName] = (counts[processName] || 0) + 1;
      }
    });
    
    setBreakdownProcessCounts(counts);
    setBreakdownProcessManPower(manPowerMap);
  }, [productionData, fileData]);

  // Check if a breakdown process should be disabled
  const isBreakdownProcessDisabled = (processName) => {
    const count = breakdownProcessCounts[processName] || 0;
    const manPower = breakdownProcessManPower[processName] || 0;
    
    // If manPower is 0 or not defined, don't disable
    if (manPower <= 0) return false;
    
    // Disable if count is greater than or equal to manPower
    return count >= manPower;
  };

 // Check for duplicate rowNos
const checkDuplicateRowNos = (data) => {
  const rowNoCounts = {};
  const duplicates = {};
  const warnings = {};
  
  data.forEach((item, index) => {
    const rowNo = item.rowNo;
    
    // Check if rowNo exists and is a string
    if (rowNo !== null && rowNo !== undefined) {
      // Convert to string if it's not already
      const rowNoStr = typeof rowNo === 'string' ? rowNo : String(rowNo);
      
      // Trim only if it's a string
      const trimmedRowNo = typeof rowNoStr === 'string' ? rowNoStr.trim() : rowNoStr;
      
      if (trimmedRowNo && trimmedRowNo !== '') {
        if (!rowNoCounts[trimmedRowNo]) {
          rowNoCounts[trimmedRowNo] = [index];
        } else {
          rowNoCounts[trimmedRowNo].push(index);
        }
      }
    }
  });
  
  // Mark duplicates
  Object.keys(rowNoCounts).forEach(rowNo => {
    if (rowNoCounts[rowNo].length > 1) {
      rowNoCounts[rowNo].forEach(index => {
        duplicates[index] = rowNo;
      });
    }
  });
  
  setDuplicateRowNos(duplicates);
  
  // Generate warnings
  Object.keys(rowNoCounts).forEach(rowNo => {
    if (rowNoCounts[rowNo].length > 1) {
      warnings[rowNo] = `Row No "${rowNo}" appears ${rowNoCounts[rowNo].length} times`;
    }
  });
  
  setDuplicateWarnings(warnings);
};

  // Handle rowNo change with duplicate check
  const handleRowNoChange = (index, value) => {
    const updatedData = [...productionData];
    
    // Update rowNo
    updatedData[index].rowNo = value;
    
    setProductionData(updatedData);
    
    // Check for duplicates after a short delay
    setTimeout(() => {
      checkDuplicateRowNos(updatedData);
    }, 100);
  };

  // Handle breakdown process selection from uploaded file
  const handleBreakdownSelect = (index, excelProcess) => {
    const currentProcessName = excelProcess.process;
    const manPower = parseInt(excelProcess.manPower) || 0;
    
    // Check if process is already at max capacity
    if (isBreakdownProcessDisabled(currentProcessName)) {
      setMessage({ 
        type: 'error', 
        text: `This process (${currentProcessName}) has already reached its man power limit of ${manPower}` 
      });
      return;
    }
    
    const updatedData = [...productionData];
    
    // Set breakdown process
    updatedData[index].breakdownProcess = currentProcessName;
    
    // Clear main process field when breakdown is selected
    updatedData[index].process = '';
    
    // Set SMV from excel file data
    const smvValue = parseFloat(excelProcess.smv) || 0;
    updatedData[index].smv = smvValue;
    
    // Calculate target based on SMV (Target = 60 / SMV)
    if (smvValue > 0) {
      updatedData[index].target = Math.round((60 / smvValue) * 100) / 100;
    }
    
    setProductionData(updatedData);
    setShowBreakdownDropdown(null);
    setBreakdownSearch('');
    setMessage({ type: 'success', text: `Process "${currentProcessName}" selected (Man Power: ${manPower})` });
  };

  // Handle input changes in table
  const handleInputChange = (index, field, value) => {
    const updatedData = [...productionData];
    
    // If clearing breakdown process, we need to handle it specially
    if (field === 'breakdownProcess' && value === '') {
      // Get the current process name before clearing
      const currentProcess = updatedData[index].breakdownProcess;
      
      // Update the field
      updatedData[index][field] = value;
      
      // Clear the message
      if (message.text.includes(currentProcess)) {
        setMessage({ type: '', text: '' });
      }
    } else if (field === 'process' && value.trim() !== '') {
      // Clear breakdown process when main process is manually entered
      const currentProcess = updatedData[index].breakdownProcess;
      updatedData[index].breakdownProcess = '';
      updatedData[index].process = value;
      
      // Clear the message if it was about the cleared breakdown process
      if (currentProcess && message.text.includes(currentProcess)) {
        setMessage({ type: '', text: '' });
      }
    } else {
      updatedData[index][field] = value;
    }
    
    // Calculate target if SMV changes
    if (field === 'smv') {
      const smv = parseFloat(value) || 0;
      if (smv > 0) {
        // Calculate target: 60 / SMV
        updatedData[index].target = Math.round((60 / smv) * 100) / 100; // Round to 2 decimal places
      }
    }
    
    setProductionData(updatedData);
  };

  // Handle Work As selection
  const handleWorkAsSelect = (index, value) => {
    const updatedData = [...productionData];
    updatedData[index].workAs = value;
    setProductionData(updatedData);
  };

  // Handle hourly production input change - convert to array format
  const handleHourlyProductionChange = (rowIndex, hourName, value) => {
    const updatedData = [...productionData];
    
    // Ensure hourlyProduction is an array
    if (!Array.isArray(updatedData[rowIndex].hourlyProduction)) {
      updatedData[rowIndex].hourlyProduction = [];
    }
    
    // Find if hour already exists
    const hourIndex = updatedData[rowIndex].hourlyProduction.findIndex(
      hp => hp.hour === hourName
    );
    
    if (hourIndex >= 0) {
      // Update existing hour
      if (value === '' || value === null) {
        // Remove if empty
        updatedData[rowIndex].hourlyProduction.splice(hourIndex, 1);
      } else {
        updatedData[rowIndex].hourlyProduction[hourIndex].productionCount = Number(value);
      }
    } else if (value !== '' && value !== null) {
      // Add new hour entry
      updatedData[rowIndex].hourlyProduction.push({
        hour: hourName,
        productionCount: Number(value),
        defects: []
      });
    }
    
    setProductionData(updatedData);
  };

  // Get hourly production value for a specific hour
  const getHourlyValue = (rowIndex, hourName) => {
    const row = productionData[rowIndex];
    if (!row || !Array.isArray(row.hourlyProduction)) return '';
    
    const hourEntry = row.hourlyProduction.find(hp => hp.hour === hourName);
    return hourEntry ? hourEntry.productionCount.toString() : '';
  };

  // Calculate total for a row - updated for array format
  const calculateRowTotal = (rowIndex) => {
    const row = productionData[rowIndex];
    if (!row || !Array.isArray(row.hourlyProduction)) return 0;
    
    return row.hourlyProduction.reduce((total, hp) => {
      return total + (hp.productionCount || 0);
    }, 0);
  };

  // Fetch hours data based on selected floor
  const fetchHoursByFloor = async (floorName) => {
    if (!floorName) return;
    
    try {
      const response = await fetch(`/api/hours?floor=${floorName}`);
      if (!response.ok) throw new Error('Failed to fetch hours');
      
      const data = await response.json();
      
      // Sort hours by time order (AM first, then PM in ascending order)
      const sortedHours = data.sort((a, b) => {
        // Extract time and period
        const getTimeValue = (hourStr) => {
          const [timeRange, period] = hourStr.split(' ');
          const [start] = timeRange.split('-');
          let hour = parseInt(start);
          
          // Convert to 24-hour format for comparison
          if (period === 'PM' && hour !== 12) hour += 12;
          if (period === 'AM' && hour === 12) hour = 0;
          
          return hour;
        };
        
        return getTimeValue(a.hour) - getTimeValue(b.hour);
      });
      
      // Limit to 15 hours maximum
      const limitedHours = sortedHours.slice(0, 15);
      
      setHours(limitedHours);
      setFilteredHours(limitedHours);
    } catch (error) {
      console.error('Error fetching hours:', error);
      setHours([]);
      setFilteredHours([]);
    }
  };

  // Toggle row expansion
  const toggleRowExpansion = (rowIndex) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowIndex]: !prev[rowIndex]
    }));
  };

  // Fetch uploaded files
  const fetchUploadedFiles = async () => {
    try {
      const response = await fetch('/api/excell-upload/files');
      if (!response.ok) throw new Error('Failed to fetch files');
      
      const result = await response.json();
      if (result.success) {
        setUploadedFiles(result.data);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  // Fetch file data when selected
  const fetchFileData = async (fileId) => {
    if (!fileId) return;
    
    try {
      const response = await fetch(`/api/excell-upload/${fileId}`);
      if (!response.ok) throw new Error('Failed to fetch file data');
      
      const result = await response.json();
      if (result.success) {
        setFileData(result.data);
      }
    } catch (error) {
      console.error('Error fetching file data:', error);
    }
  };

  // Fetch machines
  const fetchMachines = async () => {
    try {
      const response = await fetch('/api/machines');
      if (!response.ok) throw new Error('Failed to fetch machines');
      
      const data = await response.json();
      setMachines(data);
    } catch (error) {
      console.error('Error fetching machines:', error);
    }
  };

  // Fetch processes
  const fetchProcesses = async () => {
    try {
      const response = await fetch('/api/processes');
      if (!response.ok) throw new Error('Failed to fetch processes');
      
      const data = await response.json();
      setProcesses(data);
    } catch (error) {
      console.error('Error fetching processes:', error);
    }
  };

  // Handle file selection
  const handleFileSelect = async (e) => {
    const fileId = e.target.value;
    setSelectedFile(fileId);
    if (fileId) {
      await fetchFileData(fileId);
    } else {
      setFileData(null);
    }
  };

  // Handle search parameter changes
const handleParamChange = async (field, value) => {
  const updatedParams = {
    ...searchParams,
    [field]: value
  };
  
  
  setSearchParams(updatedParams);
  
  // Update lines when floor changes
  if (field === 'floor') {
    
    await fetchLinesByFloor(value);
    setSearchParams(prev => ({
      ...prev,
      [field]: value,
      line: ''
    }));
    
    // Fetch hours for the selected floor
    const selectedFloor = floors.find(f => f._id === value);
    if (selectedFloor) {
      fetchHoursByFloor(selectedFloor.floorName);
    }
  }
};

 // Fetch production data
const fetchProductionData = async () => {
  if (!searchParams.date || !searchParams.floor || !searchParams.line) {
    setMessage({ type: 'error', text: 'Please select date, floor, and line' });
    return;
  }

  setIsLoading(true);
  setMessage({ type: '', text: '' });

  try {
    // Find the selected floor to get floor name
    const selectedFloor = floors.find(f => f._id === searchParams.floor);
    
    if (!selectedFloor) {
      setMessage({ type: 'error', text: 'Selected floor not found' });
      setIsLoading(false);
      return;
    }
    
    // Create params for API call - send floor NAME instead of ID
    const params = new URLSearchParams({
      date: searchParams.date,
      floor: selectedFloor.floorName, // Send floor NAME, not ID
      line: searchParams.line
    });
    
    console.log('API Call Params:', params.toString()); // Debug log
    
    const response = await fetch(`/api/daily-production/update-production?${params}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
    
    const result = await response.json();
    
    if (result.success) {
      // Process operator data if it's an object
      const processedData = result.data.map(item => {
        // Ensure hourlyProduction is always an array
        const hourlyProduction = Array.isArray(item.hourlyProduction) 
          ? item.hourlyProduction 
          : [];
        
        // Check if floor is an object in response and extract name
        let floorName = selectedFloor.floorName;
        if (item.floor && typeof item.floor === 'object') {
          floorName = item.floor.floorName || selectedFloor.floorName;
        } else if (item.floor && typeof item.floor === 'string') {
          floorName = item.floor;
        }
        
        // Check if operator is an object and extract name
        if (item.operator && typeof item.operator === 'object') {
          return {
            ...item,
            operatorName: item.operator.name || item.operator.operatorName || '',
            operatorId: item.operator._id || item.operator.operatorId || '',
            floorName: floorName, // Add floor name
            floorId: selectedFloor._id, // Keep floor ID for reference
            workAs: item.workAs || 'Operator', // Default to Operator
            hourlyProduction: hourlyProduction,
            rowNo: item.rowNo || '' // Ensure rowNo is included
          };
        }
        // If operator is already a string
        return {
          ...item,
          operatorName: item.operator || '',
          operatorId: '',
          floorName: floorName, // Add floor name
          floorId: selectedFloor._id, // Keep floor ID for reference
          workAs: item.workAs || 'Operator', // Default to Operator
          hourlyProduction: hourlyProduction,
          rowNo: item.rowNo || '' // Ensure rowNo is included
        };
      });
      
      setProductionData(processedData);
      
      // Check for duplicate rowNos
      checkDuplicateRowNos(processedData);
      
      // ডিফল্টভাবে সব row expand করে রাখো
      const initialExpandedRows = {};
      processedData.forEach((_, index) => {
        initialExpandedRows[index] = true; // সব row ডিফল্টভাবে open থাকবে
      });
      setExpandedRows(initialExpandedRows);
      
      if (result.data && result.data.length === 0) {
        setMessage({ type: 'info', text: 'No data found for the selected criteria' });
      }
    } else {
      setMessage({ type: 'error', text: result.message || 'Failed to load data' });
    }
  } catch (error) {
    setMessage({ type: 'error', text: error.message });
  } finally {
    setIsLoading(false);
  }
};

  // Prepare data for API submission
  const handleUpdate = async () => {
    if (productionData.length === 0) {
      setMessage({ type: 'error', text: 'No data to update' });
      return;
    }

    // Check for duplicate rowNos before saving
    const hasDuplicates = Object.keys(duplicateRowNos).length > 0;
    if (hasDuplicates) {
      setMessage({ 
        type: 'error', 
        text: 'Cannot save: Duplicate Row Nos found. Please fix them before saving.' 
      });
      return;
    }

    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      // Prepare data for API - ensure hourlyProduction is an array
      const apiData = productionData.map(item => {
        // Ensure hourlyProduction is always an array
        const hourlyProduction = Array.isArray(item.hourlyProduction) 
          ? item.hourlyProduction 
          : [];
        
        // Filter out empty entries
        const filteredHourlyProduction = hourlyProduction.filter(
          hp => hp.productionCount > 0 || (hp.defects && hp.defects.length > 0)
        );

        const apiItem = {
          _id: item._id,
          rowNo: item.rowNo, // Include rowNo in API data
          process: item.process,
          breakdownProcess: item.breakdownProcess,
          uniqueMachine: item.uniqueMachine,
          smv: item.smv,
          target: item.target,
          workAs: item.workAs,
          hourlyProduction: filteredHourlyProduction  // Send as array
        };
        
        // If operator was originally an object, keep the operatorId
        if (item.operatorId) {
          apiItem.operator = item.operatorId;
        }
        
        return apiItem;
      });

      const response = await fetch('/api/daily-production/update-production', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: result.message || 'Data updated successfully!' 
        });
        
        // Refresh data after update
        setTimeout(() => {
          fetchProductionData();
        }, 1000);
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetchProductionData();
  };

  // Handle machine selection
  const handleMachineSelect = (index, machineId) => {
    const updatedData = [...productionData];
    const selectedMachine = machines.find(m => m._id === machineId);
    if (selectedMachine) {
      updatedData[index].uniqueMachine = selectedMachine.uniqueId;
    }
    setProductionData(updatedData);
    setShowMachineDropdown(null);
    setMachineSearch('');
  };

  // Handle process selection
  const handleProcessSelect = (index, processId) => {
    const updatedData = [...productionData];
    const selectedProcess = processes.find(p => p._id === processId);
    if (selectedProcess) {
      // Set process name
      updatedData[index].process = selectedProcess.name;
      
      // Clear breakdown process when main process is selected
      updatedData[index].breakdownProcess = '';
      
      // Set SMV from selected process
      const smvValue = selectedProcess.smv || 0;
      updatedData[index].smv = smvValue;
      
      // Calculate target based on SMV (Target = 60 / SMV)
      if (smvValue > 0) {
        updatedData[index].target = Math.round((60 / smvValue) * 100) / 100;
      }
    }
    setProductionData(updatedData);
    setShowProcessDropdown(null);
    setProcessSearch('');
  };

  // Handle dropdown toggle
  const toggleDropdown = (type, index) => {
    // Close all other dropdowns
    if (showBreakdownDropdown !== null) setShowBreakdownDropdown(null);
    if (showMachineDropdown !== null) setShowMachineDropdown(null);
    if (showProcessDropdown !== null) setShowProcessDropdown(null);
    
    // Clear all search inputs
    setBreakdownSearch('');
    setMachineSearch('');
    setProcessSearch('');
    
    // Open the clicked dropdown
    switch(type) {
      case 'breakdown':
        setShowBreakdownDropdown(showBreakdownDropdown === index ? null : index);
        break;
      case 'machine':
        setShowMachineDropdown(showMachineDropdown === index ? null : index);
        break;
      case 'process':
        setShowProcessDropdown(showProcessDropdown === index ? null : index);
        break;
    }
  };

  // Clear search function
  const clearSearch = (type) => {
    switch(type) {
      case 'breakdown':
        setBreakdownSearch('');
        break;
      case 'machine':
        setMachineSearch('');
        break;
      case 'process':
        setProcessSearch('');
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isOutside = !event.target.closest('.dropdown-container');
      
      if (isOutside) {
        setShowBreakdownDropdown(null);
        setShowMachineDropdown(null);
        setShowProcessDropdown(null);
        setBreakdownSearch('');
        setMachineSearch('');
        setProcessSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Initialize data
  useEffect(() => {
    fetchFloors();
    fetchUploadedFiles();
    fetchMachines();
    fetchProcesses();
  }, []);

  // Auto-fetch when all params are filled
  useEffect(() => {
    if (searchParams.date && searchParams.floor && searchParams.line) {
      fetchProductionData();
    //  console.log(searchParams)
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Daily Production Update</h1>
          <p className="text-gray-600 mt-2">Search and update production data by date, floor, and line</p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Date Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={searchParams.date}
                onChange={(e) => handleParamChange('date', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                required
              />
            </div>

            {/* Floor Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Floor
              </label>
              <select
                value={searchParams.floor}
                onChange={(e) => handleParamChange('floor', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                required
              >
                <option value="">Select Floor</option>
                {floors.map((floor) => (
                  <option key={floor._id} value={floor._id}>
                    {floor.floorName}
                  </option>
                ))}
              </select>
            </div>

            {/* Line Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Line
              </label>
              <select
                value={searchParams.line}
                onChange={(e) => handleParamChange('line', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                required
                disabled={!searchParams.floor}
              >
                <option value="">Select Line</option>
                {lines.map((line) => (
                  <option key={line._id} value={line.lineNumber}>
                    {line.lineNumber}
                  </option>
                ))}
              </select>
            </div>

            {/* File Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Excel File
              </label>
              <select
                value={selectedFile}
                onChange={handleFileSelect}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                <option value="">Select a file</option>
                {uploadedFiles.map((file) => (
                  <option key={file._id} value={file._id}>
                    {file.fileName}
                  </option>
                ))}
              </select>
              {selectedFile && fileData && (
                <p className="mt-1 text-xs text-gray-500">
                  {fileData.totalRecords} records loaded
                </p>
              )}
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                {isLoading ? 'Searching...' : 'Search Data'}
              </button>
            </div>
          </form>

          {/* Message Display */}
          {message.text && (
            <div className={`mt-4 p-4 rounded-lg ${message.type === 'error' ? 'bg-red-50 text-red-700' : message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
              {message.text}
            </div>
          )}

          {/* Duplicate Warnings */}
          {Object.keys(duplicateWarnings).length > 0 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="font-medium text-red-800">Duplicate Row Nos Found</h3>
              </div>
              <div className="text-sm text-red-700">
                {Object.entries(duplicateWarnings).map(([rowNo, warning]) => (
                  <div key={rowNo} className="mb-1">⚠️ {warning}</div>
                ))}
              </div>
              <p className="mt-2 text-xs text-red-600">
                Please fix duplicate row numbers before saving. Duplicate rows are highlighted in red.
              </p>
            </div>
          )}

          {/* Live Process Counts */}
          {productionData.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-yellow-800">
                  Live Process Selection Status
                </div>
                <div className="text-xs text-yellow-600">
                  Updates automatically
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded border border-yellow-100">
                  <div className="text-xs font-medium text-gray-600 mb-1">Beyond the breakdown process:</div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-blue-600">
                      {processCounts.mainProcessCount}
                    </span>
                    <span className="text-xs text-gray-500">
                      out of {productionData.length} rows
                    </span>
                  </div>
                </div>
                <div className="bg-white p-3 rounded border border-yellow-100">
                  <div className="text-xs font-medium text-gray-600 mb-1">Breakdown Process</div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-purple-600">
                      {processCounts.breakdownProcessCount}
                    </span>
                    <span className="text-xs text-gray-500">
                      out of {productionData.length} rows
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Breakdown Process Status Section - Hide/Show Option */}
          {fileData?.data && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={() => setShowBreakdownStatus(!showBreakdownStatus)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                >
                  {showBreakdownStatus ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  Breakdown Process Status
                  <span className={`px-2 py-0.5 text-xs rounded-full ${showBreakdownStatus ? 'bg-blue-200' : 'bg-gray-200'}`}>
                    {showBreakdownStatus ? 'Visible' : 'Hidden'}
                  </span>
                </button>
                <div className="text-xs text-gray-500">
                  {showBreakdownStatus ? 'Click to hide' : 'Click to show'}
                </div>
              </div>
              
              {showBreakdownStatus && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm font-medium text-blue-700 mb-1">Breakdown Process Status:</div>
                  <div className="flex flex-wrap gap-2">
                    {/* Group processes by status */}
                    {Object.entries(breakdownProcessManPower).map(([processName, manPower]) => {
                      const count = breakdownProcessCounts[processName] || 0;
                      const isDisabled = isBreakdownProcessDisabled(processName);
                      const percentage = manPower > 0 ? Math.min(100, (count / manPower) * 100) : 0;
                      
                      return (
                        <div 
                          key={processName}
                          className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                            count === 0 ? 'bg-gray-100 text-gray-800' : 
                            isDisabled ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}
                          title={`Process: ${processName}, Man Power: ${manPower}, Used: ${count}`}
                        >
                          <span className="font-medium">{processName}</span>
                          <span>: {count}/{manPower}</span>
                          {count > 0 && (
                            <span className="text-xs">({percentage.toFixed(0)}%)</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-2 pt-2 border-t border-blue-200">
                    <div className="flex flex-wrap gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-green-100 border border-green-300"></div>
                        <span className="text-gray-600">Available ({Object.keys(breakdownProcessManPower).length})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-green-200 border border-green-400"></div>
                        <span className="text-gray-600">In Use</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-red-200 border border-red-400"></div>
                        <span className="text-gray-600">Max Reached</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Production Data Table */}
        {productionData.length > 0 && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Production Data
                </h2>
                <p className="text-gray-600 text-sm">
                  Showing {productionData.length} records for {searchParams.date}
                  {hours.length > 0 && ` • ${hours.length} hours available`}
                  {Object.keys(duplicateRowNos).length > 0 && (
                    <span className="ml-2 text-red-600 font-medium">
                      • {Object.keys(duplicateRowNos).length} rows have duplicate Row Nos
                    </span>
                  )}
                </p>
              </div>
              
              <button
                onClick={handleUpdate}
                disabled={isSaving || Object.keys(duplicateRowNos).length > 0}
                className={`flex items-center gap-2 px-6 py-2.5 font-medium rounded-lg focus:ring-4 transition ${
                  Object.keys(duplicateRowNos).length > 0
                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-200'
                }`}
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {Object.keys(duplicateRowNos).length > 0 
                  ? 'Fix Duplicates First' 
                  : isSaving ? 'Saving...' : 'Save All Changes'}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Row No
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
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {productionData.map((item, index) => {
                    const isDuplicate = duplicateRowNos[index];
                    
                    return (
                      <>
                        <tr 
                          key={item._id || index} 
                          className={`hover:bg-gray-50 transition ${isDuplicate ? 'bg-red-50' : ''}`}
                        >
                          
                          
                          {/* Row No Cell with Duplicate Highlight */}
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={item.rowNo || ''}
                              onChange={(e) => handleRowNoChange(index, e.target.value)}
                              className={`w-24 px-3 py-1.5 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm ${
                                isDuplicate 
                                  ? 'border-red-500 bg-red-100 text-red-700' 
                                  : 'border-gray-300'
                              }`}
                              placeholder="Enter Row No"
                            />
                            {isDuplicate && (
                              <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Duplicate
                              </div>
                            )}
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {item.operatorName || item.operator || 'N/A'}
                          </td>
                          
                          {/* Machine Cell with Dropdown */}
                          <td className="px-6 py-4 relative">
                            <div className="flex items-center gap-2 dropdown-container">
                              <input
                                type="text"
                                value={item.uniqueMachine || ''}
                                onChange={(e) => handleInputChange(index, 'uniqueMachine', e.target.value)}
                                className="w-32 text-[13px] px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm"
                                placeholder="Type or select"
                              />
                              <button
                                type="button"
                                onClick={() => toggleDropdown('machine', index)}
                                className="p-1.5 border border-gray-300 rounded-md hover:bg-gray-50 transition"
                              >
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              </button>
                            </div>
                            
                            {/* Machine Dropdown with Search */}
                            {showMachineDropdown === index && (
                              <div className="absolute z-50 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-xl dropdown-container">
                                <div className="p-2 border-b border-gray-100">
                                  <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                      type="text"
                                      value={machineSearch}
                                      onChange={(e) => setMachineSearch(e.target.value)}
                                      placeholder="Search machine by ID, status, or line..."
                                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      autoFocus
                                    />
                                    {machineSearch && (
                                      <button
                                        onClick={() => clearSearch('machine')}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                      >
                                        <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                                      </button>
                                    )}
                                  </div>
                                  <div className="mt-1 text-xs text-gray-500 flex justify-between">
                                    <span>{filteredMachines.length} machines found</span>
                                    <span>Click outside to close</span>
                                  </div>
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                  {filteredMachines.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-gray-500">
                                      No machines found matching {machineSearch}
                                    </div>
                                  ) : (
                                    filteredMachines.map((machine) => (
                                      <button
                                        key={machine._id}
                                        type="button"
                                        onClick={() => handleMachineSelect(index, machine._id)}
                                        className="w-full text-left px-3 py-3 text-sm hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition dropdown-container"
                                      >
                                        <div className="font-medium text-gray-900">{machine.uniqueId}</div>
                                        <div className="flex justify-between mt-1">
                                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                                            machine.currentStatus === 'idle' 
                                              ? 'bg-green-100 text-green-800'
                                              : 'bg-yellow-100 text-yellow-800'
                                          }`}>
                                            {machine.currentStatus}
                                          </span>
                                          {machine.lastLocation && (
                                            <span className="text-xs text-gray-500">
                                              {machine.lastLocation.line}
                                            </span>
                                          )}
                                        </div>
                                      </button>
                                    ))
                                  )}
                                </div>
                              </div>
                            )}
                          </td>
                          
                          {/* Process Cell with Dropdown */}
                          <td className="px-6 py-4 relative">
                            <div className="flex items-center gap-2 dropdown-container">
                              <input
                                type="text"
                                value={item.process || ''}
                                onChange={(e) => handleInputChange(index, 'process', e.target.value)}
                                className="w-32 text-red-700 text-[13px] px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm"
                                
                              />
                              <button
                                type="button"
                                onClick={() => toggleDropdown('process', index)}
                                className="p-1.5 border border-gray-300 rounded-md hover:bg-gray-50 transition"
                              >
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              </button>
                            </div>
                            
                            {/* Process Dropdown with Search */}
                            {showProcessDropdown === index && (
                              <div className="absolute z-50 mt-1 w-96 bg-white border border-gray-200 rounded-lg shadow-xl dropdown-container">
                                <div className="p-2 border-b border-gray-100">
                                  <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                      type="text"
                                      value={processSearch}
                                      onChange={(e) => setProcessSearch(e.target.value)}
                                      placeholder="Search process by name, code, or machine type..."
                                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      autoFocus
                                    />
                                    {processSearch && (
                                      <button
                                        onClick={() => clearSearch('process')}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                      >
                                        <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                                      </button>
                                    )}
                                  </div>
                                  <div className="mt-1 text-xs text-gray-500 flex justify-between">
                                    <span>{filteredProcesses.length} processes found</span>
                                    <span>Click outside to close</span>
                                  </div>
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                  {filteredProcesses.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-gray-500">
                                      No processes found matching {processSearch}
                                    </div>
                                  ) : (
                                    filteredProcesses.map((process) => (
                                      <button
                                        key={process._id}
                                        type="button"
                                        onClick={() => handleProcessSelect(index, process._id)}
                                        className="w-full text-left px-3 py-3 text-sm hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition dropdown-container"
                                      >
                                        <div className="font-medium text-gray-900">{process.name}</div>
                                        <div className="flex justify-between items-center mt-1">
                                          <span className="text-xs text-gray-600">{process.code}</span>
                                          <div className="flex items-center gap-3">
                                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-800 rounded">
                                              {process.machineType}
                                            </span>
                                            <span className="text-xs font-medium text-blue-600">
                                              SMV: {process.smv}
                                            </span>
                                          </div>
                                        </div>
                                      </button>
                                    ))
                                  )}
                                </div>
                              </div>
                            )}
                          </td>
                          
                          {/* Breakdown Process Cell with Dropdown */}
                          <td className="px-6 py-4 relative">
                            <div className="flex items-center gap-2 dropdown-container">
                              <input
                                type="text"
                                value={item.breakdownProcess || ''}
                                onChange={(e) => handleInputChange(index, 'breakdownProcess', e.target.value)}
                                className="w-32 text-[13px] px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm"
                                placeholder="Type or select"
                              />
                              <button
                                type="button"
                                onClick={() => toggleDropdown('breakdown', index)}
                                className="p-1.5 border border-gray-300 rounded-md hover:bg-gray-50 transition"
                                disabled={!fileData || !fileData.data}
                              >
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              </button>
                            </div>
                            
                            {/* Breakdown Process Dropdown with Search */}
                            {showBreakdownDropdown === index && fileData && fileData.data && (
                              <div className="absolute z-50 mt-1 w-96 bg-white border border-gray-200 rounded-lg shadow-xl dropdown-container">
                                <div className="p-2 border-b border-gray-100">
                                  <div className="mb-1 text-xs font-medium text-gray-700">
                                    From: {fileData.fileName}
                                  </div>
                                  <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                      type="text"
                                      value={breakdownSearch}
                                      onChange={(e) => setBreakdownSearch(e.target.value)}
                                      placeholder="Search process, machine type, or SMV..."
                                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      autoFocus
                                    />
                                    {breakdownSearch && (
                                      <button
                                        onClick={() => clearSearch('breakdown')}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                      >
                                        <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                                      </button>
                                    )}
                                  </div>
                                  <div className="mt-1 text-xs text-gray-500 flex justify-between">
                                    <span>{filteredFileData.length} of {fileData.data.length} processes</span>
                                    <span>Click outside to close</span>
                                  </div>
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                  {filteredFileData.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-gray-500">
                                      No processes found matching {breakdownSearch}
                                    </div>
                                  ) : (
                                    filteredFileData.map((excelProcess, idx) => {
                                      const processName = excelProcess.process;
                                      const manPower = parseInt(excelProcess.manPower) || 0;
                                      const isDisabled = isBreakdownProcessDisabled(processName);
                                      const currentCount = breakdownProcessCounts[processName] || 0;
                                      
                                      return (
                                        <button
                                          key={excelProcess._id || idx}
                                          type="button"
                                          onClick={() => !isDisabled && handleBreakdownSelect(index, excelProcess)}
                                          disabled={isDisabled}
                                          className={`w-full text-left px-3 py-3 text-sm hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition dropdown-container ${
                                            isDisabled 
                                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                              : 'hover:bg-blue-50'
                                          }`}
                                        >
                                          <div className="font-medium">
                                            {excelProcess.sno}. {excelProcess.process} 
                                            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                                              isDisabled ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                            }`}>
                                              Man Power: {manPower}
                                            </span>
                                          </div>
                                          <div className="flex justify-between items-center mt-1">
                                            <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded">
                                              {excelProcess.mcTypeHp}
                                            </span>
                                            <div className="flex items-center gap-3">
                                              {isDisabled ? (
                                                <span className="text-xs font-medium text-red-600">
                                                  Max reached ({currentCount}/{manPower})
                                                </span>
                                              ) : (
                                                <>
                                                  <span className="text-xs text-gray-600">
                                                    Used: {currentCount}/{manPower}
                                                  </span>
                                                  <span className="text-xs font-medium text-green-600">
                                                    SMV: {excelProcess.smv}
                                                  </span>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        </button>
                                      );
                                    })
                                  )}
                                </div>
                              </div>
                            )}
                          </td>
                          
                          {/* SMV Cell */}
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              step="0.01"
                              value={item.smv || ''}
                              onChange={(e) => handleInputChange(index, 'smv', e.target.value)}
                              className="w-20 px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm"
                            />
                          </td>
                          
                          {/* Work As Cell with Dropdown */}
                          <td className="px-6 py-4 relative">
                            <div className="flex items-center gap-2 dropdown-container">
                              <select
                                value={item.workAs || 'Operator'}
                                onChange={(e) => handleWorkAsSelect(index, e.target.value)}
                                className="w-24 px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm"
                              >
                                {workAsOptions.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>
                          
                          {/* Target Cell */}
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              value={item.target || ''}
                              onChange={(e) => handleInputChange(index, 'target', e.target.value)}
                              className="w-20 px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm"
                            />
                          </td>
                        </tr>
                        
                        {/* Expanded Hourly Production Section - ডিফল্টভাবে দেখাবে */}
                        {(expandedRows[index] === undefined || expandedRows[index]) && hours.length > 0 && (
                          <tr className={isDuplicate ? 'bg-red-50' : 'bg-blue-50'}>
                            <td colSpan="10" className="px-6 py-4">
                              <div className="mb-2">
                                <h3 className="text-sm font-medium text-gray-700 mb-3">
                                  {item.operatorName || item.operator || 'N/A'} -------- Hourly Production
                                </h3>
                                <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-15 xl:grid-cols-15 2xl:grid-cols-15 gap-3">
                                  {hours.map((hour) => (
                                    <div key={hour._id} className="space-y-1">
                                      <label className="block text-xs font-medium text-gray-600">
                                        {hour.hour}
                                      </label>
                                      <input
                                        type="number"
                                        value={getHourlyValue(index, hour.hour)}
                                        onChange={(e) => handleHourlyProductionChange(index, hour.hour, e.target.value)}
                                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                        placeholder="Qty"
                                        min="0"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="flex justify-between items-center mt-3 pt-3 border-t border-blue-200">
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium">Total Production: </span>
                                  <span className="font-bold text-blue-700">{calculateRowTotal(index)}</span>
                                  <span className="ml-4 text-xs text-gray-500">
                                    {Array.isArray(item.hourlyProduction) && item.hourlyProduction.length > 0 
                                      ? `${item.hourlyProduction.length} hours saved as array format`
                                      : 'Enter production quantity for each hour'}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => toggleRowExpansion(index)}
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                  Close
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {Object.keys(duplicateRowNos).length > 0 ? (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-4 h-4" />
                    Fix duplicate Row Nos (highlighted in red) before saving
                  </div>
                ) : (
                  'Edit values in the table and click Save All Changes to update'
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Tips:</span> Breakdown processes disable when man power limit reached
                </div>
                <button
                  onClick={fetchProductionData}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Data
                </button>
              </div>
            </div>
          </div>
        )}

        {/* No Data Message */}
        {productionData.length === 0 && !isLoading && message.type !== 'info' && (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Loaded</h3>
            <p className="text-gray-600 mb-6">
              Select date, floor, and line above to search for production data
            </p>
            <div className="inline-flex items-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Select search criteria
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading production data...</p>
          </div>
        )}
      </div>
    </div>
  );
}