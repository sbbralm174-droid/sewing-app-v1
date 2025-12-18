// /supervisor/daily-production-by-qrcode

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Swal from "sweetalert2";

export default function DailyProductionPage() {
  const [formData, setFormData] = useState({
    buyer: "",
    style: "",
    supervisor: "",
    floor: "",
    line: "",
  });

  const [tableData, setTableData] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [styles, setStyles] = useState([]);
  const [filteredStyles, setFilteredStyles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHeaderComplete, setIsHeaderComplete] = useState(false);
  const [processes, setProcesses] = useState([]);
  const [filteredProcesses, setFilteredProcesses] = useState([]);
  
  // নতুন state: Excel ফাইলগুলোর জন্য
  const [excelFiles, setExcelFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState("");
  const [breakdownProcesses, setBreakdownProcesses] = useState([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  
  // Scan related states
  const [scanInput, setScanInput] = useState("");
  const [scanFocus, setScanFocus] = useState(false);
  const [lastScannedData, setLastScannedData] = useState("");
  
  const scanInputRef = useRef(null);
  const scanTimeoutRef = useRef(null);

  useEffect(() => {
    fetchProcesses();
    fetchExcelFiles(); // ফাইলগুলো লোড করবে
  }, []);

  const fetchProcesses = async () => {
    try {
      const res = await fetch('/api/processes');
      const data = await res.json();
      setProcesses(data);
    } catch (error) {
      console.error("Error fetching processes:", error);
    }
  };

  // Excel ফাইলগুলো fetch করার ফাংশন
  const fetchExcelFiles = async () => {
    try {
      setIsLoadingFiles(true);
      const res = await fetch('/api/excell-upload/files');
      const data = await res.json();
      if (data.success && data.data) {
        setExcelFiles(data.data);
      }
    } catch (error) {
      console.error("Error fetching Excel files:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load Excel files",
        timer: 2000,
      });
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // ফাইল সিলেক্ট হলে তার ডেটা লোড করবে
  const handleFileSelect = async (fileId) => {
    setSelectedFileId(fileId);
    if (!fileId) {
      setBreakdownProcesses([]);
      return;
    }

    try {
      setIsLoadingFiles(true);
      const res = await fetch(`/api/excell-upload/${fileId}`);
      const data = await res.json();
      
      if (data.success && data.data && data.data.data) {
        // Process নামগুলো extract করবে
        const processesList = data.data.data.map(item => ({
          id: item._id,
          process: item.process,
          sno: item.sno,
          smv: item.smv,
          mcTypeHp: item.mcTypeHp,
          capacity: item.capacity
        }));
        setBreakdownProcesses(processesList);
        
        Swal.fire({
          icon: "success",
          title: "File Loaded!",
          text: `${processesList.length} breakdown processes loaded`,
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error("Error loading file data:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load file data",
        timer: 2000,
      });
      setBreakdownProcesses([]);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Check if header is complete
  useEffect(() => {
    const complete = formData.buyer && formData.style && formData.supervisor && 
                    formData.floor && formData.line;
    setIsHeaderComplete(complete);
    
    if (complete && tableData.length === 0) {
      addNewRow();
    }
  }, [formData, tableData.length]);

  // Buyer change হলে style filter করবে
  useEffect(() => {
    if (formData.buyer && styles.length > 0) {
      const buyerSpecificStyles = styles.filter(
        (style) => style.buyerId?._id === formData.buyer || 
                  style.buyerId === formData.buyer ||
                  style.buyerName === buyers.find(b => b._id === formData.buyer)?.name
      );
      setFilteredStyles(buyerSpecificStyles);
      
      if (formData.style && !buyerSpecificStyles.some(s => s._id === formData.style)) {
        setFormData(prev => ({ ...prev, style: "" }));
      }
    } else {
      setFilteredStyles([]);
      if (formData.style) {
        setFormData(prev => ({ ...prev, style: "" }));
      }
    }
  }, [formData.buyer, styles, buyers, formData.style]);

  // Auto focus on scan input when header is complete
  useEffect(() => {
    if (isHeaderComplete && scanInputRef.current) {
      scanInputRef.current.focus();
    }
  }, [isHeaderComplete, tableData.length]);

  // Fetch buyers and styles
  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      setIsLoading(true);
      
      const buyersRes = await fetch('/api/buyers');
      const buyersData = await buyersRes.json();
      setBuyers(buyersData.data || []);

      const stylesRes = await fetch('/api/styles');
      const stylesData = await stylesRes.json();
      setStyles(stylesData.data || []);
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
      Swal.fire({
        icon: "error",
        title: "Error Loading Data",
        text: "Failed to load buyers and styles",
        timer: 2000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle QR scan input
  const handleScanInputChange = (e) => {
    const value = e.target.value;
    setScanInput(value);
    
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }
    
    if (value.length > 10 && (value.includes('\n') || value.includes('\r'))) {
      const cleanValue = value.replace(/[\n\r]/g, '').trim();
      processScannedData(cleanValue);
    } else {
      scanTimeoutRef.current = setTimeout(() => {
        if (value.length > 5 && value !== lastScannedData) {
          processScannedData(value);
        }
      }, 500);
    }
  };

  const processScannedData = async (scannedData) => {
    if (!scannedData || scannedData === lastScannedData) return;
    
    setLastScannedData(scannedData);
    setScanInput("");
    
    try {
      let parsedData;
      
      try {
        parsedData = JSON.parse(scannedData);
      } catch (error) {
        parsedData = await identifyScanType(scannedData);
      }

      if (!parsedData || !parsedData.type) {
        throw new Error("Invalid QR code format");
      }

      if (parsedData.type === "operator") {
        await handleOperatorScan(parsedData);
      } else if (parsedData.type === "machine") {
        await handleMachineScan(parsedData);
      } else {
        throw new Error("Unknown QR code type");
      }

      setTimeout(() => {
        if (scanInputRef.current) {
          scanInputRef.current.focus();
        }
      }, 100);

    } catch (error) {
      console.error("Scan error:", error);
      Swal.fire({
        icon: "error",
        title: "Scan Failed",
        text: error.message || "Could not process scanned data",
        timer: 2000,
        showConfirmButton: false,
      });
      
      setTimeout(() => {
        if (scanInputRef.current) {
          scanInputRef.current.focus();
        }
      }, 100);
    }
  };

  const identifyScanType = async (data) => {
    const cleanData = data.trim();
    
    if (cleanData.startsWith("TGS-") || cleanData.includes("OP-")) {
      const operator = await fetchOperatorById(cleanData);
      if (operator) {
        return {
          type: "operator",
          id: operator._id,
          operatorId: operator.operatorId,
          name: operator.name,
          designation: operator.designation,
          allowedProcesses: operator.allowedProcesses
        };
      }
    }
    
    const machine = await fetchMachineById(cleanData);
    if (machine) {
      return {
        type: "machine",
        id: machine._id,
        uniqueId: machine.uniqueId,
        machineType: machine.machineType?.name
      };
    }
    
    throw new Error("Could not identify scan type");
  };

  const fetchOperatorById = async (operatorId) => {
    try {
      const res = await fetch(`/api/operators/search?operatorId=${operatorId}`);
      const operators = await res.json();
      return operators[0];
    } catch (error) {
      return null;
    }
  };

  const fetchMachineById = async (machineId) => {
    try {
      const res = await fetch(`/api/machines/search?uniqueId=${machineId}`);
      const machines = await res.json();
      return machines[0];
    } catch (error) {
      return null;
    }
  };

  const handleOperatorScan = async (operatorData) => {
    const existingRowIndex = tableData.findIndex(
      row => row.operator && row.operator.operatorId === operatorData.operatorId
    );

    if (existingRowIndex !== -1) {
      Swal.fire({
        icon: "info",
        title: "Operator Already Added",
        text: `Focusing on row ${existingRowIndex + 1} for ${operatorData.name}`,
        timer: 1500,
        showConfirmButton: false,
      });
      
      highlightRow(existingRowIndex);
      
      setTimeout(() => {
        if (scanInputRef.current) {
          scanInputRef.current.focus();
        }
      }, 100);
      return;
    }

    let targetRowIndex = tableData.findIndex(row => !row.operator);
    
    if (targetRowIndex === -1) {
      targetRowIndex = tableData.length;
      addNewRow();
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setTableData(prev => {
      const updated = [...prev];
      if (!updated[targetRowIndex]) {
        updated[targetRowIndex] = createEmptyRow();
      }
      
      updated[targetRowIndex] = {
        ...updated[targetRowIndex],
        operator: {
          _id: operatorData.id,
          operatorId: operatorData.operatorId,
          name: operatorData.name,
          designation: operatorData.designation,
        },
        allowedProcesses: operatorData.allowedProcesses || {},
        process: Object.keys(operatorData.allowedProcesses || {})[0] || "",
      };
      
      return updated;
    });

    Swal.fire({
      icon: "success",
      title: "Operator Added!",
      text: `${operatorData.name} added to row ${targetRowIndex + 1}`,
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const handleMachineScan = async (machineData) => {
    let targetRowIndex;
    
    const rowsWithOperatorNoMachine = tableData
      .map((row, index) => ({ row, index }))
      .filter(item => item.row.operator && !item.row.uniqueMachine);
    
    if (rowsWithOperatorNoMachine.length > 0) {
      targetRowIndex = rowsWithOperatorNoMachine[rowsWithOperatorNoMachine.length - 1].index;
    } else {
      const rowsWithOperator = tableData
        .map((row, index) => ({ row, index }))
        .filter(item => item.row.operator);
      
      if (rowsWithOperator.length > 0) {
        targetRowIndex = rowsWithOperator[rowsWithOperator.length - 1].index;
        
        const result = await Swal.fire({
          title: "Replace Machine?",
          text: `Row ${targetRowIndex + 1} already has a machine. Replace it?`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Replace",
          cancelButtonText: "Cancel",
        });
        
        if (!result.isConfirmed) {
          setTimeout(() => {
            if (scanInputRef.current) {
              scanInputRef.current.focus();
            }
          }, 100);
          return;
        }
      } else {
        targetRowIndex = tableData.length;
        addNewRow();
        
        Swal.fire({
          icon: "warning",
          title: "Operator Needed",
          text: "Please scan an operator QR for this machine",
          timer: 2000,
          showConfirmButton: false,
        });
        
        setTimeout(() => {
          if (scanInputRef.current) {
            scanInputRef.current.focus();
          }
        }, 100);
        return;
      }
    }

    const machineAlreadyAssigned = tableData.some(
      (row, index) => row.scannedMachine === machineData.uniqueId && index !== targetRowIndex
    );

    if (machineAlreadyAssigned) {
      Swal.fire({
        icon: "warning",
        title: "Machine Already Assigned",
        text: "This machine is already assigned to another operator",
        timer: 2000,
        showConfirmButton: false,
      });
      
      setTimeout(() => {
        if (scanInputRef.current) {
          scanInputRef.current.focus();
        }
      }, 100);
      return;
    }

    setTableData(prev => {
      const updated = [...prev];
      
      if (!updated[targetRowIndex]) {
        updated[targetRowIndex] = createEmptyRow();
      }
      
      updated[targetRowIndex] = {
        ...updated[targetRowIndex],
        uniqueMachine: machineData.uniqueId,
        scannedMachine: machineData.uniqueId,
        machineType: machineData.machineType,
      };
      
      return updated;
    });

    const operatorName = tableData[targetRowIndex]?.operator?.name || "New Operator";
    Swal.fire({
      icon: "success",
      title: "Machine Assigned!",
      text: `${machineData.uniqueId} assigned to ${operatorName}`,
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const createEmptyRow = () => {
    return {
      id: Date.now() + Math.random(),
      operator: null,
      uniqueMachine: "",
      process: "",
      breakdownProcess: "", // নতুন ফিল্ড যোগ করা হয়েছে
      workAs: "operator",
      target: "",
      scannedMachine: null,
      allowedProcesses: {},
    };
  };

  const addNewRow = () => {
    const newRow = createEmptyRow();
    setTableData((prev) => [...prev, newRow]);
    
    Swal.fire({
      icon: "success",
      title: "New Row Added",
      text: "Row " + (tableData.length + 1) + " has been added",
      timer: 1000,
      showConfirmButton: false,
    });
  };

  const highlightRow = (rowIndex) => {
    const rows = document.querySelectorAll('tbody tr');
    if (rows[rowIndex]) {
      rows[rowIndex].classList.add('bg-yellow-100');
      setTimeout(() => {
        rows[rowIndex].classList.remove('bg-yellow-100');
      }, 3000);
    }
  };

  const handleRowChange = (rowIndex, field, value) => {
    setTableData((prev) => {
      const updated = [...prev];
      updated[rowIndex][field] = value;
      return updated;
    });
  };

  const removeRow = (rowIndex) => {
    if (tableData.length <= 1) {
      Swal.fire({
        icon: "warning",
        title: "Cannot Remove",
        text: "At least one row is required",
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }

    Swal.fire({
      title: "Remove Row " + (rowIndex + 1) + "?",
      text: "Are you sure you want to remove this row?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, remove it!",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        const removedOperator = tableData[rowIndex].operator?.name;
        setTableData((prev) => prev.filter((_, index) => index !== rowIndex));
        Swal.fire(
          "Removed!",
          removedOperator ? `Row for ${removedOperator} has been removed.` : "Row has been removed.",
          "success"
        );
      }
    });
  };

  const cancelMachine = (rowIndex) => {
    setTableData((prev) => {
      const updated = [...prev];
      updated[rowIndex] = {
        ...updated[rowIndex],
        uniqueMachine: "",
        scannedMachine: null,
        machineType: "",
      };
      return updated;
    });

    Swal.fire({
      icon: "info",
      title: "Machine Removed",
      text: "Machine assignment has been cancelled",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const handleSubmit = async () => {
    const completeRows = tableData.filter(
      row =>
        row.operator &&
        row.process &&
        row.workAs &&
        row.target &&
        (row.workAs === 'helper' || row.uniqueMachine)
    );

    if (completeRows.length === 0) {
      Swal.fire("Error", "No complete rows to save", "error");
      return;
    }

    const payload = completeRows.map((row, index) => ({
      date: new Date(),
      buyerId: formData.buyer,
      styleId: formData.style,
      supervisor: formData.supervisor,
      floor: formData.floor,
      line: formData.line,
      process: row.process,
      breakdownProcess: row.breakdownProcess, // নতুন ফিল্ড যোগ করা হয়েছে
      workAs: row.workAs,
      status: "present",
      target: Number(row.target),
      operatorId: row.operator._id,
      operatorCode: row.operator.operatorId,
      operatorName: row.operator.name,
      designation: row.operator.designation || "Operator",
      uniqueMachine: row.workAs === 'operator' ? row.uniqueMachine : null,
      machineType: row.workAs === 'operator' ? row.machineType : null,
      rowNo: index + 1
    }));

    console.table(payload);

    try {
      const res = await fetch("/api/daily-production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        Swal.fire("Error", data.error || "Failed to save", "error");
        return;
      }

      Swal.fire("Success", "Daily production saved successfully", "success");

    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Server error", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Form */}
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
                onChange={handleInputChange}
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
                onChange={handleInputChange}
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
                Select Excel File
                {selectedFileId && breakdownProcesses.length > 0 && (
                  <span className="text-xs text-green-600 ml-2">
                    ({breakdownProcesses.length} processes loaded)
                  </span>
                )}
              </label>
              <select
                value={selectedFileId}
                onChange={(e) => handleFileSelect(e.target.value)}
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
                onChange={handleInputChange}
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
                onChange={handleInputChange}
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
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Line-01"
                required
              />
            </div>

            {/* Status */}
            <div className="flex items-end">
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
            </div>
          </div>
        </div>

        {/* Scanner Section */}
        {isHeaderComplete && (
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
                onChange={handleScanInputChange}
                onFocus={() => setScanFocus(true)}
                onBlur={() => setScanFocus(false)}
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
                    onClick={() => {
                      setScanInput("");
                      if (scanInputRef.current) {
                        scanInputRef.current.focus();
                      }
                    }}
                    className="text-gray-400 hover:text-gray-600"
                    title="Clear"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table Section */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold">
              Operator Production Details
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({tableData.length} rows)
              </span>
              {selectedFileId && (
                <span className="ml-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                  Breakdown processes available
                </span>
              )}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={addNewRow}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm flex items-center gap-1"
                disabled={!isHeaderComplete}
              >
                <span>+</span> Add New Row
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {tableData.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Operators Added Yet</h3>
                <p className="text-gray-500 mb-4">
                  {isHeaderComplete 
                    ? "Scan operator QR code in the scanner section above" 
                    : "Complete header fields first to enable scanning"}
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Row
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Operator
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Machine
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Process
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Breakdown Process
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Work As
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Target
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tableData.map((row, index) => (
                    <tr 
                      key={row.id} 
                      className={`hover:bg-gray-50 ${!row.operator ? 'bg-gray-50' : row.operator && row.uniqueMachine ? 'bg-green-50' : ''}`}
                    >
                      {/* Row Number */}
                      <td className="px-6 py-4 text-center">
                        <div className="font-bold text-gray-700">{index + 1}</div>
                        {!row.operator && (
                          <div className="text-xs text-gray-400 mt-1">Waiting for operator</div>
                        )}
                      </td>

                      {/* Operator */}
                      <td className="px-6 py-4">
                        {row.operator ? (
                          <div className="bg-blue-50 p-3 rounded border border-blue-200">
                            <div className="text-sm font-medium text-gray-900">
                              {row.operator.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {row.operator.operatorId}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {row.operator.designation}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center p-4">
                            <div className="text-gray-400 text-sm mb-2">No Operator</div>
                            <div className="text-xs text-gray-500">
                              Scan operator QR above
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Machine */}
                      <td className="px-6 py-4">
                        {row.uniqueMachine ? (
                          <div className="bg-green-50 p-3 rounded border border-green-200">
                            <div className="text-sm font-medium text-gray-900">
                              {row.uniqueMachine}
                            </div>
                            {row.machineType && (
                              <div className="text-xs text-gray-500 mt-1">
                                {row.machineType}
                              </div>
                            )}
                            <button
                              onClick={() => cancelMachine(index)}
                              className="text-xs text-red-600 hover:text-red-800 mt-2"
                              title="Remove machine"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <div className="text-center p-4">
                            <div className="text-gray-400 text-sm mb-2">No Machine</div>
                            {row.operator ? (
                              <div className="text-xs text-green-500">
                                Ready for machine scan
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500">
                                Add operator first
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Process */}
                      <td className="px-6 py-4">
                        <select
                          value={row.process}
                          onChange={(e) => handleRowChange(index, "process", e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                            row.operator ? 'border-gray-300' : 'border-gray-200 bg-gray-100'
                          }`}
                          disabled={!row.operator}
                        >
                          <option value="">Select Process</option>
                          {row.operator && row.allowedProcesses && Object.keys(row.allowedProcesses).length > 0 ? (
                            Object.keys(row.allowedProcesses).map((process) => (
                              <option key={process} value={process}>
                                {process}
                              </option>
                            ))
                          ) : (
                            processes.map((process) => (
                              <option key={process._id} value={process._id}>
                                {process.name} ({process.code})
                              </option>
                            ))
                          )}
                        </select>
                        
                        {row.process && (
                          <div className="text-xs text-gray-500 mt-1">
                            {(() => {
                              const selectedProcess = processes.find(p => p._id === row.process);
                              if (selectedProcess) {
                                return (
                                  <>
                                    <div>SMV: {selectedProcess.smv}</div>
                                    <div>Machine: {selectedProcess.machineType}</div>
                                  </>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        )}
                      </td>

                      {/* নতুন: Breakdown Process */}
                      <td className="px-6 py-4">
                        <select
                          value={row.breakdownProcess}
                          onChange={(e) => handleRowChange(index, "breakdownProcess", e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                            row.operator ? 'border-gray-300' : 'border-gray-200 bg-gray-100'
                          }`}
                          disabled={!row.operator || breakdownProcesses.length === 0}
                        >
                          <option value="">Select Breakdown Process</option>
                          {breakdownProcesses.map((bp) => (
                            <option key={bp.id} value={bp.process}>
                              {bp.process}
                            </option>
                          ))}
                        </select>
                        
                        {row.breakdownProcess && (
                          <div className="text-xs text-gray-500 mt-1">
                            {(() => {
                              const selectedBP = breakdownProcesses.find(bp => bp.process === row.breakdownProcess);
                              if (selectedBP) {
                                return (
                                  <>
                                    <div>SMV: {selectedBP.smv}</div>
                                    {/* <div>MC Type: {selectedBP.mcTypeHp}</div> */}
                                    <div>Capacity: {selectedBP.capacity}</div>
                                  </>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        )}
                        
                        {breakdownProcesses.length === 0 && (
                          <div className="text-xs text-gray-400 mt-1">
                            Select an Excel file above to load breakdown processes
                          </div>
                        )}
                      </td>

                      {/* Work As */}
                      <td className="px-6 py-4">
                        <select
                          value={row.workAs}
                          onChange={(e) =>
                            handleRowChange(index, "workAs", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          disabled={!row.operator}
                        >
                          <option value="operator">Operator</option>
                          <option value="helper">Helper</option>
                        </select>
                      </td>

                      {/* Target */}
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          value={row.target}
                          onChange={(e) =>
                            handleRowChange(index, "target", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="Enter target"
                          min="0"
                          disabled={!row.operator}
                        />
                        {row.allowedProcesses && row.process && row.allowedProcesses[row.process] && (
                          <button
                            onClick={() => handleRowChange(index, "target", row.allowedProcesses[row.process])}
                            className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                          >
                            Use suggested: {row.allowedProcesses[row.process]}
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => removeRow(index)}
                          className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 text-sm font-medium"
                          disabled={tableData.length <= 1}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Status Summary */}
        {tableData.length > 0 && (
          <div className="mb-6 bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-3 bg-white rounded shadow">
                <div className="text-2xl font-bold text-blue-600">{tableData.length}</div>
                <div className="text-sm text-gray-600">Total Rows</div>
              </div>
              <div className="text-center p-3 bg-white rounded shadow">
                <div className="text-2xl font-bold text-green-600">
                  {tableData.filter(row => row.operator && row.uniqueMachine && row.process && row.target).length}
                </div>
                <div className="text-sm text-gray-600">Complete</div>
              </div>
              <div className="text-center p-3 bg-white rounded shadow">
                <div className="text-2xl font-bold text-yellow-600">
                  {tableData.filter(row => row.operator && !row.uniqueMachine).length}
                </div>
                <div className="text-sm text-gray-600">Need Machine</div>
              </div>
              <div className="text-center p-3 bg-white rounded shadow">
                <div className="text-2xl font-bold text-purple-600">
                  {tableData.filter(row => row.operator && row.uniqueMachine && (!row.process || !row.target)).length}
                </div>
                <div className="text-sm text-gray-600">Incomplete</div>
              </div>
              <div className="text-center p-3 bg-white rounded shadow">
                <div className="text-2xl font-bold text-indigo-600">
                  {tableData.filter(row => row.breakdownProcess).length}
                </div>
                <div className="text-sm text-gray-600">With Breakdown</div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {tableData.length > 0 ? (
              <span>
                {tableData.filter(row => row.operator && row.uniqueMachine && row.process && row.target).length} of {tableData.length} rows complete
              </span>
            ) : (
              <span>No rows added yet</span>
            )}
          </div>
          <button
            onClick={handleSubmit}
            disabled={isLoading || tableData.length === 0}
            className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save Daily Production
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}