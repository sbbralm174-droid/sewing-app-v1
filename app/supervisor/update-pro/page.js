// app/page.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Save, Loader2, RefreshCw, ChevronDown, X } from 'lucide-react';

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

  // Refs for dropdown containers
  const breakdownDropdownRefs = useRef([]);
  const machineDropdownRefs = useRef([]);
  const processDropdownRefs = useRef([]);

  // Sample data for floors and lines
  const sampleFloors = ['POODO', 'SEWING', 'CUTTING', 'FINISHING'];
  const sampleLines = {
    'POODO': ['PODDO-01', 'PODDO-02', 'PODDO-03'],
    'SEWING': ['SEWING-01', 'SEWING-02', 'SEWING-03'],
    'CUTTING': ['CUTTING-01', 'CUTTING-02'],
    'FINISHING': ['FINISHING-01', 'FINISHING-02']
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

  // Initialize refs arrays
  useEffect(() => {
    breakdownDropdownRefs.current = breakdownDropdownRefs.current.slice(0, productionData.length);
    machineDropdownRefs.current = machineDropdownRefs.current.slice(0, productionData.length);
    processDropdownRefs.current = processDropdownRefs.current.slice(0, productionData.length);
  }, [productionData]);

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
  const handleParamChange = (field, value) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Update lines when floor changes
    if (field === 'floor') {
      setLines(sampleLines[value] || []);
      setSearchParams(prev => ({
        ...prev,
        [field]: value,
        line: ''
      }));
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
      const params = new URLSearchParams(searchParams);
      const response = await fetch(`/api/daily-production/update-production?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Process operator data if it's an object
        const processedData = result.data.map(item => {
          // Check if operator is an object and extract name
          if (item.operator && typeof item.operator === 'object') {
            return {
              ...item,
              operatorName: item.operator.name || item.operator.operatorName || '',
              operatorId: item.operator._id || item.operator.operatorId || ''
            };
          }
          // If operator is already a string
          return {
            ...item,
            operatorName: item.operator || '',
            operatorId: ''
          };
        });
        
        setProductionData(processedData);
        
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetchProductionData();
  };

  // Update production data
  const handleUpdate = async () => {
    if (productionData.length === 0) {
      setMessage({ type: 'error', text: 'No data to update' });
      return;
    }

    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      // Prepare data for API - convert back to original structure
      const apiData = productionData.map(item => {
        const apiItem = {
          _id: item._id,
          process: item.process,
          breakdownProcess: item.breakdownProcess,
          uniqueMachine: item.uniqueMachine,
          smv: item.smv,
          target: item.target,
          workAs: item.workAs,
          hourlyProduction: item.hourlyProduction
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

  // Handle input changes in table
  const handleInputChange = (index, field, value) => {
    const updatedData = [...productionData];
    
    // Clear related fields when necessary
    if (field === 'process' && value.trim() !== '') {
      // Clear breakdown process when main process is manually entered
      updatedData[index].breakdownProcess = '';
    } else if (field === 'breakdownProcess' && value.trim() !== '') {
      // Clear main process when breakdown is manually entered
      updatedData[index].process = '';
    }
    
    updatedData[index][field] = value;
    
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

  // Handle breakdown process selection from uploaded file
  const handleBreakdownSelect = (index, excelProcess) => {
    const updatedData = [...productionData];
    
    // Set breakdown process
    updatedData[index].breakdownProcess = excelProcess.process;
    
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

  // Close dropdown when clicking outside (simplified version)
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside all dropdown containers
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
    setFloors(sampleFloors);
    fetchUploadedFiles();
    fetchMachines();
    fetchProcesses();
  }, []);

  // Auto-fetch when all params are filled
  useEffect(() => {
    if (searchParams.date && searchParams.floor && searchParams.line) {
      fetchProductionData();
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
                  <option key={floor} value={floor}>
                    {floor}
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
                  <option key={line} value={line}>
                    {line}
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
        </div>

        {/* Production Data Table */}
        {productionData.length > 0 && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Production Data
                </h2>
                <p className="text-gray-600 text-sm">
                  Showing {productionData.length} records for {searchParams.date}
                </p>
              </div>
              
              <button
                onClick={handleUpdate}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {isSaving ? 'Saving...' : 'Save All Changes'}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hourly Production
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {productionData.map((item, index) => (
                    <tr key={item._id || index} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.rowNo || index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {/* {item.operatorName || item.operator || 'N/A'}- */}{item.operator.operatorId} 
                      </td>
                      
                      {/* Machine Cell with Dropdown */}
                      <td className="px-6 py-4 relative">
                        <div className="flex items-center gap-2 dropdown-container">
                          <input
                            type="text"
                            value={item.uniqueMachine || ''}
                            onChange={(e) => handleInputChange(index, 'uniqueMachine', e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm"
                            placeholder="Type or select from dropdown"
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
                                  No machines found matching "{machineSearch}"
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
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm"
                            placeholder="Type or select from dropdown"
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
                                  No processes found matching "{processSearch}"
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
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm"
                            placeholder="Type or select from excel file"
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
                                  No processes found matching "{breakdownSearch}"
                                </div>
                              ) : (
                                filteredFileData.map((excelProcess, idx) => (
                                  <button
                                    key={excelProcess._id || idx}
                                    type="button"
                                    onClick={() => handleBreakdownSelect(index, excelProcess)}
                                    className="w-full text-left px-3 py-3 text-sm hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition dropdown-container"
                                  >
                                    <div className="font-medium text-gray-900">
                                      {excelProcess.sno}. {excelProcess.process}
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                      <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded">
                                        {excelProcess.mcTypeHp}
                                      </span>
                                      <div className="flex items-center gap-3">
                                        <span className="text-xs text-gray-600">
                                          Capacity: {excelProcess.capacity}
                                        </span>
                                        <span className="text-xs font-medium text-green-600">
                                          SMV: {excelProcess.smv}
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
                      
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          step="0.01"
                          value={item.smv || ''}
                          onChange={(e) => handleInputChange(index, 'smv', e.target.value)}
                          className="w-24 px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={item.workAs || ''}
                          onChange={(e) => handleInputChange(index, 'workAs', e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          value={item.target || ''}
                          onChange={(e) => handleInputChange(index, 'target', e.target.value)}
                          className="w-24 px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {/* Hourly Production (calculated automatically) */}
                        {/* {item.smv && item.target ? Math.round(item.target / item.smv) : 'N/A'} */}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Edit values in the table and click "Save All Changes" to update
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Tips:</span> Click dropdown buttons (↓) to search and select
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