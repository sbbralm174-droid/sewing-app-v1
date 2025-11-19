// components/viva-interview/BasicInfoSection.js
'use client'

export default function BasicInfoSection({ formData, onChange }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-3 text-indigo-600">Interview Basic Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block mb-1 text-lg font-medium text-black-700">
            Interview Date:
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="date"
            name="interviewDate"
            value={formData.interviewDate}
            onChange={onChange}
            className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
            required
          />
        </div>

        <div>
          <label className="block mb-1 text-lg font-medium text-black-700">
            Interviewer:
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            name="interviewer"
            value={formData.interviewer}
            onChange={onChange}
            className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
            required
          />
        </div>

        <div>
          <label className="block mb-1 text-lg font-medium text-black-700">
            Department:
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            name="department"
            value={formData.department}
            onChange={onChange}
            className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
            required
          />
        </div>
      </div>
    </div>
  );
}