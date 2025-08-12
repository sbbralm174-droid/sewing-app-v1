'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MachineForm() {
  const [formData, setFormData] = useState({
    uniqueId: '',
    machineType: '',
    lineNumber: '',
    floor: '',
    currentStatus: 'idle'
  });
  const [machineTypes, setMachineTypes] = useState([]);
  const router = useRouter();

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
        body: JSON.stringify({
          ...formData,
          machineType: formData.machineType
        }),
      });
      if (response.ok) {
        router.push('/');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Add New Machine</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Unique ID:</label>
          <input
            type="text"
            name="uniqueId"
            value={formData.uniqueId}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Machine Type:</label>
          <select
            name="machineType"
            value={formData.machineType}
            onChange={handleChange}
            className="w-full p-2 border rounded"
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
        {/* <div>
          <label className="block mb-1">Line Number:</label>
          <input
            type="text"
            name="lineNumber"
            value={formData.lineNumber}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Floor:</label>
          <input
            type="text"
            name="floor"
            value={formData.floor}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div> */}
        <div>
          <label className="block mb-1">Current Status:</label>
          <select
            name="currentStatus"
            value={formData.currentStatus}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="idle">Idle</option>
            <option value="running">Running</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Submit
        </button>
      </form>
    </div>
  );
}