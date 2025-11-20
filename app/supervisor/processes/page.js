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
    subProcess: '', // নতুন field
    condition: '', // নতুন field
    workAid: '' // নতুন field - workEight থেকে workAid তে পরিবর্তন
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
  const [searchTerm, setSearchTerm] = useState(''); // Search term state

  useEffect(() => {
    fetchProcesses();
  }, []);

  // Search functionality
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProcesses(processes);
    } else {
      const filtered = processes.filter(process => {
        const searchWords = searchTerm.toLowerCase().split('');
        const processText = (
          process.name + 
          process.code + 
          process.subProcess + 
          process.condition + 
          process.workAid
        ).toLowerCase();
        
        let searchIndex = 0;
        for (let i = 0; i < processText.length && searchIndex < searchWords.length; i++) {
          if (processText[i] === searchWords[searchIndex]) {
            searchIndex++;
          }
        }
        
        return searchIndex === searchWords.length;
      });
      setFilteredProcesses(filtered);
    }
  }, [searchTerm, processes]);

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

  const generateProcessCode = (processName, processStatus) => {
    if (!processName) return '';
    
    // Remove special characters and extra spaces
    const cleanName = processName
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .replace(/\s+/g, ' ');
    
    // Get words and take first 3 letters from each word (max 3 words)
    const words = cleanName.split(' ').slice(0, 3);
    
    // Generate code from words
    let generatedCode = '';
    if (words.length === 1) {
      // If single word, take first 4 characters
      generatedCode = words[0].substring(0, 4);
    } else {
      // If multiple words, take first 2-3 characters from each
      generatedCode = words.map(word => {
        if (word.length <= 2) return word;
        return word.substring(0, words.length === 2 ? 3 : 2);
      }).join('');
    }
    
    // Ensure code is 4-6 characters long
    if (generatedCode.length < 4) {
      generatedCode = generatedCode.padEnd(4, 'X');
    } else if (generatedCode.length > 6) {
      generatedCode = generatedCode.substring(0, 6);
    }
    
    // Add prefix based on process status
    let statusPrefix = '';
    switch (processStatus) {
      case 'Critical':
        statusPrefix = 'CRI-';
        break;
      case 'Basic':
        statusPrefix = 'BAS-';
        break;
      case 'Semi-Critical':
        statusPrefix = 'SCRI-';
        break;
      default:
        statusPrefix = 'CRI-';
    }
    
    return statusPrefix + generatedCode;
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    
    if (autoGenerateCode && !editingProcess) {
      const generatedCode = generateProcessCode(name, formData.processStatus);
      setFormData(prev => ({ 
        ...prev, 
        name: name,
        code: generatedCode
      }));
    } else {
      setFormData(prev => ({ ...prev, name: name }));
    }
  };

  const handleStatusChange = (e) => {
    const status = e.target.value;
    
    if (autoGenerateCode && !editingProcess && formData.name) {
      const generatedCode = generateProcessCode(formData.name, status);
      setFormData(prev => ({ 
        ...prev, 
        processStatus: status,
        code: generatedCode
      }));
    } else {
      setFormData(prev => ({ ...prev, processStatus: status }));
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
    } else if (name === 'processStatus') {
      handleStatusChange(e);
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
      const generatedCode = generateProcessCode(formData.name, formData.processStatus);
      setFormData(prev => ({ ...prev, code: generatedCode }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate code
    if (!formData.code.trim()) {
      setError('Process code is required');
      return;
    }

    try {
      const payload = {
        ...formData,
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
          subProcess: '', // reset
          condition: '', // reset
          workAid: '' // reset

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
    name: process.name,
    description: process.description || '',
    code: process.code,
    smv: process.smv.toString(),
    comments: process.comments || '',
    processStatus: process.processStatus,
    isAssessment: process.isAssessment || false,
    subProcess: process.subProcess || '', // এই line ঠিক করুন
    condition: process.condition || '', // এই line ঠিক করুন
    workAid: process.workAid || '' // এই line ঠিক করুন - workEight নয়
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
      
      const payload = {
        _id: editingProcess._id,
        ...formData,
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
          setSuccess(`Process updated successfully! SMV version updated from ${editingProcess.smvVersion} to ${result.smvVersion}`);
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
          subProcess: '', // reset
          condition: '', // reset
          workAid: '' // reset
        });
        setAutoGenerateCode(true); // Reset to auto-generate for new entries
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
      isAssessment: false
    });
    setAutoGenerateCode(true); // Reset to auto-generate for new entries
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
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status]}`}>
        {status}
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
              <label className="block text-sm font-medium mb-1">Condition </label>
              <input
                type="text"
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="w-full p-2 border border-gray-600 rounded-lg bg-gray-800 text-white"
                
                placeholder="Enter condition"
              />
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
                  maxLength={10}
                />
                
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
                  This will be saved in SMV history
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
          <div className=" justify items-center mb-4">
            <h2 className="text-2xl font-bold">Process List</h2>
            <div className="w-64">
              <input
                type="text"
                placeholder="Search processes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white"
              />
              
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : filteredProcesses.length === 0 ? (
            <div className="text-center py-4 text-gray-400">
              {searchTerm ? 'No processes found matching your search.' : 'No processes found.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="border border-gray-600 px-4 py-2 text-left">#</th>
                    <th className="border border-gray-600 px-4 py-2 text-left">Code</th>
                    <th className="border border-gray-600 px-4 py-2 text-left">Name</th>
                    <th className="border border-gray-600 px-4 py-2 text-left">Sub Process</th>
                    <th className="border border-gray-600 px-4 py-2 text-left">Condition</th>
                    <th className="border border-gray-600 px-4 py-2 text-left">Work Aid</th>
                    <th className="border border-gray-600 px-4 py-2 text-left">SMV</th>
                    <th className="border border-gray-600 px-4 py-2 text-left">SMV Version</th>
                    <th className="border border-gray-600 px-4 py-2 text-left">Status</th>
                    <th className="border border-gray-600 px-4 py-2 text-left">Assessment</th>
                    <th className="border border-gray-600 px-4 py-2 text-left">Last Updated</th>
                    <th className="border border-gray-600 px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProcesses.map((process, index) => (
                    <tr key={process._id} className="hover:bg-gray-750">
                      <td className="border border-gray-600 px-4 py-2">{index + 1}</td>
                      <td className="border border-gray-600 px-4 py-2 font-mono">{process.code}</td>
                      <td className="border border-gray-600 px-4 py-2">{process.name}</td>
                      <td className="border border-gray-600 px-4 py-2">{process.subProcess || '-'}</td>
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
                      <td className="border border-gray-600 px-4 py-2">
                        {getAssessmentBadge(process.isAssessment)}
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