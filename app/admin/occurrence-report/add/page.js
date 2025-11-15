'use client';
import { useState } from 'react';

export default function OccurrenceReport() {
  const [searchTerm, setSearchTerm] = useState('');
  const [operators, setOperators] = useState([]);
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    type: '',
    details: '',
    reportedBy: ''
  });
  const [message, setMessage] = useState('');

  // Search operators
  const searchOperators = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/operators/id-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ searchTerm }),
      });

      const data = await response.json();
      if (response.ok) {
        setOperators(data.operators);
        setMessage('');
      } else {
        setMessage(data.error);
        setOperators([]);
      }
    } catch (error) {
      setMessage('Error searching operators');
    } finally {
      setLoading(false);
    }
  };

  // Handle operator selection
  const handleSelectOperator = (operator) => {
    setSelectedOperator(operator);
    setOperators([]);
    setSearchTerm('');
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit occurrence report
  const submitOccurrenceReport = async (e) => {
    e.preventDefault();
    if (!selectedOperator) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/operators/${selectedOperator._id}/occurrence-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      console.log("📤 Submitted data:", formData);
      const data = await response.json();
      if (response.ok) {
        setMessage('Occurrence report added successfully!');
        setFormData({
          date: '',
          type: '',
          details: '',
          reportedBy: ''
        });
        setSelectedOperator(null);
      } else {
        setMessage(data.error);
      }
    } catch (error) {
      setMessage('Error adding occurrence report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Occurrence Report System
        </h1>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Search Operator</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Operator ID or Name"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && searchOperators()}
            />
            <button
              onClick={searchOperators}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Search Results */}
          {operators.length > 0 && (
            <div className="mt-4 border border-gray-200 rounded-lg">
              {operators.map((operator) => (
                <div
                  key={operator._id}
                  className="p-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleSelectOperator(operator)}
                >
                  <div className="font-medium">{operator.name}</div>
                  <div className="text-sm text-gray-600">
                    ID: {operator.operatorId} | Designation: {operator.designation} | Grade: {operator.grade}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Occurrence Report Form */}
        {selectedOperator && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              Add Occurrence Report for {selectedOperator.name}
            </h2>
            <form onSubmit={submitOccurrenceReport} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Type</option>
                    <option value="Accident">Accident</option>
                    <option value="Incident">Incident</option>
                    <option value="Warning">Warning</option>
                    <option value="Complaint">Complaint</option>
                    <option value="Achievement">Achievement</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Details *
                </label>
                <textarea
                  name="details"
                  value={formData.details}
                  onChange={handleInputChange}
                  required
                  rows="4"
                  placeholder="Enter detailed description of the occurrence..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reported By *
                </label>
                <input
                  type="text"
                  name="reportedBy"
                  value={formData.reportedBy}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter reporter's name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Report'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOperator(null)}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Message Display */}
        {message && (
          <div className={`mt-4 p-4 rounded-lg ${
            message.includes('successfully') 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}