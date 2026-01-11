'use client';

import { useState, useEffect } from 'react';

export default function ScanInput({
  onScan,
  disabled,
  scanType,
  onScanTypeChange
}) {
  const [scanData, setScanData] = useState('');
  const [isManual, setIsManual] = useState(false);
  const [pendingScans, setPendingScans] = useState([]);

  // ===============================
  // Manual data holder
  // ===============================
  const manualData = {
    id: '',
    operatorId: '',
    name: '',
    designation: '',
    uniqueId: '',
    machineType: ''
  };

  // ===============================
  // Normalize object keys (case-insensitive)
  // ===============================
  const normalizeKeys = (obj) => {
    const normalized = {};
    Object.keys(obj || {}).forEach(key => {
      normalized[key.toLowerCase()] = obj[key];
    });
    return normalized;
  };

  // ===============================
  // Parse multiple JSON safely
  // ===============================
  const parseMultipleJSON = (data) => {
    const objects = [];
    let brace = 0;
    let start = -1;

    for (let i = 0; i < data.length; i++) {
      if (data[i] === '{') {
        if (brace === 0) start = i;
        brace++;
      } else if (data[i] === '}') {
        brace--;
        if (brace === 0 && start !== -1) {
          try {
            const obj = JSON.parse(data.slice(start, i + 1));
            objects.push(normalizeKeys(obj));
          } catch {}
          start = -1;
        }
      }
    }
    return objects;
  };

  // ===============================
  // Auto submit for QR scanner
  // ===============================
  useEffect(() => {
    if (!scanData.trim() || disabled || isManual) return;

    const t = setTimeout(() => {
      handleScanSubmit({ preventDefault: () => {} });
    }, 400);

    return () => clearTimeout(t);
  }, [scanData, disabled, isManual]);

  // ===============================
  // Process pending scans sequentially
  // ===============================
  useEffect(() => {
    if (pendingScans.length === 0) return;

    const scan = pendingScans[0];

    if (scan.type === 'operator') {
      onScan(JSON.stringify(scan));
      setPendingScans(prev => prev.slice(1));
    }

    if (scan.type === 'machine') {
      setTimeout(() => {
        onScan(JSON.stringify(scan));
        setPendingScans(prev => prev.slice(1));
      }, 700);
    }
  }, [pendingScans, onScan]);

  // ===============================
  // MAIN SUBMIT HANDLER
  // ===============================
  const handleScanSubmit = (e) => {
    e.preventDefault?.();

    // ---------- MANUAL ENTRY ----------
    if (isManual) {
      if (scanType === 'operator') {
        onScan(JSON.stringify({
          type: 'operator',
          id: manualData.id || 'manual_' + Date.now(),
          operatorId: manualData.operatorId,
          name: manualData.name,
          designation: manualData.designation
        }));
      }

      if (scanType === 'machine') {
        onScan(JSON.stringify({
          type: 'machine',
          id: manualData.id || 'manual_' + Date.now(),
          uniqueId: manualData.uniqueId,
          machineType: manualData.machineType || 'Unknown'
        }));
      }

      setScanData('');
      return;
    }

    // ---------- QR SCAN ----------
    const parsed = parseMultipleJSON(scanData);

    // No JSON → plain text
    if (parsed.length === 0) {
      onScan(scanData);
      setScanData('');
      return;
    }

    // Single JSON
    if (parsed.length === 1) {
      const d = parsed[0];

      onScan(JSON.stringify({
        type: d.type,
        id: d.id,
        operatorId: d.operatorid,
        name: d.name,
        designation: d.designation || '',
        uniqueId: d.uniqueid,
        machineType: d.machinetype
      }));

      setScanData('');
      return;
    }

    // Multiple JSON → sort operator first
    const sorted = parsed.sort((a, b) => {
      if (a.type === 'operator' && b.type !== 'operator') return -1;
      if (a.type !== 'operator' && b.type === 'operator') return 1;
      return 0;
    });

    setPendingScans(sorted);
    setScanData('');
  };

  // ===============================
  // UI
  // ===============================
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">QR Code Scanner</h2>

        <div className="flex items-center space-x-4">
          <label className="flex items-center text-sm">
            <input
              type="radio"
              checked={scanType === 'operator'}
              onChange={() => onScanTypeChange('operator')}
              className="mr-2"
            />
            Operator
          </label>

          <label className="flex items-center text-sm">
            <input
              type="radio"
              checked={scanType === 'machine'}
              onChange={() => onScanTypeChange('machine')}
              className="mr-2"
            />
            Machine
          </label>

          <button
            onClick={() => setIsManual(!isManual)}
            className="text-sm px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
          >
            {isManual ? 'QR Scan' : 'Manual Entry'}
          </button>
        </div>
      </div>

      {isManual ? (
        <div className="space-y-3 mb-4">
          {scanType === 'operator' ? (
            <>
              <input
                placeholder="Operator ID"
                onChange={e => manualData.operatorId = e.target.value}
                className="w-full border rounded p-2"
              />
              <input
                placeholder="Operator Name"
                onChange={e => manualData.name = e.target.value}
                className="w-full border rounded p-2"
              />
              <input
                placeholder="Designation"
                onChange={e => manualData.designation = e.target.value}
                className="w-full border rounded p-2"
              />
            </>
          ) : (
            <>
              <input
                placeholder="Machine ID"
                onChange={e => manualData.uniqueId = e.target.value}
                className="w-full border rounded p-2"
              />
              <input
                placeholder="Machine Type"
                onChange={e => manualData.machineType = e.target.value}
                className="w-full border rounded p-2"
              />
            </>
          )}
        </div>
      ) : (
        <textarea
          value={scanData}
          onChange={(e) => setScanData(e.target.value)}
          disabled={disabled}
          rows={3}
          placeholder="Scan QR code..."
          className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
        />
      )}

      <div className="flex justify-between items-center mt-4">
        <span className="text-sm text-yellow-600">
          {pendingScans.length > 0 && `⏳ Processing ${pendingScans.length} scan(s)...`}
        </span>

        <button
          onClick={handleScanSubmit}
          disabled={disabled || (!scanData.trim() && !isManual)}
          className={`px-6 py-2 rounded-lg font-medium ${
            disabled || (!scanData.trim() && !isManual)
              ? 'bg-gray-300 text-gray-500'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {isManual ? 'Add' : 'Scan'}
        </button>
      </div>
    </div>
  );
}
