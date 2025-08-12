'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OperatorForm() {
  const [formData, setFormData] = useState({
    name: '',
    operatorId: '',
    designation: '',
    allowedProcesses: []
  });
  const [processInput, setProcessInput] = useState('');
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addProcess = () => {
    if (processInput && !formData.allowedProcesses.includes(processInput)) {
      setFormData(prev => ({
        ...prev,
        allowedProcesses: [...prev.allowedProcesses, processInput]
      }));
      setProcessInput('');
    }
  };

  const removeProcess = (process) => {
    setFormData(prev => ({
      ...prev,
      allowedProcesses: prev.allowedProcesses.filter(p => p !== process)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/operators', {
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
      <h1 className="text-2xl font-bold mb-4">Add New Operator</h1>
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
          <label className="block mb-1">Operator ID:</label>
          <input
            type="text"
            name="operatorId"
            value={formData.operatorId}
            onChange={handleChange}
            className="w-full p-2 border rounded"
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
            required
          />
        </div>
        <div>
          <label className="block mb-1">Allowed Processes:</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={processInput}
              onChange={(e) => setProcessInput(e.target.value)}
              className="flex-1 p-2 border rounded"
              placeholder="Add process"
            />
            <button
              type="button"
              onClick={addProcess}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Add
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.allowedProcesses.map((process) => (
              <span key={process} className="bg-gray-200 px-3 py-1 rounded-full flex items-center">
                {process}
                <button
                  type="button"
                  onClick={() => removeProcess(process)}
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