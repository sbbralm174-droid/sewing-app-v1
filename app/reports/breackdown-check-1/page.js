"use client";
import { useState, useEffect } from "react";
import SidebarNavLayout from '@/components/SidebarNavLayout';
export default function LineReport() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedFloor, setSelectedFloor] = useState("");
  const [selectedLine, setSelectedLine] = useState("");
  const [floors, setFloors] = useState([]);
  const [lines, setLines] = useState([]);
  const [allLinesData, setAllLinesData] = useState({});
  const [data, setData] = useState(null);
  const [excelProcesses, setExcelProcesses] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Initial data fetch: fetch all lines grouped by floor
  useEffect(() => {
    const fetchAllLines = async () => {
      try {
        const res = await fetch("/api/floor-lines");
        const result = await res.json();
        
        if (Array.isArray(result)) {
          const groupedData = result.reduce((acc, lineItem) => {
            const floorName = lineItem.floor?.floorName || "No Floor";
            if (!acc[floorName]) {
              acc[floorName] = [];
            }
            acc[floorName].push(lineItem.lineNumber);
            return acc;
          }, {});

          setAllLinesData(groupedData);
          setFloors(Object.keys(groupedData));
        }
      } catch (err) {
        console.error("Error fetching lines", err);
      }
    };
    fetchAllLines();
  }, []);

  // Handle floor selection and update lines dropdown
  const handleFloorChange = (e) => {
    const floor = e.target.value;
    setSelectedFloor(floor);
    setSelectedLine("");
    setLines(allLinesData[floor] || []);
  };

  // Fetch line report data - FIXED
  const fetchData = async () => {
    if (!date || !selectedLine) return;
    try {
      const res = await fetch(`/api/report/line-report?date=${date}&line=${selectedLine}`);
      const result = await res.json();
      
      // Transform the API response to match component structure
      if (result.tableData) {
        const transformedData = {
          line: result.line,
          supervisor: result.supervisor,
          operators: result.tableData.filter(item => item.workAs === "operator"),
          helpers: result.tableData.filter(item => item.workAs === "helper")
        };
        setData(transformedData);
      } else {
        // If API response already has operators and helpers, use as is
        setData(result);
      }
    } catch (err) {
      console.error("Error fetching line report", err);
    }
  };

  // Excel process paste
  const handleExcelPaste = (e) => {
    const pastedLines = e.target.value
      .split(/\r?\n/)
      .filter((p) => p !== "");
      
    const processed = pastedLines.map(p => ({
      original: p,
      sanitized: p.replace(/\s/g, "").toLowerCase()
    }));
    
    setExcelProcesses(processed);
  };

  // Frequency map - now works with array of objects
  const buildCountMap = (arr) => {
    const map = {};
    arr.forEach((item) => {
      map[item.sanitized] = (map[item.sanitized] || 0) + 1;
    });
    return map;
  };

  // Function to save the report - FIXED data structure
  const handleSaveReport = async () => {
    if (!data || !excelProcesses.length) {
      alert("Please fetch the report and paste Excel processes before saving.");
      return;
    }

    setIsSaving(true);
    try {
      // Step 1: Check if the line has been marked as complete for this date
      const completionRes = await fetch(`/api/line-completion?date=${date}&line=${selectedLine}`);
      if (!completionRes.ok) {
        const errorData = await completionRes.json();
        alert(`Failed to check line completion status: ${errorData.error}`);
        setIsSaving(false);
        return;
      }

      const completionData = await completionRes.json();
      if (completionData.length === 0) {
        alert("This line is not complete yet, please complete the line first.");
        setIsSaving(false);
        return;
      }
      
      // Step 2: Check if the report for this date and line already exists
      const existenceRes = await fetch(`/api/report/breakdown-check-get-by-floor?date=${date}&floor=${selectedFloor}`);
      
      let reportExists = false;
      
      if (existenceRes.ok) {
        const reports = await existenceRes.json();
        reportExists = Array.isArray(reports) && reports.some(report => report.line === selectedLine);
      } else if (existenceRes.status === 404) {
        reportExists = false;
      } else {
        throw new Error(`API error: ${existenceRes.status}`);
      }
      
      if (reportExists) {
        alert("The report for this date and line has already been saved.");
        setIsSaving(false);
        return;
      }
      
      // Use the combined records for saving
      const allRecords = [...(data.operators || []), ...(data.helpers || [])];
      const excelMap = buildCountMap(excelProcesses);
      const excelLeft = { ...excelMap };
      
      const matchedRecords = [];
      const unmatchedRecords = [];
      const missingProcesses = [];
      
      const allProcessesSanitizedMap = {};
      allRecords.forEach(op => {
        const proc = op.process ? op.process.replace(/\s/g, "").toLowerCase() : "";
        allProcessesSanitizedMap[proc] = op.process;
        if (excelLeft[proc] && excelLeft[proc] > 0) {
          matchedRecords.push(op);
          excelLeft[proc] -= 1;
        } else {
          unmatchedRecords.push(op);
        }
      });

      // Build missing processes array using original names
      Object.entries(excelLeft).forEach(([procSanitized, count]) => {
        if (count > 0) {
          const originalProcess = excelProcesses.find(ep => ep.sanitized === procSanitized)?.original || procSanitized;
          for (let i = 0; i < count; i++) {
            missingProcesses.push(originalProcess);
          }
        }
      });

      const reportData = {
        date,
        line: selectedLine,
        floor: selectedFloor,
        supervisor: data.supervisor,
        totalRecords: allRecords.length,
        allRecords: allRecords,
        matchedProcesses: matchedRecords,
        unmatchedProcesses: unmatchedRecords,
        missingProcesses: missingProcesses,
      };

      const res = await fetch('/api/report/breakdown-check-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });

      if (res.ok) {
        alert("Report saved successfully!");
      } else {
        const errorData = await res.json();
        alert(`Failed to save report: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Error saving report:", error);
      alert("An error occurred while saving the report.");
    } finally {
      setIsSaving(false);
    }
  };

  // Helper function to get all records for display
  const getAllRecords = () => {
    if (!data) return [];
    
    // If data has tableData (original API response), use that
    if (data.tableData) {
      return data.tableData;
    }
    
    // If data has operators and helpers (transformed data), combine them
    return [...(data.operators || []), ...(data.helpers || [])];
  };

  return (
    <div className="p-6 bg-[#1A1B22] text-[#E5E9F0] font-sans min-h-screen">
      <SidebarNavLayout/>
      <h2 className="text-xl font-bold mb-4">Line Report</h2>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <div 
        
            onClick={() => document.getElementById("date")?.showPicker()}
        >
        <input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border p-2 rounded bg-[#2D3039] text-[#E5E9F0] placeholder-[#B0B0B0]"
        />
        </div>

        {/* Floor dropdown */}
        <select
          value={selectedFloor}
          onChange={handleFloorChange}
          className="border p-2 rounded bg-[#2D3039] text-[#E5E9F0]"
        >
          <option value="">Select a floor</option>
          {floors.map((fl, idx) => (
            <option key={idx} value={fl}>
              {fl}
            </option>
          ))}
        </select>

        {/* Line dropdown */}
        <select
          value={selectedLine}
          onChange={(e) => setSelectedLine(e.target.value)}
          className="border p-2 rounded bg-[#2D3039] text-[#E5E9F0]"
          disabled={!selectedFloor}
        >
          <option value="">Select a line</option>
          {lines.map((ln, idx) => (
            <option key={idx} value={ln}>
              {ln}
            </option>
          ))}
        </select>

        <button
          onClick={fetchData}
          className="bg-blue-600 text-[#E5E9F0] px-4 py-2 rounded"
        >
          Search
        </button>

        {/* Save button */}
        <button
          onClick={handleSaveReport}
          className={`px-4 py-2 rounded ${isSaving ? 'bg-gray-500' : 'bg-green-600'}`}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Report'}
        </button>
      </div>

      {/* Excel paste */}
      <div className="mb-4">
        <textarea
          onChange={handleExcelPaste}
          placeholder="Paste your process column here"
          className="w-full h-24 border p-2 rounded bg-[#2D3039] text-[#E5E9F0] placeholder-[#B0B0B0]"
        />
      </div>

      {/* Table - FIXED rendering logic */}
      {data && getAllRecords().length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Line: {data.line} | Supervisor: {data.supervisor}
          </h3>

          <table className="w-full border border-collapse">
            <thead>
              <tr className="bg-[#2D3039] text-[#E5E9F0]">
                <th className="border p-2">Operator ID</th>
                <th className="border p-2">Line</th>
                <th className="border p-2">Name</th>
                <th className="border p-2">Designation</th>
                <th className="border p-2">Machine Type</th>
                <th className="border p-2">Unique Machine</th>
                <th className="border p-2">Process</th>
                <th className="border p-2">Target</th>
                <th className="border p-2">Achievement</th>
                <th className="border p-2">Status</th>
                <th className="border p-2">Work As</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const allRecords = getAllRecords();
                const excelMap = buildCountMap(excelProcesses);
                const excelLeft = { ...excelMap };

                return (
                  <>
                    {allRecords.map((op, idx) => {
                      const proc = op.process ? op.process.replace(/\s/g, "").toLowerCase() : "";
                      let isMatched = false;

                      if (proc && excelLeft[proc] && excelLeft[proc] > 0) {
                        isMatched = true;
                        excelLeft[proc] -= 1;
                      }

                      return (
                        <tr
                          key={idx}
                          className={
                            isMatched ? "bg-green-800/30" : "bg-red-800/30"
                          }
                        >
                          <td className="border p-2">{op.operatorId}</td>
                          <td className="border p-2">{data.line}</td>
                          <td className="border p-2">{op.operatorName}</td>
                          <td className="border p-2">{op.designation}</td>
                          <td className="border p-2">{op.machineType}</td>
                          <td className="border p-2">{op.uniqueMachine}</td>
                          <td className="border p-2 font-semibold">{op.process}</td>
                          <td className="border p-2">{op.target}</td>
                          <td className="border p-2">{op.achievement}</td>
                          <td className="border p-2">{op.status}</td>
                          <td className="border p-2">{op.workAs}</td>
                        </tr>
                      );
                    })}

                    {Object.entries(excelLeft).map(([sanitizedProc, count], idx) => {
                      if (count <= 0) return null;
                      
                      const originalProc = excelProcesses.find(ep => ep.sanitized === sanitizedProc)?.original || sanitizedProc;
                      return Array.from({ length: count }).map((_, i) => (
                        <tr
                          key={`extra-${idx}-${i}`}
                          className="bg-yellow-700/40"
                        >
                          <td colSpan={11} className="border p-2 text-center font-semibold">
                            Missing Process: {originalProc}
                          </td>
                        </tr>
                      ));
                    })}
                  </>
                );
              })()}
            </tbody>
          </table>
        </div>
      )}

      {/* Show message when no data */}
      {data && getAllRecords().length === 0 && (
        <div className="text-center p-4 bg-red-900/30 rounded">
          No records found for the selected criteria
        </div>
      )}
    </div>
  );
}