// components/viva-interview/ResultSection.js
'use client'

export default function ResultSection({ formData, onChange }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-3 text-indigo-600">Result</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Grade:</label>
          <select
            name="grade"
            value={formData.grade}
            onChange={onChange}
            className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
            required
          >
            <option value="A">A</option>
            <option value="A+">A+</option>
            <option value="A++">A++</option>
            <option value="B">B</option>
            <option value="B+">B+</option>
            <option value="Unskill">Unskill</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Result:</label>
          <select
            name="result"
            value={formData.result}
            onChange={onChange}
            className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
            required
          >
            {/* <option value="PENDING">PENDING</option> */}
            <option value="PASSED">PASSED</option>
            {/* <option value="FAILED">FAILED</option> */}
          </select>
        </div>

        
      </div>

      <div className="mt-4">
        <label className="block mb-1 text-sm font-medium text-gray-700">Remarks:</label>
        <textarea
          name="remarks"
          value={formData.remarks}
          onChange={onChange}
          className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
          rows="3"
        />
      </div>

      {formData.result === 'FAILED' && (
        <div className="mt-4">
          <label className="block mb-1 text-sm font-medium text-gray-700">Canceled Reason:</label>
          <input
            type="text"
            name="canceledReason"
            value={formData.canceledReason}
            onChange={onChange}
            className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
          />
        </div>
      )}
    </div>
  );
}