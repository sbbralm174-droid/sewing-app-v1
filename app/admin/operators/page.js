// app/admin/operators/page.js

'use client'
import { useState, useEffect } from 'react';
import SidebarNavLayout from '@/components/SidebarNavLayout';

export default function OperatorForm() {
  const [formData, setFormData] = useState({
    name: '',
    operatorId: '',
    joiningDate: '',
    nid: '',
    birthCertificate: '',
    designation: 'Operator',
    grade: '',
    allowedProcesses: {}
  });
  const [processes, setProcesses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [formErrors, setFormErrors] = useState({});

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
    
    // Clear messages when user starts typing
    if (successMessage) setSuccessMessage('');
    if (errorMessage) setErrorMessage('');
    
    // Clear specific field error
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Clear ID validation error when either field is filled
    if ((name === 'nid' && value) || (name === 'birthCertificate' && value)) {
      setFormErrors(prev => ({ ...prev, idValidation: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.nid && !formData.birthCertificate) {
      errors.idValidation = 'Either NID or Birth Certificate must be provided';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProcessToggle = (processName) => {
    setFormData(prev => {
      const newProcesses = { ...prev.allowedProcesses };
      if (newProcesses[processName] !== undefined) {
        delete newProcesses[processName];
      } else {
        newProcesses[processName] = 0; // default score
      }
      return { ...prev, allowedProcesses: newProcesses };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setFormErrors({});

    if (!validateForm()) return;

    try {
      const submissionData = {
        ...formData,
        nid: formData.nid || undefined,
        birthCertificate: formData.birthCertificate || undefined
      };

      const response = await fetch('/api/operators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccessMessage('✅ Operator added successfully!');
        setFormData({
          name: '',
          operatorId: '',
          joiningDate: '',
          nid: '',
          birthCertificate: '',
          designation: 'Operator',
          grade: '',
          allowedProcesses: {}
        });
        setSearchTerm('');
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setErrorMessage(`❌ ${result.error || 'Failed to create operator'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('❌ Network error. Please try again.');
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
    p.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#1A1B22] text-[#E5E9F0] font-sans flex">
      <SidebarNavLayout/>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-[#1A1B22] p-6 rounded-lg shadow-lg border border-[#2D3039]">
          <h1 className="text-2xl font-bold mb-6 text-center">Add New Operator</h1>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-700 text-white rounded-md text-center">
              {successMessage}
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-700 text-white rounded-md text-center">
              {errorMessage}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.preventDefault();
            }}
          >
            {/* Name */}
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

            {/* Operator ID */}
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

            {/* Joining Date */}
            <div>
              <label className="block mb-1 text-sm font-medium">Joining Date:</label>
              <input
                type="date"
                name="joiningDate"
                value={formData.joiningDate}
                onChange={handleChange}
                className="w-full p-2 rounded-md border-transparent bg-[#2D3039] text-[#E5E9F0] focus:ring-2 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>

            {/* NID */}
            <div>
              <label className="block mb-1 text-sm font-medium">NID Number:</label>
              <input
                type="text"
                name="nid"
                value={formData.nid}
                onChange={handleChange}
                placeholder="Enter NID number"
                className="w-full p-2 rounded-md border-transparent bg-[#2D3039] text-[#E5E9F0] focus:ring-2 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            {/* Birth Certificate */}
            <div>
              <label className="block mb-1 text-sm font-medium">Birth Certificate ID:</label>
              <input
                type="text"
                name="birthCertificate"
                value={formData.birthCertificate}
                onChange={handleChange}
                placeholder="Enter birth certificate ID"
                className="w-full p-2 rounded-md border-transparent bg-[#2D3039] text-[#E5E9F0] focus:ring-2 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            {/* Validation Error for IDs */}
            {formErrors.idValidation && (
              <div className="p-2 bg-red-900 text-red-200 rounded-md text-sm">
                {formErrors.idValidation}
              </div>
            )}

            <div className="p-2 bg-blue-900 text-blue-200 rounded-md text-sm">
              💡 You must provide either NID or Birth Certificate ID
            </div>

            {/* Designation */}
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

            {/* Grade */}
            <div>
              <label className="block mb-1 text-sm font-medium">Grade:</label>
              <select
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                className="w-full p-2 rounded-md border-transparent bg-[#2D3039] text-[#E5E9F0] focus:ring-2 focus:ring-indigo-500 sm:text-sm"
                required
              >
                <option value="">Select Grade</option>
                <option value="A">A</option>
                <option value="A+">A+</option>
                <option value="A++">A++</option>
                <option value="B">B</option>
                <option value="B+">B+</option>
                <option value="B++">B++</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="E">E</option>
                <option value="F">F</option>
              </select>
            </div>

            {/* Allowed Processes */}
            <div>
              <label className="block mb-1 text-sm font-medium">
                Allowed Processes 
                <span className="ml-2 text-xs text-gray-400">
                  ({Object.keys(formData.allowedProcesses).length} selected)
                </span>
              </label>
              
              {/* Search */}
              <input
                type="text"
                placeholder="Search process..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full mb-2 p-2 rounded-md border-transparent bg-[#2D3039] text-[#E5E9F0] focus:ring-2 focus:ring-indigo-500 sm:text-sm"
              />

              <div className="max-h-40 overflow-y-auto border border-[#2D3039] rounded-md p-2 bg-[#2D3039]">
                {filteredProcesses.map((process) => {
                  const isSelected = formData.allowedProcesses[process.name] !== undefined;
                  return (
                    <div key={process._id} className="flex items-center gap-2 mb-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleProcessToggle(process.name)}
                      />
                      <span className="flex-1">{process.name}</span>

                      {isSelected && (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={formData.allowedProcesses[process.name]}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            setFormData(prev => ({
                              ...prev,
                              allowedProcesses: {
                                ...prev.allowedProcesses,
                                [process.name]: value
                              }
                            }));
                          }}
                          className="w-16 p-1 rounded-md text-black text-sm"
                        />
                      )}
                    </div>
                  );
                })}
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
    </div>
  );
}
