'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OperatorForm() {
  const [formData, setFormData] = useState({
    name: '',
    operatorId: '',
    designation: '',
    allowedProcesses: []
  });
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProcesses = async () => {
      try {
        const response = await fetch('/api/processes');
        if (response.ok) {
          const data = await response.json();
          setProcesses(data);
        }
      } catch (error) {
        console.error('Error fetching processes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProcesses();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProcessChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({
      ...prev,
      allowedProcesses: selectedOptions
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

  if (loading) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

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
          <select
            multiple
            value={formData.allowedProcesses}
            onChange={handleProcessChange}
            className="w-full p-2 border rounded h-auto min-h-[42px]"
            required
          >
            {processes.map((process) => (
              <option key={process._id} value={process.name}>
                {process.name}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple options</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.allowedProcesses.map((process) => (
              <span key={process} className="bg-gray-200 px-3 py-1 rounded-full flex items-center">
                {process}
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    allowedProcesses: prev.allowedProcesses.filter(p => p !== process)
                  }))}
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