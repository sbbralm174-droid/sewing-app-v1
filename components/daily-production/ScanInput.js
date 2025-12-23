'use client';

import { useState, useEffect } from 'react'; // useEffect add kora hoise

export default function ScanInput({ 
  onScan, 
  disabled,
  scanType,
  onScanTypeChange 
}) {
  const [scanData, setScanData] = useState('');
  const [isManual, setIsManual] = useState(false);
  const [manualData, setManualData] = useState({
    id: '',
    operatorId: '',
    name: '',
    designation: '',
    uniqueId: '',
    machineType: ''
  });

  // Auto-submit effect
  useEffect(() => {
    if (scanData.trim() && !disabled && !isManual) {
      const timer = setTimeout(() => {
        // Create a synthetic event
        const syntheticEvent = { preventDefault: () => {} };
        handleScanSubmit(syntheticEvent);
      }, 500); // 500ms delay for user to see what was scanned
      
      return () => clearTimeout(timer);
    }
  }, [scanData, disabled, isManual]);

  const handleScanSubmit = (e) => {
    if (e.preventDefault) e.preventDefault();
    
    if (isManual && scanType === 'operator') {
      const operatorData = {
        type: 'operator',
        id: manualData.id || 'manual-id',
        operatorId: manualData.operatorId,
        name: manualData.name,
        designation: manualData.designation
      };
      onScan(JSON.stringify(operatorData));
    } else if (isManual && scanType === 'machine') {
      const machineData = {
        type: 'machine',
        id: manualData.id || 'manual-id',
        uniqueId: manualData.uniqueId,
        machineType: manualData.machineType || 'Unknown'
      };
      onScan(JSON.stringify(machineData));
    } else if (scanData.trim()) {
      onScan(scanData);
    }
    setScanData('');
    setManualData({
      id: '',
      operatorId: '',
      name: '',
      designation: '',
      uniqueId: '',
      machineType: ''
    });
  };

  const handleManualDataChange = (e) => {
    const { name, value } = e.target;
    setManualData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">QR Code Scanner</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Scan Type:</label>
            <select
              value={scanType}
              onChange={(e) => onScanTypeChange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="operator">Operator</option>
              <option value="machine">Machine</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => setIsManual(!isManual)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {isManual ? 'Use QR Scan' : 'Manual Entry'}
          </button>
        </div>
      </div>

      {isManual ? (
        <form onSubmit={handleScanSubmit} className="space-y-4">
          {scanType === 'operator' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Operator ID
                  </label>
                  <input
                    type="text"
                    name="operatorId"
                    value={manualData.operatorId}
                    onChange={handleManualDataChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="TGS-005754"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={manualData.name}
                    onChange={handleManualDataChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="MST. ASMA AKTER"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    name="designation"
                    value={manualData.designation}
                    onChange={handleManualDataChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="OPERATOR"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID
                  </label>
                  <input
                    type="text"
                    name="id"
                    value={manualData.id}
                    onChange={handleManualDataChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="6947bef508ac0c7b97ac99d8"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Machine Unique ID
                  </label>
                  <input
                    type="text"
                    name="uniqueId"
                    value={manualData.uniqueId}
                    onChange={handleManualDataChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="GT-BTK-40"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Machine Type
                  </label>
                  <input
                    type="text"
                    name="machineType"
                    value={manualData.machineType}
                    onChange={handleManualDataChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Unknown"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID
                  </label>
                  <input
                    type="text"
                    name="id"
                    value={manualData.id}
                    onChange={handleManualDataChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="6947cd7108ac0c7b97ac9a2c"
                  />
                </div>
              </div>
            </>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={disabled}
              className={`px-4 py-2 rounded-md ${
                disabled 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'
              } text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors`}
            >
              Add {scanType === 'operator' ? 'Operator' : 'Machine'}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleScanSubmit} className="space-y-4">
          <div>
            <label htmlFor="scanData" className="block text-sm font-medium text-gray-700 mb-1">
              {scanType === 'operator' ? 'Operator' : 'Machine'} QR Code Data
            </label>
            <textarea
              id="scanData"
              value={scanData}
              onChange={(e) => setScanData(e.target.value)}
              onPaste={(e) => {
                const pastedData = e.clipboardData.getData('text');
                setScanData(pastedData);
                // Auto-submit for all pasted data (not just JSON)
                setTimeout(() => {
                  handleScanSubmit(e);
                }, 100);
              }}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder={`Paste ${scanType === 'operator' ? 'operator' : 'machine'} QR code data here...`}
              rows="3"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Data paste korle 500ms er moddhe auto scan hobe
            </p>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={disabled || !scanData.trim()}
              className={`px-4 py-2 rounded-md ${
                disabled || !scanData.trim()
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'
              } text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors`}
            >
              Scan {scanType === 'operator' ? 'Operator' : 'Machine'} QR
            </button>
          </div>
        </form>
      )}
    </div>
  );
}