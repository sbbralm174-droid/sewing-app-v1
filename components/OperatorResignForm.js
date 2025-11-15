'use client';
import { useState } from 'react';

export default function OperatorResignForm() {
  const [searchId, setSearchId] = useState('');
  const [operator, setOperator] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const [formData, setFormData] = useState({
    department: '',
    approvedBy: '',
    reason: '',
    performanceMark: '',
    remarks: ''
  });

  const searchOperator = async () => {
    if (!searchId.trim()) {
      showMessage('Please enter Operator ID or NID', 'error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`/api/operators/resign-history?operatorId=${encodeURIComponent(searchId)}`);
      const result = await response.json();

      if (result.success) {
        setOperator(result.data);
        showMessage('Operator found successfully', 'success');
      } else {
        setOperator(null);
        showMessage(result.message, 'error');
      }
    } catch (error) {
      showMessage('Error searching operator', 'error');
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!operator) {
      showMessage('Please search and select an operator first', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/ResignHistory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operatorId: operator.operatorId,
          ...formData
        }),
      });

      const result = await response.json();

      if (result.success) {
        showMessage(`Operator ${operator.name} (ID: ${operator.operatorId}) resigned successfully! Data moved to history and removed from active operators.`, 'success');
        setOperator(null);
        setSearchId('');
        setFormData({
          department: '',
          approvedBy: '',
          reason: '',
          performanceMark: '',
          remarks: ''
        });
      } else {
        showMessage(result.message, 'error');
      }
    } catch (error) {
      showMessage('Error submitting form', 'error');
      console.error('Submit error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchOperator();
    }
  };

  const resetForm = () => {
    setOperator(null);
    setSearchId('');
    setFormData({
      department: '',
      approvedBy: '',
      reason: '',
      performanceMark: '',
      remarks: ''
    });
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Operator Resignation</h1>
          <p className="text-gray-600">Process operator resignation and move data to history</p>
        </div>

        {/* Search Section */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Operator (ID or NID) *
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter Operator ID or National ID"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={searchOperator}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition duration-200"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </span>
              ) : 'Search'}
            </button>
          </div>
        </div>

        {/* Operator Info */}
        {operator && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-green-800 text-lg">Operator Found</h3>
              <button
                onClick={resetForm}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear & Search New
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex flex-col">
                <span className="font-medium text-gray-600">Name</span>
                <span className="text-gray-800">{operator.name}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-gray-600">Operator ID</span>
                <span className="text-gray-800">{operator.operatorId}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-gray-600">National ID</span>
                <span className="text-gray-800">{operator.nid}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-gray-600">Designation</span>
                <span className="text-gray-800">{operator.designation}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-gray-600">Grade</span>
                <span className="text-gray-800">{operator.grade}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-gray-600">Joining Date</span>
                <span className="text-gray-800">{new Date(operator.joiningDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>
          </div>
        )}

        {/* Resignation Form */}
        {operator && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Resignation Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department *
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter department name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Approved By *
                  </label>
                  <input
                    type="text"
                    name="approvedBy"
                    value={formData.approvedBy}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter approver name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Resignation *
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Provide detailed reason for resignation..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Performance Mark *
                  </label>
                  <select
                    name="performanceMark"
                    value={formData.performanceMark}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select performance</option>
                    <option value="good">Good - Satisfactory performance</option>
                    <option value="bad">Bad - Unsatisfactory performance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resignation Date
                  </label>
                  <input
                    type="text"
                    value={new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-generated current date</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Remarks
                </label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any additional comments or remarks (optional)"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2 px-4 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 transition duration-200"
              >
                {submitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing Resignation...
                  </span>
                ) : (
                  'Submit Resignation'
                )}
              </button>
            </div>
          </form>
        )}

        {/* Message */}
        {message && (
          <div className={`mt-6 p-4 rounded-md border ${
            messageType === 'success' 
              ? 'bg-green-50 text-green-800 border-green-200' 
              : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            <div className="flex items-center">
              {messageType === 'success' ? (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span className="font-medium">{message}</span>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!operator && !message && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">Instructions:</h4>
            <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
              <li>Enter Operator ID or National ID to search for an operator</li>
              <li>After finding the operator, fill out the resignation form</li>
              <li>All fields marked with * are required</li>
              <li>Upon submission, operator data will be moved to resignation history</li>
              <li>Operator will be removed from active operators list</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}