"use client";
import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function MachineScanner() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Camera Scanner Initialization
    const scanner = new Html5QrcodeScanner("reader", {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    });

    scanner.render(onScanSuccess, onScanError);

    async function onScanSuccess(decodedText) {
      // Barcode content process kora
      processScanData(decodedText);
      scanner.clear(); // Scan hoye gele camera bondho korbe
    }

    function onScanError(err) { /* Scan chola kalin error ignore kora jay */ }

    return () => scanner.clear();
  }, []);

  // Main Logic to fetch data from API
  const processScanData = async (scannedText) => {
    setLoading(true);
    setError('');
    try {
      let finalUniqueId = '';

      // Check if scanned text is JSON or plain text
      if (scannedText.startsWith('{')) {
        const parsed = JSON.parse(scannedText);
        finalUniqueId = parsed.UNIQUEiD;
      } else {
        finalUniqueId = scannedText;
      }

      const res = await fetch(`/api/machines/id/${encodeURIComponent(finalUniqueId)}`);
      const data = await res.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to fetch machine data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">Machine Scanner</h1>

        {/* 1. Camera Section */}
        <div id="reader" className="mb-6 overflow-hidden rounded-lg"></div>

        {/* 2. Manual Input for Hardware Scanner */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Hardware Scanner / Manual Input</label>
          <input 
            type="text"
            placeholder="Scan barcode or type Unique ID"
            className="w-full border p-3 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter') processScanData(e.target.value);
            }}
          />
        </div>

        {loading && <div className="text-center py-4">Fetching data...</div>}
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">{error}</div>}

        {/* 3. Result Display UI */}
        {result && (
          <div className="border-t pt-4 animate-in fade-in duration-500">
            <h2 className="text-xl font-bold text-gray-800 mb-2">{result.brandName}</h2>
            <div className="space-y-2 text-sm">
              <p className="flex justify-between border-b py-1">
                <span className="text-gray-500">Unique ID:</span>
                <span className="font-semibold">{result.uniqueId}</span>
              </p>
              <p className="flex justify-between border-b py-1">
                <span className="text-gray-500">Status:</span>
                <span className={`font-bold uppercase ${result.currentStatus === 'running' ? 'text-green-600' : 'text-orange-600'}`}>
                  {result.currentStatus}
                </span>
              </p>
              <p className="flex justify-between border-b py-1">
                <span className="text-gray-500">BRAND:</span>
                <span className={`font-bold uppercase ${result.currentStatus === 'running' ? 'text-green-600' : 'text-orange-600'}`}>
                  {result.brandName}
                </span>
              </p>
              <p className="flex justify-between border-b py-1">
                <span className="text-gray-500">Company Unique No:</span>
                <span className={`font-bold uppercase ${result.currentStatus === 'running' ? 'text-green-600' : 'text-orange-600'}`}>
                  {result.companyUniqueNumber}
                </span>
              </p>
              <p className="flex justify-between border-b py-1">
                <span className="text-gray-500">Installation Date:</span>
                <span className={`font-bold uppercase ${result.currentStatus === 'running' ? 'text-green-600' : 'text-orange-600'}`}>
                  {result.installationDate}
                </span>
              </p>
              <p className="flex justify-between border-b py-1">
                <span className="text-gray-500">Model:</span>
                <span className={`font-bold uppercase ${result.currentStatus === 'running' ? 'text-green-600' : 'text-orange-600'}`}>
                  {result.model}
                </span>
              </p>
              <p className="flex justify-between border-b py-1">
                <span className="text-gray-500">Location:</span>
                <span>{result.lastLocation?.floor}, Line: {result.lastLocation?.line}</span>
              </p>
              <p className="flex justify-between border-b py-1">
                <span className="text-gray-500">Supervisor:</span>
                <span>{result.lastLocation?.supervisor}</span>
              </p>
              <p className="flex justify-between border-b py-1">
                <span className="text-gray-500">Next Service:</span>
                <span>{new Date(result.nextServiceDate).toLocaleDateString()}</span>
              </p>
            </div>

            <div className="mt-4">
              <h3 className="font-bold text-gray-700 mb-2">Machine Parts:</h3>
              <div className="grid grid-cols-1 gap-2">
                {result.parts?.map((part, idx) => (
                  <div key={idx} className="bg-gray-50 p-2 rounded text-xs flex justify-between">
                    <span>{part.partName}</span>
                    <span className="text-gray-400">{part.uniquePartId}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <button 
              onClick={() => window.location.reload()} 
              className="w-full mt-6 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Scan Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}