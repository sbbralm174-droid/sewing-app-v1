"use client";

import { useState, useEffect } from 'react';

export default function HourlyReportPage() {
  const [reports, setReports] = useState({});
  const [floor, setFloor] = useState('');
  const [hour, setHour] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' });
  const [floors, setFloors] = useState([]);

  // Fetch floors and reports on page load
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch floors
        const floorsRes = await fetch('/api/floors');
        if (!floorsRes.ok) {
          throw new Error('Failed to fetch floors');
        }
        const floorsData = await floorsRes.json();
        setFloors(floorsData.data);

        // Fetch reports
        const reportsRes = await fetch('/api/hours', { cache: 'no-store' });
        if (!reportsRes.ok) {
          throw new Error('Failed to fetch reports');
        }
        const reportsData = await reportsRes.json();
        
        // Group reports by floor
        const groupedReports = {};
        reportsData.forEach(report => {
          if (!groupedReports[report.floor]) {
            groupedReports[report.floor] = [];
          }
          groupedReports[report.floor].push(report);
        });
        setReports(groupedReports);
      } catch (error) {
        console.error(error);
        setSubmitMessage({ type: 'error', text: error.message });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hours', {
        cache: 'no-store'
      });
      if (!res.ok) {
        throw new Error('Failed to fetch reports');
      }
      const data = await res.json();
      
      // Group reports by floor
      const groupedReports = {};
      data.forEach(report => {
        if (!groupedReports[report.floor]) {
          groupedReports[report.floor] = [];
        }
        groupedReports[report.floor].push(report);
      });
      setReports(groupedReports);
    } catch (error) {
      console.error(error);
      setSubmitMessage({ type: 'error', text: 'Failed to fetch reports.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/hours', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ floor, hour }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      setSubmitMessage({ type: 'success', text: 'Report submitted successfully!' });
      setFloor('');
      setHour('');
      fetchReports(); // Refresh the list of reports
    } catch (error) {
      setSubmitMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hours?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete the report.');
      }
      setSubmitMessage({ type: 'success', text: 'Report deleted successfully!' });
      fetchReports(); // Refresh the list of reports
    } catch (error) {
      setSubmitMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const getBackgroundColor = (index) => {
    return index % 2 === 0 ? 'bg-gray-50' : 'bg-white';
  };
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
      <div className="w-full max-w-4xl bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Add Hour by Floor Wise</h1>

        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="floor" className="block text-sm font-medium text-gray-700">Floor</label>
              <select
                id="floor"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                required
              >
                <option value="">Select a floor</option>
                {floors.map((floor) => (
                  <option key={floor._id} value={floor.floorName}>
                    {floor.floorName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="hour" className="block text-sm font-medium text-gray-700">Hour</label>
              <input
                type="text"
                id="hour"
                value={hour}
                onChange={(e) => setHour(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>

        {submitMessage.text && (
          <div className={`p-4 rounded-md mb-4 ${submitMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {submitMessage.text}
          </div>
        )}

        <div className="overflow-x-auto shadow-md rounded-lg">
          {Object.keys(reports).length > 0 ? (
            Object.keys(reports).sort().map(floor => (
              <div key={floor} className="mb-6">
                <h2 className="text-2xl font-bold mb-2 text-gray-700">Floor: {floor}</h2>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hour</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reports[floor].map((report, index) => (
                      <tr key={report._id} className={getBackgroundColor(index)}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.hour}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(report.createdAt)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDelete(report._id)}
                            className="text-red-600 hover:text-red-900"
                            disabled={loading}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          ) : (
            <div className="px-6 py-4 text-center text-sm text-gray-500">
              {loading ? (
                 <div className="flex items-center justify-center space-x-2">
                 <img src="https://placehold.co/24x24/9CA3AF/FFFFFF/png?text=..." alt="Loading Spinner" width={24} height={24} className="animate-spin" />
                 <span>Loading reports...</span>
               </div>
              ) : (
                'No reports found.'
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}