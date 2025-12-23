"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  
  // Dropdown data
  const [buyers, setBuyers] = useState([]);
  const [styles, setStyles] = useState([]);
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
  
  // UI state
  const [highlightedRow, setHighlightedRow] = useState(null);
  
  // Hourly data state
  const [hourlyData, setHourlyData] = useState({
    hourlyInputs: {},
    productionStats: {},
    hours: [],
    tableData: []
  });
  
  // নতুন state: machine scan এর জন্য সিলেক্টেড row
  const [selectedRowForMachine, setSelectedRowForMachine] = useState(null);
  
  // Refs
  const scanInputRef = useRef(null);
  const scanTimeoutRef = useRef(null);

  // Operator and Machine caches - useRef ব্যবহার করে re-rendering এড়ানো
  const operatorMapRef = useRef(new Map());   // operatorId -> rowIndex
  const machineMapRef = useRef(new Map());    // uniqueMachine -> rowIndex

  // Header completion check - useMemo ব্যবহার করা
  const isHeaderComplete = useMemo(() => {
    return formData.buyer && formData.style && formData.supervisor && 
           formData.floor && formData.line;
  }, [formData]);

  // Summary update - useMemo ব্যবহার করা
  const summary = useMemo(() => {
    const processCount = tableData.filter(row => row.process).length;
    const breakdownCount = tableData.filter(row => row.breakdownProcess).length;
    return {
      processCount,
      breakdownCount,
      total: processCount + breakdownCount
    };
  }, [tableData]);

  // Filtered styles - useMemo ব্যবহার করা
  const filteredStyles = useMemo(() => {
    if (formData.buyer && styles.length > 0) {
      const buyerSpecificStyles = styles.filter(
        (style) => style.buyerId?._id === formData.buyer || 
                  style.buyerId === formData.buyer ||
                  style.buyerName === buyers.find(b => b._id === formData.buyer)?.name
      );
      return buyerSpecificStyles;
    }
    return [];
  }, [formData.buyer, styles, buyers]);

  // Initial data fetching - useEffect optimization
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        await Promise.all([fetchProcesses(), fetchExcelFiles(), fetchDropdownData()]);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };
    fetchInitialData();
  }, []);

  // Header completion check with table data
  useEffect(() => {
    if (isHeaderComplete && tableData.length === 0) {
      addNewRow();
    }
  }, [isHeaderComplete, tableData.length]);

  // Auto focus scanner - debounced with cleanup
  useEffect(() => {
    if (isHeaderComplete && scanInputRef.current) {
      const timer = setTimeout(() => {
        scanInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isHeaderComplete, tableData.length]);

  // selectedRowForMachine পরিবর্তন হলে notification - useEffect optimization
  useEffect(() => {
    if (selectedRowForMachine !== null) {
      console.log(`Row ${selectedRowForMachine + 1} selected for machine scan`);
    }
  }, [selectedRowForMachine]);

  // Buyer change handler - useEffect optimization
  useEffect(() => {
    if (formData.buyer && formData.style && styles.length > 0) {
      const isStyleValid = filteredStyles.some(s => s._id === formData.style);
      if (!isStyleValid) {
        setFormData(prev => ({ ...prev, style: "" }));
      }
    }
  }, [formData.buyer, formData.style, styles, filteredStyles]);

  // ✅ useCallback ব্যবহার করে function re-creation এড়ানো
  const updateFormData = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const createEmptyRow = useCallback(() => ({
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
  }), []);

  const addNewRow = useCallback(() => {
    const newRow = createEmptyRow();
    setTableData(prev => [...prev, newRow]);
    
    Swal.fire({
      icon: "success",
      title: "New Row Added",
      text: `Row ${tableData.length + 1} has been added`,
      timer: 1000,
      showConfirmButton: false,
    });
  }, [tableData.length, createEmptyRow]);

  const removeRow = useCallback((rowIndex) => {
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
        
        // Cache থেকে অপারেটর এবং মেশিন remove করুন
        if (tableData[rowIndex]?.operator?.operatorId) {
          operatorMapRef.current.delete(tableData[rowIndex].operator.operatorId);
        }
        if (tableData[rowIndex]?.uniqueMachine) {
          machineMapRef.current.delete(tableData[rowIndex].uniqueMachine);
        }
        
        setTableData(prev => prev.filter((_, index) => index !== rowIndex));
        
        // যদি সরানো row টি selectedRowForMachine হয়, তাহলে reset করুন
        if (selectedRowForMachine === rowIndex) {
          setSelectedRowForMachine(null);
        }
        
        Swal.fire(
          "Removed!",
          removedOperator ? `Row for ${removedOperator} has been removed.` : "Row has been removed.",
          "success"
        );
      }
    });
  }, [tableData, selectedRowForMachine]);

  const cancelMachine = useCallback((rowIndex) => {
    setTableData(prev => {
      const updated = [...prev];
      const uniqueMachine = updated[rowIndex]?.uniqueMachine;
      
      if (uniqueMachine) {
        machineMapRef.current.delete(uniqueMachine);
      }
      
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
  }, []);

  // ✅ নতুন ফাংশন: machine scan এর জন্য row সিলেক্ট করতে - useCallback
  const handleSelectRowForMachine = useCallback((rowIndex) => {
    // চেক করুন এই row-এ অপারেটর আছে কিনা
    if (!tableData[rowIndex]?.operator) {
      Swal.fire({
        icon: "error",
        title: "No Operator",
        text: `Row ${rowIndex + 1} has no operator. Please scan operator QR first.`,
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    // যদি এই row-এ ইতিমধ্যে মেশিন থাকে
    if (tableData[rowIndex]?.uniqueMachine) {
      Swal.fire({
        title: "Replace Machine?",
        text: `Row ${rowIndex + 1} already has a machine (${tableData[rowIndex].uniqueMachine}). Click again to replace it.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, replace",
        cancelButtonText: "Cancel",
      }).then((result) => {
        if (result.isConfirmed) {
          setSelectedRowForMachine(rowIndex);
          Swal.fire({
            icon: "info",
            title: "Row Selected",
            text: `Row ${rowIndex + 1} is selected for machine replacement. Now scan new machine QR.`,
            timer: 2000,
            showConfirmButton: false,
          });
          
          // Scanner ফোকাস করুন
          setTimeout(() => {
            scanInputRef.current?.focus();
          }, 100);
        }
      });
      return;
    }

    // Row সিলেক্ট করুন
    setSelectedRowForMachine(rowIndex);
    
    Swal.fire({
      icon: "info",
      title: "Row Selected",
      text: `Row ${rowIndex + 1} is now selected for machine scan. Ready to scan machine QR.`,
      timer: 2000,
      showConfirmButton: false,
    });
    
    // Scanner ফোকাস করুন
    setTimeout(() => {
      scanInputRef.current?.focus();
    }, 100);
  }, [tableData]);

  const handleSubmit = useCallback(async () => {
    // ✅ Only operator is required now
    const completeRows = tableData.filter(row => row.operator);

    if (completeRows.length === 0) {
      Swal.fire("Error", "At least one operator is required to save", "error");
      return;
    }

    // ✅ Prepare payload
    const payload = completeRows.map((row, index) => {
      const rowHourlyProduction = [];

      if (hourlyData?.hours && hourlyData?.hourlyInputs) {
        hourlyData.hours.forEach(hour => {
          const key = `${row.id}-${hour}`;
          const productionCount = parseInt(hourlyData.hourlyInputs[key]) || 0;

          if (productionCount > 0) {
            rowHourlyProduction.push({
              hour,
              productionCount,
              defects: []
            });
          }
        });
      }

      return {
        date: new Date(),
        buyerId: formData.buyer || null,
        styleId: formData.style || null,
        supervisor: formData.supervisor || null,
        floor: formData.floor || null,
        line: formData.line || null,
        process: row.process || null,
        breakdownProcess: row.breakdownProcess || null,
        workAs: row.workAs || "operator",
        status: "present",
        target: row.target ? Number(row.target) : 0,
        operatorId: row.operator._id,
        operatorCode: row.operator.operatorId,
        operatorName: row.operator.name,
        designation: row.operator.designation || "Operator",
        uniqueMachine: row.uniqueMachine || null,
        machineType: row.machineType || null,
        smv: row.selectedSMV || null,
        smvType: row.selectedSMVType || null,
        rowNo: index + 1,
        hourlyProduction: rowHourlyProduction
      };
    });

    console.log("Final Payload to save:", payload);

    try {
      setIsLoading(true);

      const res = await fetch("/api/daily-production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.status === 409) {
        // 🔴 Duplicate entry detected
        Swal.fire({
          icon: "warning",
          title: "Duplicate Entry!",
          html: `<div class="text-left">
                   <p>${data.message}</p>
                 </div>`,
        });
        return;
      }

      if (!res.ok) {
        Swal.fire("Error", data.error || "Failed to save", "error");
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Success!",
        html: `<div class="text-left">
                 <p><strong>Daily production saved successfully!</strong></p>
                 <p>Total rows saved: ${data.inserted || payload.length}</p>
                 <p>Hourly data entries: ${
                   payload.reduce(
                     (sum, row) => sum + row.hourlyProduction.length,
                     0
                   )
                 }</p>
               </div>`,
        timer: 3000,
        showConfirmButton: false
      });

    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Server error", "error");
    } finally {
      setIsLoading(false);
    }
  }, [tableData, formData, hourlyData]);

  const fetchDropdownData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const [buyersRes, stylesRes] = await Promise.all([
        fetch('/api/buyers'),
        fetch('/api/styles')
      ]);
      
      const buyersData = await buyersRes.json();
      const stylesData = await stylesRes.json();
      
      // Buyers data check
      if (buyersData && buyersData.success) {
        setBuyers(buyersData.data || []);
      } else if (buyersData && Array.isArray(buyersData)) {
        setBuyers(buyersData);
      } else {
        console.error("Invalid buyers data format:", buyersData);
        setBuyers([]);
      }
      
      // Styles data check
      if (stylesData && stylesData.success) {
        setStyles(stylesData.data || []);
      } else if (stylesData && Array.isArray(stylesData)) {
        setStyles(stylesData);
      } else {
        console.error("Invalid styles data format:", stylesData);
        setStyles([]);
      }
      
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
      Swal.fire({
        icon: "error",
        title: "Error Loading Data",
        text: "Failed to load buyers and styles",
        timer: 2000,
      });
      setBuyers([]);
      setStyles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchProcesses = useCallback(async () => {
    try {
      const res = await fetch('/api/processes');
      const data = await res.json();
      setProcesses(data);
    } catch (error) {
      console.error("Error fetching processes:", error);
    }
  }, []);

  const fetchExcelFiles = useCallback(async () => {
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
  }, []);

  const handleFileSelect = useCallback(async (fileId) => {
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
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    updateFormData(name, value);
  }, [updateFormData]);

  // ✅ Debounced scan input handler
  const handleScanInputChange = useCallback((e) => {
    const value = e.target.value;
    setScanInput(value);
    
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }
    
    // Use requestAnimationFrame for better performance
    scanTimeoutRef.current = setTimeout(() => {
      if (value.length > 5 && (value.includes('\n') || value.includes('\r'))) {
        const cleanValue = value.replace(/[\n\r]/g, '').trim();
        processScannedData(cleanValue);
      } else if (value.length > 10) {
        processScannedData(value.trim());
      }
    }, ); 
  }, []);

  const identifyScanType = useCallback(async (data) => {
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
  }, []);

  const fetchOperatorById = useCallback(async (operatorId) => {
    try {
      const res = await fetch(`/api/operators/search?operatorId=${operatorId}`);
      const operators = await res.json();
      return operators[0];
    } catch (error) {
      return null;
    }
  }, []);

  const fetchMachineById = useCallback(async (machineId) => {
    try {
      const res = await fetch(`/api/machines/search?uniqueId=${machineId}`);
      const machines = await res.json();
      return machines[0];
    } catch (error) {
      return null;
    }
  }, []);

  const processScannedData = useCallback(async (scannedData) => {
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
    } catch (error) {
      console.error("Scan error details:", error);
      Swal.fire({ 
        icon: "error", 
        title: "Scan Failed", 
        text: error.message,
        timer: 1500
      });
    }
  }, [identifyScanType]);

  const handleOperatorScan = useCallback(async (operatorData) => {
    const existingIndex = operatorMapRef.current.get(operatorData.operatorId);

    // 🔁 Duplicate operator
    if (existingIndex !== undefined) {
      setHighlightedRow(existingIndex);
      setTimeout(() => setHighlightedRow(null), 2000);
      scanInputRef.current?.focus();
      return;
    }

    // ➕ Find empty row (no loop)
    setTableData(prev => {
      const emptyIndex = prev.findIndex(r => !r.operator);
      const targetIndex = emptyIndex !== -1 ? emptyIndex : prev.length;

      const updated = [...prev];
      updated[targetIndex] = {
        ...(updated[targetIndex] || createEmptyRow()),
        operator: {
          _id: operatorData.id,
          operatorId: operatorData.operatorId,
          name: operatorData.name,
          designation: operatorData.designation,
        },
        allowedProcesses: operatorData.allowedProcesses || {},
        process: Object.keys(operatorData.allowedProcesses || {})[0] || "",
      };

      // ✅ CACHE UPDATE
      operatorMapRef.current.set(operatorData.operatorId, targetIndex);

      // Use microtask for showing alert to avoid blocking UI
      Promise.resolve().then(() => {
        Swal.fire({
          icon: "success",
          title: "Operator Added",
          text: `${operatorData.name} → Row ${targetIndex + 1}`,
          timer: 1200,
          showConfirmButton: false,
        });
      });

      return updated;
    });
  }, [createEmptyRow]);

  const handleMachineScan = useCallback(async (machineData) => {
    const existingIndex = machineMapRef.current.get(machineData.uniqueId);

    // 🔁 Machine already used
    if (existingIndex !== undefined) {
      Swal.fire({
        icon: "warning",
        title: "Machine In Use",
        text: `Already assigned to row ${existingIndex + 1}`,
        timer: 1500,
        showConfirmButton: false,
      });
      scanInputRef.current?.focus();
      return;
    }

    let targetIndex = selectedRowForMachine;

    if (targetIndex === null || !tableData[targetIndex]?.operator) {
      Swal.fire("Error", "Select a row with operator first", "error");
      return;
    }

    setTableData(prev => {
      const updated = [...prev];

      updated[targetIndex] = {
        ...updated[targetIndex],
        uniqueMachine: machineData.uniqueId,
        scannedMachine: machineData.uniqueId,
        machineType: machineData.machineType,
      };

      // ✅ CACHE UPDATE
      machineMapRef.current.set(machineData.uniqueId, targetIndex);

      // Use microtask for showing alert
      Promise.resolve().then(() => {
        Swal.fire({
          icon: "success",
          title: "Machine Assigned",
          text: `${machineData.uniqueId} → Row ${targetIndex + 1}`,
          timer: 1200,
          showConfirmButton: false,
        });
      });

      return updated;
    });

    setSelectedRowForMachine(null);
  }, [selectedRowForMachine, tableData]);

  const handleRowChange = useCallback((rowIndex, field, value) => {
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
  }, [processes, originalBreakdownProcesses]);

  const calculateTarget = useCallback((smv) => {
    if (!smv || smv <= 0) return "";
    return Math.round(60 / smv);
  }, []);

  const getBreakdownSelectionCount = useCallback((processName) => {
    return tableData.filter(row => row.breakdownProcess === processName).length;
  }, [tableData]);

  const isBreakdownDisabled = useCallback((bp) => {
    const selectedCount = getBreakdownSelectionCount(bp.process);
    const manpower = parseInt(bp.manPower) || 1;
    return selectedCount >= manpower;
  }, [getBreakdownSelectionCount]);

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
              scanInputRef.current?.focus();
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
          onHourlyDataChange={setHourlyData}
          // নতুন props
          selectedRowForMachine={selectedRowForMachine}
          onSelectRowForMachine={handleSelectRowForMachine}
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
                  {selectedRowForMachine !== null && (
                    <div className="text-xs text-blue-600 mt-1 font-medium">
                      ✓ Row {selectedRowForMachine + 1} selected for machine scan
                    </div>
                  )}
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