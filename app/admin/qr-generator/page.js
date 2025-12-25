"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import QRCode from "qrcode";
import { useReactToPrint } from "react-to-print";
import Select from 'react-select';

export default function QRBulkGeneratorPage() {
  const [allOperators, setAllOperators] = useState([]);
  const [allMachines, setAllMachines] = useState([]);
  const [selectedOperators, setSelectedOperators] = useState([]);
  const [selectedMachines, setSelectedMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedQRCodes, setGeneratedQRCodes] = useState({
    operators: [],
    machines: [],
  });
  const [showOperators, setShowOperators] = useState(true);
  const [showMachines, setShowMachines] = useState(true);
  const [scanTestResult, setScanTestResult] = useState(null);
  const printRef = useRef();

  // Fetch all operators and machines
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Fetch operators
      const operatorsRes = await fetch("/api/operators");
      const operatorsData = await operatorsRes.json();
      setAllOperators(operatorsData);

      // Fetch machines
      const machinesRes = await fetch("/api/machines");
      const machinesData = await machinesRes.json();
      setAllMachines(machinesData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare operator options for select
  const operatorOptions = useMemo(() => {
    return allOperators.map(operator => ({
      value: operator._id,
      label: `${operator.operatorId} - ${operator.name} (${operator.designation})`,
      operator: operator
    }));
  }, [allOperators]);

  // Prepare machine options for select
  const machineOptions = useMemo(() => {
    return allMachines.map(machine => ({
      value: machine._id,
      label: `${machine.uniqueId} - ${machine.machineType?.name || 'Unknown'} (${machine.currentStatus})`,
      machine: machine
    }));
  }, [allMachines]);

  const generateSelectedQRCodes = async () => {
    setGenerating(true);
    setScanTestResult(null);

    try {
      const operatorQRCodes = [];
      const machineQRCodes = [];

      // Generate QR codes for selected operators
      for (const option of selectedOperators) {
        const operator = option.operator;
        const qrData = {
          type: "operator",
          id: operator._id,
          operatorId: operator.operatorId,
          name: operator.name,
          designation: operator.designation,
        };

        const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));
        
        operatorQRCodes.push({
          ...operator,
          qrCode,
          qrData: JSON.stringify(qrData),
        });
      }

      // Generate QR codes for selected machines
      for (const option of selectedMachines) {
        const machine = option.machine;
        const qrData = {
          type: "machine",
          id: machine._id,
          uniqueId: machine.uniqueId,
          machineType: machine.machineType?.name || "Unknown",
        };

        const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));
        
        machineQRCodes.push({
          ...machine,
          qrCode,
          qrData: JSON.stringify(qrData),
        });
      }

      setGeneratedQRCodes({
        operators: operatorQRCodes,
        machines: machineQRCodes,
      });

    } catch (error) {
      console.error("Error generating QR codes:", error);
      alert("Error generating QR codes");
    } finally {
      setGenerating(false);
    }
  };

  const generateAllQRCodes = async () => {
    // Select all operators and machines
    setSelectedOperators(operatorOptions);
    setSelectedMachines(machineOptions);
    
    // Generate QR codes for all
    setGenerating(true);
    setScanTestResult(null);

    try {
      const operatorQRCodes = [];
      const machineQRCodes = [];

      // Generate QR codes for all operators
      for (const operator of allOperators) {
        const qrData = {
          type: "operator",
          id: operator._id,
          operatorId: operator.operatorId,
          name: operator.name,
          designation: operator.designation,
        };

        const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));
        
        operatorQRCodes.push({
          ...operator,
          qrCode,
          qrData: JSON.stringify(qrData),
        });
      }

      // Generate QR codes for all machines
      for (const machine of allMachines) {
        const qrData = {
          type: "machine",
          id: machine._id,
          uniqueId: machine.uniqueId,
          machineType: machine.machineType?.name || "Unknown",
        };

        const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));
        
        machineQRCodes.push({
          ...machine,
          qrCode,
          qrData: JSON.stringify(qrData),
        });
      }

      setGeneratedQRCodes({
        operators: operatorQRCodes,
        machines: machineQRCodes,
      });

    } catch (error) {
      console.error("Error generating QR codes:", error);
      alert("Error generating QR codes");
    } finally {
      setGenerating(false);
    }
  };

  const clearSelection = () => {
    setSelectedOperators([]);
    setSelectedMachines([]);
    setGeneratedQRCodes({
      operators: [],
      machines: [],
    });
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    pageStyle: `
      @media print {
        @page {
          size: A4;
          margin: 0.5cm;
        }
        body {
          -webkit-print-color-adjust: exact;
        }
        .no-print {
          display: none !important;
        }
        .qr-card {
          page-break-inside: avoid;
        }
      }
    `,
  });

  const scanQRCode = (qrData, type, item) => {
    try {
      const parsedData = JSON.parse(qrData);
      
      setScanTestResult({
        success: true,
        type,
        data: parsedData,
        item: item,
        timestamp: new Date().toLocaleTimeString(),
      });

      // Play success sound
      const audio = new Audio("/success-beep.mp3");
      audio.play().catch(() => {});

    } catch (error) {
      setScanTestResult({
        success: false,
        error: "Invalid QR code format",
        timestamp: new Date().toLocaleTimeString(),
      });

      // Play error sound
      const audio = new Audio("/error-beep.mp3");
      audio.play().catch(() => {});
    }
  };

  const downloadAllQRCodes = async () => {
    if (!generatedQRCodes.operators.length && !generatedQRCodes.machines.length) {
      alert("Please generate QR codes first");
      return;
    }

    const allItems = [
      ...generatedQRCodes.operators.map(op => ({
        ...op,
        type: "operator"
      })),
      ...generatedQRCodes.machines.map(machine => ({
        ...machine,
        type: "machine"
      }))
    ];

    const csvContent = "data:text/csv;charset=utf-8," + 
      "Type,ID,Name/Unique ID,QR Code Data\n" +
      allItems.map(item => 
        `${item.type === "operator" ? "Operator" : "Machine"},` +
        `${item._id},` +
        `${item.type === "operator" ? item.name : item.uniqueId},` +
        `"${item.qrData.replace(/"/g, '""')}"`
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "selected_qr_codes.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadIndividualQR = (item, type) => {
    const link = document.createElement("a");
    link.href = item.qrCode;
    link.download = `${type}_${type === "operator" ? item.operatorId : item.uniqueId}_qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Selective QR Code Generator
          </h1>
          <p className="text-gray-600">
            Select operators and machines to generate QR codes
          </p>
        </div>

        {/* Stats and Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Operators Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-blue-700 mb-4">
              Select Operators ({selectedOperators.length} selected)
            </h2>
            <div className="mb-4">
              <Select
                isMulti
                options={operatorOptions}
                value={selectedOperators}
                onChange={setSelectedOperators}
                placeholder="Search and select operators..."
                className="react-select-container"
                classNamePrefix="react-select"
                isLoading={loading}
                isClearable={true}
                closeMenuOnSelect={false}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedOperators(operatorOptions)}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                Select All Operators
              </button>
              <button
                onClick={() => setSelectedOperators([])}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Clear Selection
              </button>
            </div>
          </div>

          {/* Machines Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-green-700 mb-4">
              Select Machines ({selectedMachines.length} selected)
            </h2>
            <div className="mb-4">
              <Select
                isMulti
                options={machineOptions}
                value={selectedMachines}
                onChange={setSelectedMachines}
                placeholder="Search and select machines..."
                className="react-select-container"
                classNamePrefix="react-select"
                isLoading={loading}
                isClearable={true}
                closeMenuOnSelect={false}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedMachines(machineOptions)}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
              >
                Select All Machines
              </button>
              <button
                onClick={() => setSelectedMachines([])}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>

        {/* Stats and Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Total Operators</div>
            <div className="text-2xl font-bold text-blue-600">{allOperators.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Total Machines</div>
            <div className="text-2xl font-bold text-green-600">{allMachines.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Selected Items</div>
            <div className="text-2xl font-bold text-purple-600">
              {selectedOperators.length + selectedMachines.length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Generated QR Codes</div>
            <div className="text-2xl font-bold text-orange-600">
              {generatedQRCodes.operators.length + generatedQRCodes.machines.length}
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="bg-white rounded-lg shadow p-6 mb-8 no-print">
          <h2 className="text-xl font-semibold mb-4">Controls</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Toggle Buttons */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Show/Hide Sections
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowOperators(!showOperators)}
                  disabled={generatedQRCodes.operators.length === 0}
                  className={`px-4 py-2 rounded-md ${showOperators ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} ${generatedQRCodes.operators.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {showOperators ? 'Hide' : 'Show'} Operators ({generatedQRCodes.operators.length})
                </button>
                <button
                  onClick={() => setShowMachines(!showMachines)}
                  disabled={generatedQRCodes.machines.length === 0}
                  className={`px-4 py-2 rounded-md ${showMachines ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'} ${generatedQRCodes.machines.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {showMachines ? 'Hide' : 'Show'} Machines ({generatedQRCodes.machines.length})
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Actions
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={generateSelectedQRCodes}
                  disabled={loading || generating || (selectedOperators.length === 0 && selectedMachines.length === 0)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? 'Generating...' : 'Generate Selected QR Codes'}
                </button>
                
                <button
                  onClick={generateAllQRCodes}
                  disabled={loading || generating}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Generate All QR Codes
                </button>
                
                <button
                  onClick={clearSelection}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Clear All
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  onClick={handlePrint}
                  disabled={generatedQRCodes.operators.length === 0 && generatedQRCodes.machines.length === 0}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Print Selected
                </button>
                
                <button
                  onClick={downloadAllQRCodes}
                  disabled={generatedQRCodes.operators.length === 0 && generatedQRCodes.machines.length === 0}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Download CSV
                </button>
              </div>
            </div>
          </div>

          {/* Scan Test Area */}
          {scanTestResult && (
            <div className={`p-4 rounded-md mb-4 ${scanTestResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className={`font-semibold ${scanTestResult.success ? 'text-green-800' : 'text-red-800'}`}>
                    {scanTestResult.success ? '✓ Scan Successful' : '✗ Scan Failed'}
                  </h3>
                  <p className={`text-sm ${scanTestResult.success ? 'text-green-600' : 'text-red-600'}`}>
                    {scanTestResult.success ? (
                      <>
                        Scanned {scanTestResult.type}: {scanTestResult.type === 'operator' ? scanTestResult.item.name : scanTestResult.item.uniqueId}
                        <br />
                        ID: {scanTestResult.data.operatorId || scanTestResult.data.uniqueId}
                      </>
                    ) : (
                      scanTestResult.error
                    )}
                  </p>
                </div>
                <div className="text-xs text-gray-500">
                  {scanTestResult.timestamp}
                </div>
              </div>
              
              {scanTestResult.success && (
                <div className="mt-3 p-3 bg-white rounded border">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(scanTestResult.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">Instructions:</h3>
            <ol className="list-decimal pl-5 text-yellow-700 text-sm space-y-1">
              <li>Select operators and machines from the dropdowns above</li>
              <li>Click Generate Selected QR Codes to create QR codes for selected items</li>
              <li>Click Generate All QR Codes to create QR codes for all items</li>
              <li>Click Print Selected to print all generated QR codes</li>
              <li>Use a QR scanner app on your phone to test each code</li>
              <li>Click on any QR code to simulate scanning and test functionality</li>
              <li>Download individual QR codes by clicking the download button on each card</li>
            </ol>
          </div>
        </div>

        {/* QR Codes Display */}
        <div ref={printRef} className="bg-white rounded-lg shadow">
          {/* Operators Section */}
          {showOperators && generatedQRCodes.operators.length > 0 && (
            <div className="p-6 border-b">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-blue-700">
                  Operator QR Codes ({generatedQRCodes.operators.length})
                </h2>
                <span className="text-sm text-gray-500">
                  Click QR code to test scan
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {generatedQRCodes.operators.map((operator) => (
                  <div 
                    key={operator._id} 
                    className="qr-card bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => scanQRCode(operator.qrData, 'operator', operator)}
                  >
                    <div className="flex flex-col items-center">
                      {/* QR Code */}
                      <div className="mb-3 p-2 bg-white border rounded">
                        <img 
                          src={operator.qrCode} 
                          alt={`QR for ${operator.name}`}
                          className="w-32 h-32"
                        />
                      </div>
                      
                      {/* Operator Info */}
                      <div className="text-center w-full">
                        <h3 className="font-bold text-gray-800 truncate">{operator.name}</h3>
                        <div className="text-sm text-gray-600 mt-1 space-y-1">
                          <div className="flex justify-between">
                            <span className="font-medium">ID:</span>
                            <span>{operator.operatorId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Designation:</span>
                            <span>{operator.designation}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Grade:</span>
                            <span>{operator.grade}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Download Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadIndividualQR(operator, 'operator');
                        }}
                        className="mt-3 px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 border border-gray-300"
                      >
                        Download QR
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Machines Section */}
          {showMachines && generatedQRCodes.machines.length > 0 && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-green-700">
                  Machine QR Codes ({generatedQRCodes.machines.length})
                </h2>
                <span className="text-sm text-gray-500">
                  Click QR code to test scan
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {generatedQRCodes.machines.map((machine) => (
                  <div 
                    key={machine._id} 
                    className="qr-card bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => scanQRCode(machine.qrData, 'machine', machine)}
                  >
                    <div className="flex flex-col items-center">
                      {/* QR Code */}
                      <div className="mb-3 p-2 bg-white border rounded">
                        <img 
                          src={machine.qrCode} 
                          alt={`QR for ${machine.uniqueId}`}
                          className="w-32 h-32"
                        />
                      </div>
                      
                      {/* Machine Info */}
                      <div className="text-center w-full">
                        <h3 className="font-bold text-gray-800 truncate">{machine.uniqueId}</h3>
                        <div className="text-sm text-gray-600 mt-1 space-y-1">
                          <div className="flex justify-between">
                            <span className="font-medium">Type:</span>
                            <span>{machine.machineType?.name || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Status:</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${machine.currentStatus === 'idle' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {machine.currentStatus}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Parts:</span>
                            <span>{machine.parts?.length || 0}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Download Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadIndividualQR(machine, 'machine');
                        }}
                        className="mt-3 px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 border border-gray-300"
                      >
                        Download QR
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!generating && generatedQRCodes.operators.length === 0 && generatedQRCodes.machines.length === 0 && (
            <div className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No QR Codes Generated</h3>
              <p className="text-gray-500 mb-4">
                Select operators and machines from the dropdowns above, then click Generate Selected QR Codes.
              </p>
              <p className="text-gray-400 text-sm mb-6">
                Selected: {selectedOperators.length} operators, {selectedMachines.length} machines
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={generateSelectedQRCodes}
                  disabled={loading || generating || (selectedOperators.length === 0 && selectedMachines.length === 0)}
                  className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Generate Selected QR Codes
                </button>
                <button
                  onClick={generateAllQRCodes}
                  disabled={loading || generating}
                  className="px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Generate All QR Codes
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Print Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 no-print">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Printing Instructions:</h3>
          <ul className="list-disc pl-5 text-blue-700 space-y-1">
            <li>Select items from dropdowns and generate QR codes</li>
            <li>Click Print Selected button to print generated QR codes</li>
            <li>For best results, use A4 paper size</li>
            <li>Each QR code is designed to be cut and pasted on machines/operator cards</li>
            <li>Test each QR code with a scanner before permanent placement</li>
            <li>Keep a digital backup of all QR codes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}