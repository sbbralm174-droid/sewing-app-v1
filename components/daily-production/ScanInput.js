'use client';

import { useState, useEffect, useRef } from 'react';

export default function ScanInput({ 
  onScan, 
  disabled,
  scanType,
  onScanTypeChange 
}) {
  const [scanData, setScanData] = useState('');
  const [isManual, setIsManual] = useState(false);
  const [pendingScans, setPendingScans] = useState([]); // ✅ পেন্ডিং স্ক্যান সংরক্ষণ

  const manualData = {
    id: '',
    operatorId: '',
    name: '',
    designation: '',
    uniqueId: '',
    machineType: ''
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
            objects.push(obj);
          } catch {}
          start = -1;
        }
      }
    }
    return objects;
  };

  // ===============================
  // Auto submit (QR scanner)
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
    if (pendingScans.length > 0) {
      const processNext = async () => {
        const scan = pendingScans[0];
        
        // অপারেটর স্ক্যান হলে তাকে প্রথমে প্রসেস করবে
        if (scan.type === 'operator') {
          onScan(JSON.stringify(scan));
          setPendingScans(prev => prev.slice(1));
        } 
        // মেশিন স্ক্যান হলে অপারেটরের জন্য অপেক্ষা করবে
        else if (scan.type === 'machine') {
  setTimeout(() => {
    onScan(JSON.stringify(scan));
    setPendingScans(prev => prev.slice(1));
  }, 700); // operator state settle করার সময় দিন
}

      };

      processNext();
    }
  }, [pendingScans, onScan]);

  // ===============================
  // MAIN SUBMIT HANDLER
  // ===============================
  const handleScanSubmit = (e) => {
    e.preventDefault?.();

    // ---------- MANUAL ----------
    if (isManual) {
      if (scanType === 'operator') {
        onScan(JSON.stringify({
          type: 'operator',
          id: manualData.id || 'manual_' + Date.now(),
          operatorId: manualData.operatorId,
          name: manualData.name,
          designation: manualData.designation
        }));
      } else if (scanType === 'machine') {
        onScan(JSON.stringify({
          type: 'machine',
          id: manualData.id || 'manual_' + Date.now(),
          uniqueId: manualData.uniqueId,
          machineType: manualData.machineType || 'Unknown'
        }));
      }
    }

    // ---------- QR SCAN ----------
    else {
      const parsed = parseMultipleJSON(scanData);

      if (parsed.length === 0) {
        // যদি JSON না থাকে, সাধারণ টেক্সট হিসেবে প্রসেস করুন
        onScan(scanData);
      } else if (parsed.length === 1) {
        // একটিমাত্র JSON থাকলে সরাসরি প্রসেস করুন
        onScan(JSON.stringify(parsed[0]));
      } else {
        // একাধিক JSON থাকলে পেন্ডিং তালিকায় যোগ করুন
        // প্রথমে অপারেটর, তারপর মেশিন - এই অর্ডারে সাজান
        const sortedScans = parsed.sort((a, b) => {
          if (a.type === 'operator' && b.type !== 'operator') return -1;
          if (a.type !== 'operator' && b.type === 'operator') return 1;
          return 0;
        });

        setPendingScans(sortedScans);
      }
    }

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
          <div className="flex items-center">
            <input
              type="radio"
              id="operator"
              name="scanType"
              checked={scanType === 'operator'}
              onChange={() => onScanTypeChange('operator')}
              className="mr-2"
            />
            <label htmlFor="operator" className="text-sm">Operator</label>
          </div>
          <div className="flex items-center">
            <input
              type="radio"
              id="machine"
              name="scanType"
              checked={scanType === 'machine'}
              onChange={() => onScanTypeChange('machine')}
              className="mr-2"
            />
            <label htmlFor="machine" className="text-sm">Machine</label>
          </div>
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
                type="text"
                name="operatorId"
                placeholder="Operator ID"
                onChange={(e) => manualData.operatorId = e.target.value}
                className="w-full border rounded p-2"
              />
              <input
                type="text"
                name="name"
                placeholder="Operator Name"
                onChange={(e) => manualData.name = e.target.value}
                className="w-full border rounded p-2"
              />
              <input
                type="text"
                name="designation"
                placeholder="Designation"
                onChange={(e) => manualData.designation = e.target.value}
                className="w-full border rounded p-2"
              />
            </>
          ) : (
            <>
              <input
                type="text"
                name="uniqueId"
                placeholder="Machine ID"
                onChange={(e) => manualData.uniqueId = e.target.value}
                className="w-full border rounded p-2"
              />
              <input
                type="text"
                name="machineType"
                placeholder="Machine Type"
                onChange={(e) => manualData.machineType = e.target.value}
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
          placeholder="Scan operator and machine QR codes together..."
          rows={3}
          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      )}

      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-600">
          {pendingScans.length > 0 && (
            <span className="text-yellow-600">
              ⏳ Processing {pendingScans.length} scan(s)...
            </span>
          )}
        </div>
        <button
          onClick={handleScanSubmit}
          disabled={disabled || (!scanData.trim() && !isManual)}
          className={`px-6 py-2 rounded-lg font-medium ${
            disabled || (!scanData.trim() && !isManual)
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700 transition-colors'
          }`}
        >
          {isManual ? 'Add' : 'Scan'}
        </button>
      </div>

      
    </div>
  );
}