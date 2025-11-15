'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import SidebarNavLayout from '@/components/SidebarNavLayout';

export default function SupervisorForm() {
  const [formData, setFormData] = useState({
    name: '',
    supervisorId: '',
    designation: '',
    assignedLines: []
  });
  const [lineInput, setLineInput] = useState('');
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addLine = () => {
    if (lineInput && !formData.assignedLines.includes(lineInput)) {
      setFormData(prev => ({
        ...prev,
        assignedLines: [...prev.assignedLines, lineInput]
      }));
      setLineInput('');
    }
  };

  const removeLine = (line) => {
    setFormData(prev => ({
      ...prev,
      assignedLines: prev.assignedLines.filter(l => l !== line)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/supervisors', {
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
    
      <div className="container mx-auto p-4" style={{ backgroundColor: '#1A1B22', color: '#E5E9F0', fontFamily: 'sans-serif' }}>
        <SidebarNavLayout />
        <h1 className="text-2xl font-bold mb-4">Add New Supervisor</h1>
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
            <label className="block mb-1">Supervisor ID:</label>
            <input
              type="text"
              name="supervisorId"
              value={formData.supervisorId}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              style={{ backgroundColor: '#2D3039', color: '#E5E9F0' }}
              required
            />
          </div>
          <div>
            <label className="block mb-1">Designation:</label>
            <input
              type="text"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              style={{ backgroundColor: '#2D3039', color: '#E5E9F0' }}
              required
            />
          </div>
          <div>
            <label className="block mb-1">Assigned Lines:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={lineInput}
                onChange={(e) => setLineInput(e.target.value)}
                className="flex-1 p-2 border rounded"
                style={{ backgroundColor: '#2D3039', color: '#E5E9F0' }}
                placeholder="Add line number"
              />
              <button
                type="button"
                onClick={addLine}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Add
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.assignedLines.map((line) => (
                <span key={line} className="bg-gray-200 px-3 py-1 rounded-full flex items-center">
                  {line}
                  <button
                    type="button"
                    onClick={() => removeLine(line)}
                    className="ml-2 text-red-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
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
