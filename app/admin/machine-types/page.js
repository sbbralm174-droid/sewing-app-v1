'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SidebarNavLayout from '@/components/SidebarNavLayout';

export default function MachineTypeForm() {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/machine-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
  
      <div className="min-h-screen bg-[#1A1B22] text-[#E5E9F0] font-sans flex items-center justify-center p-4">
        <SidebarNavLayout/>
          <div className="w-full max-w-lg bg-[#1A1B22] p-6 rounded-lg shadow-lg border border-[#2D3039]">
          <h1 className="text-2xl font-bold mb-6 text-center">Add New Machine Type</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium">Name:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-2 rounded-md border-transparent bg-[#2D3039] text-[#E5E9F0] shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Description:</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-2 rounded-md border-transparent bg-[#2D3039] text-[#E5E9F0] shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                rows="3"
              />
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
    
  );
}
