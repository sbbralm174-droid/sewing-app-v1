'use client'
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';

export default function OperatorUpdate() {
  const [searchTerm, setSearchTerm] = useState('');
  const [operator, setOperator] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [message, setMessage] = useState('');
  const [loadingProcesses, setLoadingProcesses] = useState(true);

  // Fetch all processes for checkbox list
  useEffect(() => {
    const fetchProcesses = async () => {
      try {
        const res = await fetch('/api/processes');
        const data = await res.json();
        setProcesses(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingProcesses(false);
      }
    };
    fetchProcesses();
  }, []);

  const fetchOperator = async () => {
    try {
      const res = await fetch('/api/operators');
      const data = await res.json();
      const found = data.find(
        (op) => op.operatorId === searchTerm || op.name.toLowerCase() === searchTerm.toLowerCase()
      );
      if (found) {
        setOperator(found);
        setMessage('');
      } else {
        setOperator(null);
        setMessage('❌ Operator not found');
      }
    } catch (err) {
      console.error(err);
      setMessage('❌ Error fetching operators');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setOperator(prev => ({ ...prev, [name]: value }));
  };

  const handleProcessToggle = (processName) => {
    setOperator(prev => {
      const alreadySelected = prev.allowedProcesses.includes(processName);
      return {
        ...prev,
        allowedProcesses: alreadySelected
          ? prev.allowedProcesses.filter(p => p !== processName)
          : [...prev.allowedProcesses, processName]
      };
    });
  };

  const handleUpdate = async () => {
    try {
      const res = await fetch(`/api/operators/update/${operator._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(operator),
      });
      if (res.ok) {
        setMessage('✅ Operator updated successfully!');
      } else {
        setMessage('❌ Update failed!');
      }
    } catch (err) {
      console.error(err);
      setMessage('❌ Error updating operator');
    }
  };

  const filteredProcesses = processes.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="min-h-screen bg-[#1A1B22] text-[#E5E9F0] p-6">
        <h1 className="text-2xl font-bold mb-4">Update Operator</h1>

        <div className="mb-4 flex gap-2">
          <input
            type="text"
            placeholder="Search by Name or ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-2 rounded bg-[#2D3039] text-white flex-1"
          />
          <button
            onClick={fetchOperator}
            className="bg-indigo-600 px-4 py-2 rounded text-white"
          >
            Search
          </button>
        </div>

        {message && <p className="mb-4">{message}</p>}

        {operator && (
          <div className="space-y-3">
            <input
              type="text"
              name="name"
              value={operator.name}
              onChange={handleChange}
              className="w-full p-2 rounded bg-[#2D3039] text-white"
            />
            <input
              type="text"
              name="operatorId"
              value={operator.operatorId}
              onChange={handleChange}
              className="w-full p-2 rounded bg-[#2D3039] text-white"
            />
            <select
              name="designation"
              value={operator.designation}
              onChange={handleChange}
              className="w-full p-2 rounded bg-[#2D3039] text-white"
            >
              <option value="Helper">Helper</option>
              <option value="Operator">Operator</option>
            </select>

            {/* Grade Dropdown */}
            <select
              name="grade"
              value={operator.grade || ""}
              onChange={handleChange}
              className="w-full p-2 rounded bg-[#2D3039] text-white"
            >
              <option value="">Select Grade</option>
              <option value="A">A</option>
              <option value="A+">A+</option>
              <option value="A++">A++</option>
              <option value="B+">B+</option>
              <option value="B++">B++</option>
            </select>

            {/* Allowed Processes */}
            {!loadingProcesses && (
              <div>
                <label className="block mb-1 text-sm font-medium">
                  Allowed Processes
                  <span className="ml-2 text-xs text-gray-400">
                    ({operator.allowedProcesses.length} selected)
                  </span>
                </label>

                <div className="max-h-40 overflow-y-auto border border-[#2D3039] rounded-md p-2 bg-[#2D3039] mb-2">
                  {processes.map((process) => (
                    <label key={process._id} className="flex items-center gap-2 mb-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={operator.allowedProcesses.includes(process.name)}
                        onChange={() => handleProcessToggle(process.name)}
                      />
                      <span>{process.name}</span>
                    </label>
                  ))}
                </div>

                {/* Selected Chips */}
                <div className="flex flex-wrap gap-2">
                  {operator.allowedProcesses.map((process) => (
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
            )}

            <button
              onClick={handleUpdate}
              className="bg-green-600 px-4 py-2 rounded text-white mt-2"
            >
              Update
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
