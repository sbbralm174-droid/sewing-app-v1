'use client';

export default function ProductionForm({ 
  formData, 
  onFormChange, 
  onFormSubmit,
  buyers = [],
  filteredStyles = [],
  floors = [],
  filteredLines = [],
  supervisors = [],
  breakdownFiles = []
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onFormSubmit();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Production Information
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Buyer Dropdown */}
          <div>
            <label htmlFor="buyerId" className="block text-sm font-medium text-gray-700 mb-1">
              Buyer *
            </label>
            <select
              id="buyerId"
              name="buyerId"
              value={formData.buyerId || ''}
              onChange={onFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select Buyer</option>
              {buyers.map(buyer => (
                <option key={buyer._id} value={buyer._id}>
                  {buyer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Style Dropdown - Filtered by buyer */}
          <div>
            <label htmlFor="styleId" className="block text-sm font-medium text-gray-700 mb-1">
              Style *
            </label>
            <select
              id="styleId"
              name="styleId"
              value={formData.styleId || ''}
              onChange={onFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={!formData.buyerId}
            >
              <option value="">{formData.buyerId ? 'Select Style' : 'First select Buyer'}</option>
              {filteredStyles.map(style => (
                <option key={style._id} value={style._id}>
                  {style.name}
                </option>
              ))}
            </select>
          </div>

          {/* Job Number Input */}
          <div>
            <label htmlFor="jobNo" className="block text-sm font-medium text-gray-700 mb-1">
              Job Number
            </label>
            <input
              type="text"
              id="jobNo"
              name="jobNo"
              value={formData.jobNo || ''}
              onChange={onFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter Job Number"
            />
          </div>

          {/* Breakdown Process Dropdown */}
          <div>
            <label htmlFor="breakdownProcess" className="block text-sm font-medium text-gray-700 mb-1">
              Breakdown Process
            </label>
            <select
              id="breakdownProcess"
              name="breakdownProcess"
              value={formData.breakdownProcess || ''}
              onChange={onFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select File</option>
              {breakdownFiles.map(file => (
                <option key={file._id} value={file._id}>
                  {file.fileName}
                </option>
              ))}
            </select>
          </div>

          {/* Supervisor Dropdown */}
          <div>
            <label htmlFor="supervisorId" className="block text-sm font-medium text-gray-700 mb-1">
              Supervisor
            </label>
            <select
              id="supervisorId"
              name="supervisorId"
              value={formData.supervisorId || ''}
              onChange={onFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Supervisor</option>
              {supervisors.map(supervisor => (
                <option key={supervisor._id} value={supervisor._id}>
                  {supervisor.name} ({supervisor.supervisorId})
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date || ''}
              onChange={onFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Floor Dropdown */}
          <div>
            <label htmlFor="floorId" className="block text-sm font-medium text-gray-700 mb-1">
              Floor *
            </label>
            <select
              id="floorId"
              name="floorId"
              value={formData.floorId || ''}
              onChange={onFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select Floor</option>
              {floors.map(floor => (
                <option key={floor._id} value={floor._id}>
                  {floor.floorName}
                </option>
              ))}
            </select>
          </div>

          {/* Line Dropdown - Filtered by floor */}
          <div>
            <label htmlFor="lineId" className="block text-sm font-medium text-gray-700 mb-1">
              Line *
            </label>
            <select
              id="lineId"
              name="lineId"
              value={formData.lineId || ''}
              onChange={onFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={!formData.floorId}
            >
              <option value="">{formData.floorId ? 'Select Line' : 'First select Floor'}</option>
              {filteredLines.map(line => (
                <option key={line._id} value={line._id}>
                  {line.lineNumber}
                </option>
              ))}
            </select>
          </div>

          {/* Breakdown Process Title (read-only) */}
          <div>
            <label htmlFor="breakdownProcessTitle" className="block text-sm font-medium text-gray-700 mb-1">
              Process Title
            </label>
            <input
              type="text"
              id="breakdownProcessTitle"
              name="breakdownProcessTitle"
              value={formData.breakdownProcessTitle || ''}
              onChange={onFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
              placeholder="Auto-filled from file"
              readOnly
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Submit Production Info
          </button>
        </div>
      </form>
    </div>
  );
}