export default function HeaderForm({ 
  formData, buyers, filteredStyles, excelFiles, selectedFileId, 
  breakdownProcesses, isLoading, isLoadingFiles, isHeaderComplete,
  onInputChange, onFileSelect 
}) {
  return (
    <div className="bg-white mt-10 rounded-lg shadow p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
        Production Header Information
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Buyer */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buyer *
          </label>
          <select
            name="buyer"
            value={formData.buyer}
            onChange={onInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select Buyer</option>
            {buyers.map((buyer) => (
              <option key={buyer._id} value={buyer._id}>
                {buyer.name}
              </option>
            ))}
          </select>
          {isLoading && (
            <div className="text-xs text-gray-500 mt-1">Loading buyers...</div>
          )}
        </div>

        {/* Style */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Style *
            {formData.buyer && (
              <span className="text-xs text-gray-500 ml-2">
                ({filteredStyles.length} styles available)
              </span>
            )}
          </label>
          <select
            name="style"
            value={formData.style}
            onChange={onInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={!formData.buyer || filteredStyles.length === 0}
          >
            <option value="">
              {!formData.buyer 
                ? "Select buyer first" 
                : filteredStyles.length === 0 
                  ? "No styles found for this buyer" 
                  : "Select Style"}
            </option>
            {filteredStyles.map((style) => (
              <option key={style._id} value={style._id}>
                {style.name}
              </option>
            ))}
          </select>
          {formData.buyer && filteredStyles.length === 0 && !isLoading && (
            <div className="text-xs text-red-500 mt-1">
              No styles found for selected buyer
            </div>
          )}
        </div>

        {/* Excel File Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Excel File (for Breakdown Processes)
            {selectedFileId && breakdownProcesses.length > 0 && (
              <span className="text-xs text-green-600 ml-2">
                ({breakdownProcesses.length} breakdown processes loaded)
              </span>
            )}
          </label>
          <select
            value={selectedFileId}
            onChange={(e) => onFileSelect(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoadingFiles}
          >
            <option value="">Select Excel File</option>
            {excelFiles.map((file) => (
              <option key={file._id} value={file._id}>
                {file.fileName}
              </option>
            ))}
          </select>
          {isLoadingFiles && (
            <div className="text-xs text-gray-500 mt-1">Loading files...</div>
          )}
          {selectedFileId && (
            <div className="text-xs text-gray-500 mt-1">
              Select a file to load breakdown processes
            </div>
          )}
        </div>

        {/* Supervisor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Supervisor *
          </label>
          <input
            type="text"
            name="supervisor"
            value={formData.supervisor}
            onChange={onInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter supervisor name"
            required
          />
        </div>

        {/* Floor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Floor *
          </label>
          <input
            type="text"
            name="floor"
            value={formData.floor}
            onChange={onInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 1st Floor"
            required
          />
        </div>

        {/* Line */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Line *
          </label>
          <input
            type="text"
            name="line"
            value={formData.line}
            onChange={onInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Line-01"
            required
          />
        </div>

        {/* Status */}
        {/* <div className="flex items-end">
          <div className="w-full p-3 bg-gray-50 rounded-md">
            <div className="text-sm text-gray-600">Header Status:</div>
            <div className={`font-medium ${isHeaderComplete ? 'text-green-600' : 'text-red-600'}`}>
              {isHeaderComplete 
                ? "✓ Complete - Ready to scan" 
                : "✗ Incomplete - Fill all fields"}
            </div>
            {formData.buyer && formData.style && (
              <div className="text-xs text-green-600 mt-1">
                ✓ Style matched with buyer
              </div>
            )}
            {selectedFileId && breakdownProcesses.length > 0 && (
              <div className="text-xs text-green-600 mt-1">
                ✓ Breakdown processes loaded
              </div>
            )}
          </div>
        </div> */}
      </div>
    </div>
  );
}