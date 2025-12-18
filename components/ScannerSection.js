export default function ScannerSection({
  scanInput,
  scanFocus,
  scanInputRef,
  onScanChange,
  onScanFocus,
  onScanBlur,
  onClearScan
}) {
  return (
    <div className="mb-6 bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          QR Code Scanner
        </h2>
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${scanFocus ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="text-sm text-gray-600">
            {scanFocus ? 'Scanner Active' : 'Click to Activate'}
          </span>
        </div>
      </div>
      
      <div className="relative">
        <input
          ref={scanInputRef}
          type="text"
          value={scanInput}
          onChange={onScanChange}
          onFocus={onScanFocus}
          onBlur={onScanBlur}
          className="w-full px-4 py-4 text-lg border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-200 font-mono"
          placeholder="Point QR scanner here or type manually..."
          autoFocus
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 bg-blue-50 px-2 py-1 rounded">
              Auto-detect
            </span>
            <button
              onClick={onClearScan}
              className="text-gray-400 hover:text-gray-600"
              title="Clear"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}