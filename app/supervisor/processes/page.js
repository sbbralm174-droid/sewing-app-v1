'use client'
import { useState, useEffect } from 'react';
import SidebarNavLayout from '@/components/SidebarNavLayout';

export default function ProcessForm() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    smv: '',
    comments: '',
    processStatus: 'Critical',
    isAssessment: false,
    subProcess: '',
    condition: '',
    workAid: '',
    machineType: 'Over Lock' // New machine field
  });
  const [processes, setProcesses] = useState([]);
  const [filteredProcesses, setFilteredProcesses] = useState([]);
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingProcess, setEditingProcess] = useState(null);
  const [error, setError] = useState('');
  const [smvHistory, setSmvHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [smvChangeComment, setSmvChangeComment] = useState('');
  const [autoGenerateCode, setAutoGenerateCode] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [columnSearch, setColumnSearch] = useState({
    code: '',
    name: '',
    subProcess: '',
    condition: '',
    workAid: '',
    machineType: '', // Added machine to search
    smv: '',
    processStatus: '',
    isAssessment: ''
  });

  useEffect(() => {
    fetchProcesses();
  }, []);

  // Main search functionality
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProcesses(processes);
    } else {
      const filtered = processes.filter(process => {
        const searchText = (
          (process.name || '') + 
          (process.code || '') + 
          (process.subProcess || '') + 
          (process.condition || '') + 
          (process.workAid || '') +
          (process.machineType || '')
        ).toLowerCase();
        
        const searchWords = searchTerm.toLowerCase().split('');
        let searchIndex = 0;
        
        for (let i = 0; i < searchText.length && searchIndex < searchWords.length; i++) {
          if (searchText[i] === searchWords[searchIndex]) {
            searchIndex++;
          }
        }
        
        return searchIndex === searchWords.length;
      });
      setFilteredProcesses(filtered);
    }
  }, [searchTerm, processes]);

  // Column-wise search functionality
  useEffect(() => {
    let filtered = processes;

    // Apply column-specific filters
    Object.keys(columnSearch).forEach(column => {
      const searchValue = columnSearch[column].toLowerCase().trim();
      
      if (searchValue) {
        filtered = filtered.filter(process => {
          let cellValue = '';
          
          switch (column) {
            case 'code':
              cellValue = process.code || '';
              break;
            case 'name':
              cellValue = process.name || '';
              break;
            case 'subProcess':
              cellValue = process.subProcess || '';
              break;
            case 'condition':
              cellValue = process.condition || '';
              break;
            case 'workAid':
              cellValue = process.workAid || '';
              break;
            case 'machineType':
              cellValue = process.machineType || '';
              break;
            case 'smv':
              cellValue = process.smv?.toString() || '';
              break;
            case 'processStatus':
              cellValue = process.processStatus || '';
              break;
            case 'isAssessment':
              if (searchValue.includes('assessment') || searchValue.includes('yes') || searchValue.includes('true')) {
                return process.isAssessment === true;
              }
              if (searchValue.includes('no') || searchValue.includes('false')) {
                return process.isAssessment === false;
              }
              return true;
            default:
              return true;
          }

          const searchWords = searchValue.split('');
          let searchIndex = 0;
          
          for (let i = 0; i < cellValue.length && searchIndex < searchWords.length; i++) {
            if (cellValue[i].toLowerCase() === searchWords[searchIndex]) {
              searchIndex++;
            }
          }
          
          return searchIndex === searchWords.length;
        });
      }
    });

    setFilteredProcesses(filtered);
  }, [columnSearch, processes]);

  const fetchProcesses = async () => {
    try {
      const res = await fetch('/api/processes');
      const data = await res.json();
      setProcesses(data);
      setFilteredProcesses(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleColumnSearchChange = (column, value) => {
    setColumnSearch(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const clearColumnSearch = (column) => {
    setColumnSearch(prev => ({
      ...prev,
      [column]: ''
    }));
  };

  const clearAllColumnFilters = () => {
    setColumnSearch({
      code: '',
      name: '',
      subProcess: '',
      condition: '',
      workAid: '',
      machineType: '',
      smv: '',
      processStatus: '',
      isAssessment: ''
    });
  };

  // Machine-specific code generation logic
  const generateProcessCode = (processName, subProcessName, machineType) => {
    if (!processName || !processName.trim()) return '';

    // Process name থেকে প্রথম তিন letters নেওয়া
    const processWords = processName.trim().toUpperCase().split(/\s+/).filter(word => word.length > 0);
    let processCode = '';
    
    processWords.forEach(word => {
      if (word.length >= 3) {
        processCode += word.substring(0, 3) + '-';
      } else {
        processCode += word + '-';
      }
    });
    
    // শেষের - remove করা
    if (processCode.endsWith('-')) {
      processCode = processCode.slice(0, -1);
    }

    // Machine type code যোগ করা
    if (machineType) {
      const machineCodes = {
        'Over Lock': 'OL',
        'Flat Lock': 'FL',
        'SNLS/DNLS': 'SN',
        'Kansai': 'KA',
        'F/Sleamer': 'FS',
        'FOA': 'FO',
        'BH': 'BH',
        'BS': 'BS',
        'Eyelet': 'EY',
        'BTK': 'BT'
      };
      
      const machineCode = machineCodes[machineType] || 'OT';
      processCode = machineCode + '-' + processCode;
    }

    // Sub process থেকে code generate করা
    if (subProcessName && subProcessName.trim() !== '') {
      const subProcessWords = subProcessName.trim().toUpperCase().split(/\s+/).filter(word => word.length > 0);
      
      if (subProcessWords.length > 0) {
        let subProcessCode = '';
        
        subProcessWords.forEach(word => {
          if (word.length >= 3) {
            subProcessCode += word.substring(0, 3) + '-';
          } else {
            subProcessCode += word + '-';
          }
        });
        
        // শেষের - remove করা
        if (subProcessCode.endsWith('-')) {
          subProcessCode = subProcessCode.slice(0, -1);
        }
        
        // Process এবং Sub Process code combine করা
        processCode = processCode + '-' + subProcessCode;
      }
    }

    // একই নামের process কতগুলো আছে তা count করা
    const existingProcesses = processes.filter(p => {
      const pName = p?.name?.toString().toLowerCase().trim() || '';
      const inputName = processName.toString().toLowerCase().trim();
      return pName === inputName;
    });

    // Version number determine করা
    let versionNumber = existingProcesses.length + 1;
    
    // Format: XX-XX (process count - version)
    const processCount = versionNumber.toString().padStart(2, '0');
    const smvVersion = '01';

    // Final code তৈরি করা
    processCode = processCode + '-' + processCount + '-' + smvVersion;

    return processCode;
  };

  // SMV version update করার function
  const updateSmvVersion = (existingCode) => {
    if (!existingCode) return existingCode;
    
    const parts = existingCode.split('-');
    if (parts.length < 2) return existingCode;
    
    try {
      const currentVersion = parseInt(parts[parts.length - 1]);
      if (isNaN(currentVersion)) return existingCode;
      
      const newVersion = (currentVersion + 1).toString().padStart(2, '0');
      parts[parts.length - 1] = newVersion;
      return parts.join('-');
    } catch (error) {
      console.error('Error updating SMV version:', error);
      return existingCode;
    }
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    
    if (autoGenerateCode && !editingProcess) {
      const generatedCode = generateProcessCode(name, formData.subProcess, formData.machineType);
      setFormData(prev => ({ 
        ...prev, 
        name: name,
        code: generatedCode
      }));
    } else {
      setFormData(prev => ({ ...prev, name: name }));
    }
  };

  const handleSubProcessChange = (e) => {
    const subProcess = e.target.value;
    
    if (autoGenerateCode && !editingProcess && formData.name) {
      const generatedCode = generateProcessCode(formData.name, subProcess, formData.machineType);
      setFormData(prev => ({ 
        ...prev, 
        subProcess: subProcess,
        code: generatedCode
      }));
    } else {
      setFormData(prev => ({ ...prev, subProcess: subProcess }));
    }
  };

  const handleMachineChange = (e) => {
    const machineType = e.target.value;
    
    if (autoGenerateCode && !editingProcess && formData.name) {
      const generatedCode = generateProcessCode(formData.name, formData.subProcess, machineType);
      setFormData(prev => ({ 
        ...prev, 
        machineType: machineType,
        code: generatedCode
      }));
    } else {
      setFormData(prev => ({ ...prev, machineType: machineType }));
    }
  };

  const fetchSmvHistory = async (processId) => {
    try {
      const res = await fetch('/api/processes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: processId })
      });
      const data = await res.json();
      if (res.ok) {
        setSmvHistory(data.smvHistory || []);
        setShowHistory(true);
      }
    } catch (err) {
      console.error('Error fetching SMV history:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'name') {
      handleNameChange(e);
    } else if (name === 'subProcess') {
      handleSubProcessChange(e);
    } else if (name === 'machineType') {
      handleMachineChange(e);
    } else {
      setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? checked : value 
      }));
    }
  };

  const handleAutoGenerateToggle = (e) => {
    const isChecked = e.target.checked;
    setAutoGenerateCode(isChecked);
    
    if (isChecked && !editingProcess && formData.name) {
      const generatedCode = generateProcessCode(formData.name, formData.subProcess, formData.machineType);
      setFormData(prev => ({ ...prev, code: generatedCode }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate required fields
    if (!formData.name.trim()) {
      setError('Process name is required');
      return;
    }
    if (!formData.subProcess.trim()) {
      setError('Sub process is required');
      return;
    }
    if (!formData.code.trim()) {
      setError('Process code is required');
      return;
    }
    if (!formData.machineType.trim()) {
      setError('Machine type is required');
      return;
    }

    try {
      const payload = {
        ...formData,
        name: formData.name.trim(),
        subProcess: formData.subProcess.trim(),
        machineType: formData.machineType.trim(),
        smv: parseFloat(formData.smv) || 0
      };

      const response = await fetch('/api/processes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess('Process created successfully!');
        setFormData({
          name: '',
          description: '',
          code: '',
          smv: '',
          comments: '',
          processStatus: 'Critical',
          isAssessment: false,
          subProcess: '',
          condition: '',
          workAid: '',
          machineType: 'Over Lock'
        });
        fetchProcesses();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to create process');
      }
    } catch (error) {
      setError('Error creating process');
      console.error('Error:', error);
    }
  };

  const handleEdit = (process) => {
    setEditingProcess(process);
    setFormData({
      name: process.name || '',
      description: process.description || '',
      code: process.code || '',
      smv: process.smv?.toString() || '',
      comments: process.comments || '',
      processStatus: process.processStatus || 'Critical',
      isAssessment: process.isAssessment || false,
      subProcess: process.subProcess || '',
      condition: process.condition || '',
      workAid: process.workAid || '',
      machineType: process.machineType || 'Over Lock'
    });
    setAutoGenerateCode(false);
    setSmvChangeComment('');
    setError('');
    setSuccess('');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const isSmvChanged = editingProcess && parseFloat(formData.smv) !== editingProcess.smv;
      
      let updatedCode = formData.code;
      
      // যদি SMV change হয়, তাহলে version update করতে হবে
      if (isSmvChanged) {
        updatedCode = updateSmvVersion(formData.code);
      }

      const payload = {
        _id: editingProcess._id,
        ...formData,
        code: updatedCode,
        smv: parseFloat(formData.smv) || 0
      };

      // Add SMV change comment if SMV is being changed
      if (isSmvChanged && smvChangeComment) {
        payload.smvChangeComment = smvChangeComment;
      }

      const response = await fetch('/api/processes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        if (isSmvChanged) {
          setSuccess(`Process updated successfully! Code updated to: ${updatedCode}`);
        } else {
          setSuccess('Process updated successfully!');
        }
        setEditingProcess(null);
        setFormData({
          name: '',
          description: '',
          code: '',
          smv: '',
          comments: '',
          processStatus: 'Critical',
          isAssessment: false,
          subProcess: '',
          condition: '',
          workAid: '',
          machineType: 'Over Lock'
        });
        setAutoGenerateCode(true);
        setSmvChangeComment('');
        fetchProcesses();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(result.error || 'Failed to update process');
      }
    } catch (error) {
      setError('Error updating process');
      console.error('Error:', error);
    }
  };

  const cancelEdit = () => {
    setEditingProcess(null);
    setFormData({
      name: '',
      description: '',
      code: '',
      smv: '',
      comments: '',
      processStatus: 'Critical',
      isAssessment: false,
      subProcess: '',
      condition: '',
      workAid: '',
      machineType: 'Over Lock'
    });
    setAutoGenerateCode(true);
    setSmvChangeComment('');
    setError('');
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      Basic: 'bg-green-100 text-green-800',
      Critical: 'bg-red-100 text-red-800',
      'Semi-Critical': 'bg-yellow-100 text-yellow-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const getMachineBadge = (machineType) => {
    const machineStyles = {
      'Over Lock': 'bg-blue-100 text-blue-800',
      'Flat Lock': 'bg-purple-100 text-purple-800',
      'SNLS/DNLS': 'bg-indigo-100 text-indigo-800',
      'Kansai': 'bg-pink-100 text-pink-800',
      'F/Sleamer': 'bg-orange-100 text-orange-800',
      'FOA': 'bg-teal-100 text-teal-800',
      'BH': 'bg-cyan-100 text-cyan-800',
      'BS': 'bg-lime-100 text-lime-800',
      'Eyelet': 'bg-amber-100 text-amber-800',
      'BTK': 'bg-emerald-100 text-emerald-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${machineStyles[machineType] || 'bg-gray-100 text-gray-800'}`}>
        {machineType}
      </span>
    );
  };

  const getAssessmentBadge = (isAssessment) => {
    if (isAssessment) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          Assessment
        </span>
      );
    }
    return null;
  };

  const isSmvChanged = editingProcess && parseFloat(formData.smv) !== editingProcess.smv;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <SidebarNavLayout />
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">
          {editingProcess ? 'Edit Process' : 'Add New Process'}
        </h1>

        {/* Success and Error Messages */}
        {success && (
          <div className="mb-4 p-3 bg-green-600 text-white rounded-lg">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-600 text-white rounded-lg">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={editingProcess ? handleUpdate : handleSubmit} className="space-y-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Process Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-2 border border-gray-600 rounded-lg bg-gray-800 text-white"
                required
                placeholder="Enter process name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Sub Process *</label>
              <input
                type="text"
                name="subProcess"
                value={formData.subProcess}
                onChange={handleChange}
                className="w-full p-2 border border-gray-600 rounded-lg bg-gray-800 text-white"
                required
                placeholder="Enter sub process name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Machine Type *</label>
              <select
                name="machineType"
                value={formData.machineType}
                onChange={handleChange}
                className="w-full p-2 border border-gray-600 rounded-lg bg-gray-800 text-white"
                required
              >
                <option value="Over Lock">Over Lock</option>
                <option value="Flat Lock">Flat Lock</option>
                <option value="SNLS/DNLS">SNLS/DNLS</option>
                <option value="Kansai">Kansai</option>
                <option value="F/Sleamer">F/Sleamer</option>
                <option value="FOA">FOA</option>
                <option value="BH">BH</option>
                <option value="BS">BS</option>
                <option value="Eyelet">Eyelet</option>
                <option value="BTK">BTK</option>
              </select>
            </div>

            

            <div>
              <label className="block text-sm font-medium mb-1">Work Aid</label>
              <input
                type="text"
                name="workAid"
                value={formData.workAid}
                onChange={handleChange}
                className="w-full p-2 border border-gray-600 rounded-lg bg-gray-800 text-white"
                placeholder="Enter work Aid"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Code *</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-600 rounded-lg bg-gray-800 text-white font-mono"
                  required
                  placeholder="Process code"
                  maxLength={50}
                />
              </div>
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  id="autoGenerate"
                  checked={autoGenerateCode}
                  onChange={handleAutoGenerateToggle}
                  className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                  disabled={editingProcess}
                />
                <label htmlFor="autoGenerate" className="ml-2 text-sm text-gray-300">
                  Auto-generate code
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                SMV *
                {editingProcess && (
                  <span className="text-xs text-gray-400 ml-2">
                    (Current: {editingProcess.smv}, Version: {editingProcess.smvVersion})
                  </span>
                )}
              </label>
              <input
                type="number"
                name="smv"
                value={formData.smv}
                onChange={handleChange}
                step="0.01"
                className="w-full p-2 border border-gray-600 rounded-lg bg-gray-800 text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                name="processStatus"
                value={formData.processStatus}
                onChange={handleChange}
                className="w-full p-2 border border-gray-600 rounded-lg bg-gray-800 text-white"
              >
                <option value="Basic">Basic</option>
                <option value="Critical">Critical</option>
                <option value="Semi-Critical">Semi-Critical</option>
              </select>
            </div>
          </div>
          
          {/* Assessment Checkbox */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="isAssessment"
              id="isAssessment"
              checked={formData.isAssessment}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label htmlFor="isAssessment" className="text-sm font-medium">
              Mark as Assessment Process
            </label>
          </div>
          
          {/* SMV Change Comment - Only show when editing and SMV is changed */}
          {editingProcess && isSmvChanged && (
            <div>
              <label className="block text-sm font-medium mb-1">
                SMV Change Reason (Optional)
                <span className="text-xs text-gray-400 ml-2">
                  This will be saved in SMV history and version will be updated
                </span>
              </label>
              <input
                type="text"
                value={smvChangeComment}
                onChange={(e) => setSmvChangeComment(e.target.value)}
                placeholder="Why are you changing the SMV value?"
                className="w-full p-2 border border-yellow-600 rounded-lg bg-gray-800 text-white"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full p-2 border border-gray-600 rounded-lg bg-gray-800 text-white"
              rows="2"
              placeholder="Process description (optional)"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Remarks</label>
            <textarea
              name="comments"
              value={formData.comments}
              onChange={handleChange}
              className="w-full p-2 border border-gray-600 rounded-lg bg-gray-800 text-white"
              rows="2"
              placeholder="Additional remarks (optional)"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              {editingProcess ? 'Update Process' : 'Create Process'}
            </button>
            {editingProcess && (
              <>
                <button
                  type="button"
                  onClick={() => fetchSmvHistory(editingProcess._id)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium"
                >
                  View SMV History
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </form>

        {/* SMV History Modal */}
        {showHistory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">SMV History</h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              {smvHistory.length > 0 ? (
                <div className="space-y-3">
                  {smvHistory.slice().reverse().map((history, index) => (
                    <div key={index} className="bg-gray-700 p-4 rounded-lg border-l-4 border-blue-500">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-medium text-lg">SMV: {history.smv}</span>
                          <span className="ml-3 text-sm bg-blue-600 px-2 py-1 rounded">
                            Version: {history.smvVersion}
                          </span>
                        </div>
                        <span className="text-sm text-gray-300">
                          {new Date(history.updatedAt).toLocaleString()}
                        </span>
                      </div>
                      {history.comment && (
                        <div className="text-sm text-gray-300 mt-1">
                          <strong>Note:</strong> {history.comment}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No SMV history available</p>
              )}
            </div>
          </div>
        )}

        {/* Processes Table */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Process List</h2>
            <div className="flex gap-4 items-center">
              <div className="w-64">
                <input
                  type="text"
                  placeholder="Search all processes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white"
                />
              </div>
              {Object.values(columnSearch).some(val => val.trim() !== '') && (
                <button
                  onClick={clearAllColumnFilters}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : filteredProcesses.length === 0 ? (
            <div className="text-center py-4 text-gray-400">
              {searchTerm || Object.values(columnSearch).some(val => val.trim() !== '') 
                ? 'No processes found matching your search.' 
                : 'No processes found.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="border border-gray-600 px-4 py-2 text-left">#</th>
                    <th className="border border-gray-600 px-4 py-2 text-left">
                      <div>Code</div>
                      <input
                        type="text"
                        placeholder="Search code..."
                        value={columnSearch.code}
                        onChange={(e) => handleColumnSearchChange('code', e.target.value)}
                        className="w-full p-1 text-xs border border-gray-500 rounded bg-gray-700 text-white placeholder-gray-400 mt-1"
                      />
                    </th>
                    <th className="border border-gray-600 px-4 py-2 text-left">
                      <div>Name</div>
                      <input
                        type="text"
                        placeholder="Search name..."
                        value={columnSearch.name}
                        onChange={(e) => handleColumnSearchChange('name', e.target.value)}
                        className="w-full p-1 text-xs border border-gray-500 rounded bg-gray-700 text-white placeholder-gray-400 mt-1"
                      />
                    </th>
                    <th className="border border-gray-600 px-4 py-2 text-left">
                      <div>Sub Process</div>
                      <input
                        type="text"
                        placeholder="Search sub process..."
                        value={columnSearch.subProcess}
                        onChange={(e) => handleColumnSearchChange('subProcess', e.target.value)}
                        className="w-full p-1 text-xs border border-gray-500 rounded bg-gray-700 text-white placeholder-gray-400 mt-1"
                      />
                    </th>
                    <th className="border border-gray-600 px-4 py-2 text-left">
                      <div>Machine</div>
                      <input
                        type="text"
                        placeholder="Search machine..."
                        value={columnSearch.machineType}
                        onChange={(e) => handleColumnSearchChange('machineType', e.target.value)}
                        className="w-full p-1 text-xs border border-gray-500 rounded bg-gray-700 text-white placeholder-gray-400 mt-1"
                      />
                    </th>
                    <th className="border border-gray-600 px-4 py-2 text-left">
                      <div>Condition</div>
                      <input
                        type="text"
                        placeholder="Search condition..."
                        value={columnSearch.condition}
                        onChange={(e) => handleColumnSearchChange('condition', e.target.value)}
                        className="w-full p-1 text-xs border border-gray-500 rounded bg-gray-700 text-white placeholder-gray-400 mt-1"
                      />
                    </th>
                    <th className="border border-gray-600 px-4 py-2 text-left">
                      <div>Work Aid</div>
                      <input
                        type="text"
                        placeholder="Search work aid..."
                        value={columnSearch.workAid}
                        onChange={(e) => handleColumnSearchChange('workAid', e.target.value)}
                        className="w-full p-1 text-xs border border-gray-500 rounded bg-gray-700 text-white placeholder-gray-400 mt-1"
                      />
                    </th>
                    <th className="border border-gray-600 px-4 py-2 text-left">
                      <div>SMV</div>
                      <input
                        type="text"
                        placeholder="Search SMV..."
                        value={columnSearch.smv}
                        onChange={(e) => handleColumnSearchChange('smv', e.target.value)}
                        className="w-full p-1 text-xs border border-gray-500 rounded bg-gray-700 text-white placeholder-gray-400 mt-1"
                      />
                    </th>
                    <th className="border border-gray-600 px-4 py-2 text-left">SMV Version</th>
                    <th className="border border-gray-600 px-4 py-2 text-left">
                      <div>Status</div>
                      <input
                        type="text"
                        placeholder="Search status..."
                        value={columnSearch.processStatus}
                        onChange={(e) => handleColumnSearchChange('processStatus', e.target.value)}
                        className="w-full p-1 text-xs border border-gray-500 rounded bg-gray-700 text-white placeholder-gray-400 mt-1"
                      />
                    </th>
                    
                    <th className="border border-gray-600 px-4 py-2 text-left">Last Updated</th>
                    <th className="border border-gray-600 px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProcesses.map((process, index) => (
                    <tr key={process._id} className="hover:bg-gray-750">
                      <td className="border border-gray-600 px-4 py-2">{index + 1}</td>
                      <td className="border border-gray-600 px-4 py-2 font-mono text-sm">{process.code}</td>
                      <td className="border border-gray-600 px-4 py-2">{process.name}</td>
                      <td className="border border-gray-600 px-4 py-2">{process.subProcess || '-'}</td>
                      <td className="border border-gray-600 px-4 py-2">
                        {getMachineBadge(process.machineType)}
                      </td>
                      <td className="border border-gray-600 px-4 py-2">{process.condition || '-'}</td>
                      <td className="border border-gray-600 px-4 py-2">{process.workAid || '-'}</td>
                      <td className="border border-gray-600 px-4 py-2 text-right font-medium">
                        {process.smv}
                      </td>
                      <td className="border border-gray-600 px-4 py-2 text-center">
                        <span className="bg-blue-600 px-2 py-1 rounded text-xs">
                          v{process.smvVersion}
                        </span>
                      </td>
                      <td className="border border-gray-600 px-4 py-2">
                        {getStatusBadge(process.processStatus)}
                      </td>
                      
                      <td className="border border-gray-600 px-4 py-2 text-sm text-gray-400">
                        {new Date(process.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="border border-gray-600 px-4 py-2">
                        <button
                          onClick={() => handleEdit(process)}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm mr-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => fetchSmvHistory(process._id)}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm"
                        >
                          History
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}