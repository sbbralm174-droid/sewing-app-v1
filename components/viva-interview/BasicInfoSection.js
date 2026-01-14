'use client'

import { useEffect } from 'react';

export default function BasicInfoSection({ formData, onChange }) {
  
  useEffect(() => {
    // Interview Date jodi na thake, tobe default ajker date set hobe
    if (!formData.interviewDate) {
      const today = new Date().toISOString().split('T')[0];
      onChange({ target: { name: 'interviewDate', value: today } });
    }
    // Department default set kora
    if (!formData.department) {
      onChange({ target: { name: 'department', value: 'SEWING' } });
    }
  }, []);

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-3 text-indigo-600">Interview Basic Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Interview Date */}
        <div>
          <label className="block mb-1 text-lg font-medium text-black-700">
            Interview Date: <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="date"
            name="interviewDate"
            // defaultValue poriborte value use kora bhalo controlled component-er jonno
            value={formData.interviewDate || ""} 
            onChange={onChange}
            className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
            required
          />
        </div>

        {/* Interviewer */}
        <div>
          <label className="block mb-1 text-lg font-medium text-black-700">
            Interviewer: <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            name="interviewer"
            value={formData.interviewer || ""}
            onChange={onChange}
            className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
            required
          >
            <option value="" disabled>Select Interviewer</option>
            <option value="MAHAFUZ">MAHAFUZ</option>
            <option value="MUSTAKIM">MUSTAKIM</option>
          </select>
        </div>

        {/* Department */}
        <div>
          <label className="block mb-1 text-lg font-medium text-black-700">
            Department: <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            name="department"
            value={formData.department || "SEWING"}
            onChange={onChange}
            className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
            required
          >
            <option value="SEWING">SEWING</option>
            <option value="FINISHING">FINISHING</option>
          </select>
        </div>
      </div>
    </div>
  );
}