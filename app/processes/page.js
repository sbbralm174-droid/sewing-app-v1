'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProcessForm() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    compatibleMachineTypes: []
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

  const handleArrayChange = (e) => {
    const { name, options } = e.target;
    const selectedValues = Array.from(options)
      .filter(option => option.selected)
      .map(option => option.value);
    setFormData(prev => ({ ...prev, [name]: selectedValues }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/processes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
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
      <h1 className="text-2xl font-bold mb-4">Add New Process</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border rounded"
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
            rows="3"
          />
        </div>
        <div>
          <label className="block mb-1">Compatible Machine Types:</label>
          <select
            name="compatibleMachineTypes"
            multiple
            value={formData.compatibleMachineTypes}
            onChange={handleArrayChange}
            className="w-full p-2 border rounded h-auto"
            size="5"
          >
            {machineTypes.map((type) => (
              <option key={type._id} value={type._id}>
                {type.name}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500">Hold Ctrl/Cmd to select multiple</p>
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