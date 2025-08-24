'use client'
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';

export default function OperatorForm() {
  const [formData, setFormData] = useState({
    name: '',
    operatorId: '',
    designation: 'Operator',
    allowedProcesses: []
  });
  const [processes, setProcesses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

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

  const handleProcessToggle = (processName) => {
    setFormData(prev => {
      const alreadySelected = prev.allowedProcesses.includes(processName);
      return {
        ...prev,
        allowedProcesses: alreadySelected
          ? prev.allowedProcesses.filter(p => p !== processName)
          : [...prev.allowedProcesses, processName]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/operators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setSuccessMessage('✅ Operator added successfully!');
        setFormData({ name: '', operatorId: '', designation: 'Operator', allowedProcesses: [] });
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1A1B22] text-[#E5E9F0] font-sans flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const filteredProcesses = processes.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="min-h-screen bg-[#1A1B22] text-[#E5E9F0] font-sans flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-[#1A1B22] p-6 rounded-lg shadow-lg border border-[#2D3039]">
          <h1 className="text-2xl font-bold mb-6 text-center">Add New Operator</h1>

          {/* ✅ Success Message */}
          {successMessage && (
            <div className="mb-4 p-2 bg-green-700 text-white rounded-md text-center">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium">Name:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-2 rounded-md border-transparent bg-[#2D3039] text-[#E5E9F0] focus:ring-2 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Operator ID:</label>
              <input
                type="text"
                name="operatorId"
                value={formData.operatorId}
                onChange={handleChange}
                className="w-full p-2 rounded-md border-transparent bg-[#2D3039] text-[#E5E9F0] focus:ring-2 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Designation:</label>
              <select
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                className="w-full p-2 rounded-md border-transparent bg-[#2D3039] text-[#E5E9F0] focus:ring-2 focus:ring-indigo-500 sm:text-sm"
                required
              >
                <option value="Helper">Helper</option>
                <option value="Operator">Operator</option>
              </select>
            </div>
            <div>
            <div>
  <label className="block mb-1 text-sm font-medium">Grade:</label>
  <select
    name="grade"
    value={formData.grade || ""}
    onChange={handleChange}
    className="w-full p-2 rounded-md border-transparent bg-[#2D3039] text-[#E5E9F0] focus:ring-2 focus:ring-indigo-500 sm:text-sm"
    required
  >
    <option value="">Select Grade</option>
    <option value="A">A</option>
    <option value="A+">A+</option>
    <option value="A++">A++</option>
    <option value="B+">B+</option>
    <option value="B++">B++</option>
  </select>
</div>

              {/* ✅ Selected count দেখানো হচ্ছে */}
              <label className="block mb-1 text-sm font-medium">
                Allowed Processes 
                <span className="ml-2 text-xs text-gray-400">
                  ({formData.allowedProcesses.length} selected)
                </span>
              </label>
              
              {/* ✅ Searchable Process List */}
              <input
                type="text"
                placeholder="Search process..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full mb-2 p-2 rounded-md border-transparent bg-[#2D3039] text-[#E5E9F0] focus:ring-2 focus:ring-indigo-500 sm:text-sm"
              />

              <div className="max-h-40 overflow-y-auto border border-[#2D3039] rounded-md p-2 bg-[#2D3039]">
                {filteredProcesses.map((process) => (
                  <label key={process._id} className="flex items-center gap-2 mb-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allowedProcesses.includes(process.name)}
                      onChange={() => handleProcessToggle(process.name)}
                    />
                    <span>{process.name}</span>
                  </label>
                ))}
              </div>

              {/* ✅ Selected Chips */}
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.allowedProcesses.map((process) => (
                  <span key={process} className="bg-[#2D3039] px-3 py-1 rounded-full flex items-center">
                    {process}
                    <button
                      type="button"
                      onClick={() => handleProcessToggle(process)}
                      className="ml-2 text-red-400"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
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
