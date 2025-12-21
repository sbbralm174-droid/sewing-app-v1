// /supervisor/daily-production-by-qrcode/page.jsx

"use client";

import { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import HeaderForm from "@/components/HeaderForm";
import ScannerSection from "@/components/ScannerSection";
import SummarySection from "@/components/SummarySection";
import ProductionTable from "@/components/ProductionTable";

export default function DailyProductionPage() {
  // Main state
  const [formData, setFormData] = useState({
    buyer: "",
    style: "",
    supervisor: "",
    floor: "",
    line: "",
  });
  
  const [tableData, setTableData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHeaderComplete, setIsHeaderComplete] = useState(false);
  
  // Dropdown data
  const [buyers, setBuyers] = useState([]);
  const [styles, setStyles] = useState([]);
  const [filteredStyles, setFilteredStyles] = useState([]);
  const [processes, setProcesses] = useState([]);
  
  // Excel file data
  const [excelFiles, setExcelFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState("");
  const [breakdownProcesses, setBreakdownProcesses] = useState([]);
  const [originalBreakdownProcesses, setOriginalBreakdownProcesses] = useState([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  
  // Scan related
  const [scanInput, setScanInput] = useState("");
  const [scanFocus, setScanFocus] = useState(false);
  const [lastScannedData, setLastScannedData] = useState("");
  
  // UI state
  const [highlightedRow, setHighlightedRow] = useState(null);
  const [summary, setSummary] = useState({
    processCount: 0,
    breakdownCount: 0,
    total: 0
  });
  
  // Hourly data state - parent state এ রাখুন
  const [hourlyData, setHourlyData] = useState({
    hourlyInputs: {},
    productionStats: {},
    hours: [],
    tableData: []
  });
  
  // Refs
  const scanInputRef = useRef(null);
  const scanTimeoutRef = useRef(null);

  // Initial data fetching
  useEffect(() => {
    fetchProcesses();
    fetchExcelFiles();
  }, []);

  // Summary update
  useEffect(() => {
    updateSummary();
  }, [tableData]);

  // Header completion check
  useEffect(() => {
    const complete = formData.buyer && formData.style && formData.supervisor && 
                    formData.floor && formData.line;
    setIsHeaderComplete(complete);
    
    if (complete && tableData.length === 0) {
      addNewRow();
    }
  }, [formData, tableData.length]);

  // Buyer change handler
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

  // Auto focus scanner
  useEffect(() => {
    if (isHeaderComplete && scanInputRef.current) {
      scanInputRef.current.focus();
    }
  }, [isHeaderComplete, tableData.length]);

  // Fetch dropdown data
  useEffect(() => {
    fetchDropdownData();
  }, []);

  const updateSummary = () => {
    const processCount = tableData.filter(row => row.process).length;
    const breakdownCount = tableData.filter(row => row.breakdownProcess).length;
    setSummary({
      processCount,
      breakdownCount,
      total: processCount + breakdownCount
    });
  };

  const createEmptyRow = () => ({
    id: Date.now() + Math.random(),
    operator: null,
    uniqueMachine: "",
    process: "",
    breakdownProcess: "",
    workAs: "operator",
    target: "",
    scannedMachine: null,
    allowedProcesses: {},
    selectedSMV: "",
    selectedSMVType: ""
  });

  const addNewRow = () => {
    const newRow = createEmptyRow();
    setTableData((prev) => [...prev, newRow]);
    
    Swal.fire({
      icon: "success",
      title: "New Row Added",
      text: `Row ${tableData.length + 1} has been added`,
      timer: 1000,
      showConfirmButton: false,
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
      title: `Remove Row ${rowIndex + 1}?`,
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

  // ProductionTable থেকে hourly data পাওয়ার ফাংশন
  const handleHourlyDataChange = (data) => {
    console.log("Hourly data received in parent:", data);
    setHourlyData(data);
  };

  const handleSubmit = async () => {
    const completeRows = tableData.filter(
      row =>
        row.operator &&
        (row.process || row.breakdownProcess) &&
        row.workAs &&
        row.target &&
        (row.workAs === 'helper' || row.uniqueMachine)
    );

    if (completeRows.length === 0) {
      Swal.fire("Error", "No complete rows to save", "error");
      return;
    }

    // Prepare payload with hourly production data
    const payload = completeRows.map((row, index) => {
      // এই row-এর জন্য hourly production ডাটা সংগ্রহ
      const rowHourlyProduction = [];
      
      if (hourlyData.hours && hourlyData.hourlyInputs) {
        hourlyData.hours.forEach(hour => {
          const key = `${row.id}-${hour}`;
          const productionCount = parseInt(hourlyData.hourlyInputs[key]) || 0;
          if (productionCount > 0) {
            rowHourlyProduction.push({
              hour: hour,
              productionCount: productionCount,
              defects: []
            });
          }
        });
      }

      return {
        date: new Date(),
        buyerId: formData.buyer,
        styleId: formData.style,
        supervisor: formData.supervisor,
        floor: formData.floor,
        line: formData.line,
        process: row.process,
        breakdownProcess: row.breakdownProcess,
        workAs: row.workAs,
        status: "present",
        target: Number(row.target),
        operatorId: row.operator._id,
        operatorCode: row.operator.operatorId,
        operatorName: row.operator.name,
        designation: row.operator.designation || "Operator",
        uniqueMachine: row.workAs === 'operator' ? row.uniqueMachine : null,
        machineType: row.workAs === 'operator' ? row.machineType : null,
        smv: row.selectedSMV,
        smvType: row.selectedSMVType,
        rowNo: index + 1,
        hourlyProduction: rowHourlyProduction
      };
    });

    console.log("Final Payload to save:", payload); // ডিবাগিং এর জন্য

    try {
      setIsLoading(true);
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

      Swal.fire({
        icon: "success",
        title: "Success!",
        html: `
          <div class="text-left">
            <p><strong>Daily production saved successfully!</strong></p>
            <p>Total rows saved: ${data.inserted || payload.length}</p>
            <p>Hourly data: ${payload.reduce((sum, row) => sum + row.hourlyProduction.length, 0)} entries</p>
          </div>
        `,
        timer: 3000,
        showConfirmButton: false,
      });
      
      // Reset form after successful save
      

    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Server error", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      setIsLoading(true);
      
      const [buyersRes, stylesRes] = await Promise.all([
        fetch('/api/buyers'),
        fetch('/api/styles')
      ]);
      
      const buyersData = await buyersRes.json();
      const stylesData = await stylesRes.json();
      
      setBuyers(buyersData.data || []);
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

  const fetchProcesses = async () => {
    try {
      const res = await fetch('/api/processes');
      const data = await res.json();
      setProcesses(data);
    } catch (error) {
      console.error("Error fetching processes:", error);
    }
  };

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

  const handleFileSelect = async (fileId) => {
    setSelectedFileId(fileId);
    if (!fileId) {
      setBreakdownProcesses([]);
      setOriginalBreakdownProcesses([]);
      return;
    }

    try {
      setIsLoadingFiles(true);
      const res = await fetch(`/api/excell-upload/${fileId}`);
      const data = await res.json();
      
      if (data.success && data.data && data.data.data) {
        const processesList = data.data.data.map(item => ({
          id: item._id,
          process: item.process,
          sno: item.sno,
          smv: item.smv,
          mcTypeHp: item.mcTypeHp,
          capacity: item.capacity,
          manPower: item.manPower || 1
        }));
        setOriginalBreakdownProcesses(processesList);
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
      setOriginalBreakdownProcesses([]);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

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
    if (!scannedData) return;
    setScanInput("");

    try {
      let parsedData;
      
      try {
        const rawData = JSON.parse(scannedData);
        
        parsedData = {
          type: (rawData.TYPE || rawData.type || "").toLowerCase(),
          id: rawData.ID || rawData.id || rawData._id,
          operatorId: rawData.OPERATORiD || rawData.operatorId || rawData.operatorID,
          name: rawData.NAME || rawData.name,
          designation: rawData.DESIGNATION || rawData.designation,
          uniqueId: rawData.UNIQUEID || rawData.uniqueId,
          machineType: rawData.MACHINETYPE || rawData.machineType
        };
      } catch (e) {
        parsedData = await identifyScanType(scannedData);
      }

      if (!parsedData || !parsedData.type) {
        throw new Error("Invalid QR code format");
      }

      if (parsedData.type === "operator") {
        await handleOperatorScan(parsedData);
      } else if (parsedData.type === "machine") {
        await handleMachineScan(parsedData);
      }

      setLastScannedData(scannedData);
    } catch (error) {
      console.error("Scan error details:", error);
      setLastScannedData("");
      Swal.fire({ icon: "error", title: "Scan Failed", text: error.message });
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
      
      setHighlightedRow(existingRowIndex);
      setTimeout(() => {
        setHighlightedRow(null);
      }, 3000);
      
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

  const handleRowChange = (rowIndex, field, value) => {
    setTableData((prev) => {
      const updated = [...prev];
      
      if (field === "process") {
        setHighlightedRow(rowIndex);
        setTimeout(() => {
          setHighlightedRow(null);
        }, 2000);
        
        const selectedProcess = processes.find(p => p._id === value);
        
        updated[rowIndex] = {
          ...updated[rowIndex],
          [field]: value,
          breakdownProcess: "",
          selectedSMV: selectedProcess?.smv || "",
          selectedSMVType: selectedProcess?.smv ? "process" : "",
          target: selectedProcess?.smv ? calculateTarget(selectedProcess.smv) : ""
        };
      } 
      else if (field === "breakdownProcess") {
        const selectedBreakdown = originalBreakdownProcesses.find(bp => bp.process === value || bp.id === value);
        
        updated[rowIndex] = {
          ...updated[rowIndex],
          [field]: value,
          process: "",
          selectedSMV: selectedBreakdown?.smv || "",
          selectedSMVType: selectedBreakdown?.smv ? "breakdown" : "",
          target: selectedBreakdown?.smv ? calculateTarget(selectedBreakdown.smv) : ""
        };
      }
      else {
        updated[rowIndex][field] = value;
      }
      
      return updated;
    });
  };

  const calculateTarget = (smv) => {
    if (!smv || smv <= 0) return "";
    return Math.round(60 / smv);
  };

  const getBreakdownSelectionCount = (processName) => {
    return tableData.filter(row => row.breakdownProcess === processName).length;
  };

  const isBreakdownDisabled = (bp) => {
    const selectedCount = getBreakdownSelectionCount(bp.process);
    const manpower = parseInt(bp.manPower) || 1;
    return selectedCount >= manpower;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <HeaderForm
          formData={formData}
          buyers={buyers}
          filteredStyles={filteredStyles}
          excelFiles={excelFiles}
          selectedFileId={selectedFileId}
          breakdownProcesses={breakdownProcesses}
          isLoading={isLoading}
          isLoadingFiles={isLoadingFiles}
          isHeaderComplete={isHeaderComplete}
          onInputChange={handleInputChange}
          onFileSelect={handleFileSelect}
        />

        {isHeaderComplete && (
          <ScannerSection
            scanInput={scanInput}
            scanFocus={scanFocus}
            scanInputRef={scanInputRef}
            onScanChange={handleScanInputChange}
            onScanFocus={() => setScanFocus(true)}
            onScanBlur={() => setScanFocus(false)}
            onClearScan={() => {
              setScanInput("");
              if (scanInputRef.current) {
                scanInputRef.current.focus();
              }
            }}
          />
        )}

        {tableData.length > 0 && (
          <SummarySection summary={summary} />
        )}

        <ProductionTable
          tableData={tableData}
          highlightedRow={highlightedRow}
          processes={processes}
          breakdownProcesses={breakdownProcesses}
          originalBreakdownProcesses={originalBreakdownProcesses}
          selectedFileId={selectedFileId}
          isHeaderComplete={isHeaderComplete}
          onAddRow={addNewRow}
          onRemoveRow={removeRow}
          onCancelMachine={cancelMachine}
          onRowChange={handleRowChange}
          getBreakdownSelectionCount={getBreakdownSelectionCount}
          isBreakdownDisabled={isBreakdownDisabled}
          calculateTarget={calculateTarget}
          floor={formData.floor}
          onHourlyDataChange={handleHourlyDataChange} // নতুন prop
        />

        {/* Submit Section */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {tableData.length > 0 ? (
                <div>
                  <span className="font-medium">
                    {tableData.filter(row => row.operator && row.uniqueMachine && (row.process || row.breakdownProcess) && row.target).length} of {tableData.length} rows complete
                  </span>
                  <div className="text-xs mt-1">
                    Hourly data: {Object.values(hourlyData.hourlyInputs || {}).filter(v => v && parseInt(v) > 0).length} inputs filled
                  </div>
                </div>
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
    </div>
  );
}