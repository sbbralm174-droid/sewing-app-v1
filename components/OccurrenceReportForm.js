'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export default function OperatorOccurrenceReport({ operatorId }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [formData, setFormData] = useState({
    date: '',
    type: '',
    details: '',
    reportedBy: ''
  });

  // Fetch occurrence reports
  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/operators/${operatorId}/occurrence-report`);
      
      if (response.ok) {
        const data = await response.json();
        setReports(data.occurrenceReport || []);
      } else {
        toast.error('Failed to fetch reports');
      }
    } catch (error) {
      toast.error('Error fetching reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (operatorId) {
      fetchReports();
    }
  }, [operatorId]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      date: '',
      type: '',
      details: '',
      reportedBy: ''
    });
    setEditingReport(null);
    setShowForm(false);
  };

  // Add new report
  const handleAddReport = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const response = await fetch(`/api/operators/${operatorId}/occurrence-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Report added successfully');
        resetForm();
        fetchReports();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add report');
      }
    } catch (error) {
      toast.error('Error adding report');
    } finally {
      setLoading(false);
    }
  };

  // Edit report
  const handleEditReport = (report) => {
    setEditingReport(report);
    setFormData({
      date: report.date.split('T')[0],
      type: report.type,
      details: report.details,
      reportedBy: report.reportedBy
    });
    setShowForm(true);
  };

  // Update report
  const handleUpdateReport = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const response = await fetch(`/api/operators/${operatorId}/occurrence-report`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId: editingReport._id,
          ...formData
        }),
      });

      if (response.ok) {
        toast.success('Report updated successfully');
        resetForm();
        fetchReports();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update report');
      }
    } catch (error) {
      toast.error('Error updating report');
    } finally {
      setLoading(false);
    }
  };

  // Delete report
  const handleDeleteReport = async (reportId) => {
    if (!confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      const response = await fetch(`/api/operators/${operatorId}/occurrence-report?reportId=${reportId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Report deleted successfully');
        fetchReports();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete report');
      }
    } catch (error) {
      toast.error('Error deleting report');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Occurrence Reports</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Cancel' : 'Add New Report'}
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <form 
          onSubmit={editingReport ? handleUpdateReport : handleAddReport}
          className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50"
        >
          <h3 className="text-lg font-semibold mb-4">
            {editingReport ? 'Edit Report' : 'Add New Report'}
          </h3>
          
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Type</option>
                <option value="Accident">Accident</option>
                <option value="Incident">Incident</option>
                <option value="Safety Violation">Safety Violation</option>
                <option value="Performance Issue">Performance Issue</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Details *
              </label>
              <textarea
                name="details"
                value={formData.details}
                onChange={handleInputChange}
                required
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter report details..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reported By *
              </label>
              <input
                type="text"
                name="reportedBy"
                value={formData.reportedBy}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter reporter name"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : (editingReport ? 'Update' : 'Save')}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Reports List */}
      <div className="space-y-4">
        {loading && !reports.length ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No occurrence reports found
          </div>
        ) : (
          reports.map((report) => (
            <div
              key={report._id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-lg text-gray-800">
                    {report.type}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Date: {new Date(report.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditReport(report)}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteReport(report._id)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              <p className="text-gray-700 mb-2">{report.details}</p>
              
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Reported by: {report.reportedBy}</span>
                <span>
                  Added: {new Date(report.createdAt || report.date).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}