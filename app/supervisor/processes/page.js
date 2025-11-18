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
    processStatus: 'active'
  });
  const [processes, setProcesses] = useState([]);
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingProcess, setEditingProcess] = useState(null);
  const [error, setError] = useState('');
  const [smvHistory, setSmvHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchProcesses();
  }, []);

  const fetchProcesses = async () => {
    try {
      const res = await fetch('/api/processes');
      const data = await res.json();
      setProcesses(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
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
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

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
          processStatus: 'active'
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
      processStatus: process.processStatus
    });
    setError('');
    setSuccess('');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const payload = {
        _id: editingProcess._id,
        ...formData,
        smv: parseFloat(formData.smv) // Ensure SMV is a number
      };
      
      // Compare the new SMV from payload with the old SMV from editingProcess
      const isSmvChanged = payload.smv !== editingProcess.smv;
      const oldSmvVersion = editingProcess.smvVersion; // Store the old version before update

      const response = await fetch('/api/processes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        // Check if SMV was modified and the version actually incremented in the response
        if (isSmvChanged && result.smvVersion === oldSmvVersion + 1) {
          setSuccess(`Process updated successfully! SMV version updated from ${oldSmvVersion} to ${result.smvVersion}`);
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
          processStatus: 'active'
        });
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
      processStatus: 'active'
    });
    setError('');
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      draft: 'bg-yellow-100 text-yellow-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status]}`}>
        {status}
      </span>
    );
  };

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
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-2 border border-gray-600 rounded-lg bg-gray-800 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Code *</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                className="w-full p-2 border border-gray-600 rounded-lg bg-gray-800 text-white"
                required
              />
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
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full p-2 border border-gray-600 rounded-lg bg-gray-800 text-white"
              rows="2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Comments</label>
            <textarea
              name="comments"
              value={formData.comments}
              onChange={handleChange}
              className="w-full p-2 border border-gray-600 rounded-lg bg-gray-800 text-white"
              rows="2"
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
                <div className="space-y-2">
                  {smvHistory.map((history, index) => (
                    <div key={index} className="bg-gray-700 p-3 rounded-lg">
                      <div className="flex justify-between">
                        <span className="font-medium">SMV: {history.smv}</span>
                        <span className="text-sm text-gray-300">Version: {history.smvVersion}</span>
                      </div>
                      <div className="text-sm text-gray-400">
                        Updated: {new Date(history.updatedAt).toLocaleString()}
                      </div>
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
          <h2 className="text-2xl font-bold mb-4">Process List</h2>
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : processes.length === 0 ? (
            <div className="text-center py-4 text-gray-400">No processes found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="border border-gray-600 px-4 py-2 text-left">#</th>
                    <th className="border border-gray-600 px-4 py-2 text-left">Code</th>
                    <th className="border border-gray-600 px-4 py-2 text-left">Name</th>
                    <th className="border border-gray-600 px-4 py-2 text-left">SMV</th>
                    <th className="border border-gray-600 px-4 py-2 text-left">SMV Version</th>
                    <th className="border border-gray-600 px-4 py-2 text-left">Previous SMV</th>
                    <th className="border border-gray-600 px-4 py-2 text-left">Status</th>
                    <th className="border border-gray-600 px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {processes.map((process, index) => (
                    <tr key={process._id} className="hover:bg-gray-750">
                      <td className="border border-gray-600 px-4 py-2">{index + 1}</td>
                      <td className="border border-gray-600 px-4 py-2 font-mono">{process.code}</td>
                      <td className="border border-gray-600 px-4 py-2">{process.name}</td>
                      <td className="border border-gray-600 px-4 py-2 text-right">{process.smv}</td>
                      <td className="border border-gray-600 px-4 py-2 text-center">{process.smvVersion}</td>
                      <td className="border border-gray-600 px-4 py-2 text-right">
                        {process.previousSmv ? `${process.previousSmv} (v${process.previousSmvVersion})` : '-'}
                      </td>
                      <td className="border border-gray-600 px-4 py-2">
                        {getStatusBadge(process.processStatus)}
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