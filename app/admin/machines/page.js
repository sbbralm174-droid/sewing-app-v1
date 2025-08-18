'use client'
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';

export default function MachineForm() {
  const [formData, setFormData] = useState({
    uniqueId: '',
    machineType: '',
    lineNumber: '',
    floor: '',
    currentStatus: 'idle'
  });
  const [machineTypes, setMachineTypes] = useState([]);
  const [success, setSuccess] = useState(false); // Success state

  useEffect(() => {
    const fetchMachineTypes = async () => {
      const response = await fetch('/api/machine-types');
      const data = await response.json();
      setMachineTypes(data);
    };
    fetchMachineTypes();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/machines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess(true); // Set success true
        setFormData({
          uniqueId: '',
          machineType: '',
          lineNumber: '',
          floor: '',
          currentStatus: 'idle'
        });

        // Optional: 3 সেকেন্ড পরে success message hide করা
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#1A1B22] text-[#E5E9F0] font-sans flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-[#1A1B22] p-6 rounded-lg shadow-lg border border-[#2D3039]">
          <h1 className="text-2xl font-bold mb-6 text-center">Add New Machine</h1>

          {success && (
            <div className="mb-4 p-3 bg-green-600 text-white text-center rounded">
              Machine added successfully!
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium">Unique ID:</label>
              <input
                type="text"
                name="uniqueId"
                value={formData.uniqueId}
                onChange={handleChange}
                className="w-full p-2 rounded-md border-transparent bg-[#2D3039] text-[#E5E9F0] focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Machine Type:</label>
              <select
                name="machineType"
                value={formData.machineType}
                onChange={handleChange}
                className="w-full p-2 rounded-md border-transparent bg-[#2D3039] text-[#E5E9F0] focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              >
                <option value="">Select Machine Type</option>
                {machineTypes.map((type) => (
                  <option key={type._id} value={type._id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Current Status:</label>
              <select
                name="currentStatus"
                value={formData.currentStatus}
                onChange={handleChange}
                className="w-full p-2 rounded-md border-transparent bg-[#2D3039] text-[#E5E9F0] focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="idle">Idle</option>
                <option value="running">Running</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md shadow-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Submit
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
