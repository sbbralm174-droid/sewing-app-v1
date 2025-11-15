'use client'
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import SidebarNavLayout from '@/components/SidebarNavLayout';

export default function ProcessForm() {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [processes, setProcesses] = useState([]);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch existing processes on mount
  useEffect(() => {
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
    fetchProcesses();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/processes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const newProcess = await response.json();
        setProcesses(prev => [...prev, newProcess]); // Add to table
        setSuccess(true);
        setFormData({ name: '', description: '' }); // Reset form
        setTimeout(() => setSuccess(false), 3000); // Hide success message after 3s
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
      <div className="container mx-auto p-4" style={{ backgroundColor: '#1A1B22', color: '#E5E9F0', fontFamily: 'sans-serif' }}>
        <SidebarNavLayout />
        <h1 className="text-2xl font-bold mb-4">Add New Process</h1>

        {/* Success message */}
        {success && (
          <div className="mb-4 p-3 bg-green-600 text-white rounded">
            Process added successfully!
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1">Name:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              style={{ backgroundColor: '#2D3039', color: '#E5E9F0' }}
              required
            />
          </div>
          <div>
            <label className="block mb-1">Description:</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              style={{ backgroundColor: '#2D3039', color: '#E5E9F0' }}
              rows="3"
            />
          </div>
          <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
            Submit
          </button>
        </form>

        {/* Table */}
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-2">Process List</h2>
          {loading ? (
            <p>Loading...</p>
          ) : processes.length === 0 ? (
            <p>No processes found.</p>
          ) : (
            <table className="w-full border-collapse border border-gray-700">
              <thead>
                <tr className="bg-gray-800">
                  <th className="border border-gray-700 px-2 py-1">#</th>
                  <th className="border border-gray-700 px-2 py-1">Name</th>
                  <th className="border border-gray-700 px-2 py-1">Description</th>
                </tr>
              </thead>
              <tbody>
                {processes.map((p, index) => (
                  <tr key={p._id} className="odd:bg-gray-900 even:bg-gray-800">
                    <td className="border border-gray-700 px-2 py-1">{index + 1}</td>
                    <td className="border border-gray-700 px-2 py-1">{p.name}</td>
                    <td className="border border-gray-700 px-2 py-1">{p.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
  );
}
