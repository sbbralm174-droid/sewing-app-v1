"use client";
import { useState, useEffect } from "react";

export default function LineReport() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedFloor, setSelectedFloor] = useState("");
  const [selectedLine, setSelectedLine] = useState("");
  const [floors, setFloors] = useState([]); // State to hold floor names
  const [lines, setLines] = useState([]); // State to hold lines for the selected floor
  const [allLinesData, setAllLinesData] = useState({}); // To store all lines grouped by floor
  const [data, setData] = useState(null);
  const [excelProcesses, setExcelProcesses] = useState([]); // Now stores objects with original and sanitized processes
  const [isSaving, setIsSaving] = useState(false);

  // Initial data fetch: fetch all lines grouped by floor
  useEffect(() => {
    const fetchAllLines = async () => {
      try {
        const res = await fetch("/api/floor-lines");
        const result = await res.json();
        
        if (Array.isArray(result)) {
          // Group lines by floor name
          const groupedData = result.reduce((acc, lineItem) => {
            // Updated to use 'floorName' instead of 'name'
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
    setSelectedLine(""); // Reset line when floor changes
    setLines(allLinesData[floor] || []);
  };

  // Fetch line report data
  const fetchData = async () => {
    if (!date || !selectedLine) return;
    try {
      const res = await fetch(`/api/report/line-report?date=${date}&line=${selectedLine}`);
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error("Error fetching line report", err);
    }
  };

  // Excel process paste
  const handleExcelPaste = (e) => {
    const pastedLines = e.target.value
      .split(/\r?\n/)
      .filter((p) => p !== "");
      
    // Store objects with both original and sanitized versions
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

  // Function to save the report
  const handleSaveReport = async () => {
    if (!data || !excelProcesses.length) {
      alert("Please fetch the report and paste Excel processes before saving.");
      return;
    }

    setIsSaving(true);
    try {
      // Step 1: Check if the report for this date and line already exists
      const existenceRes = await fetch(`/api/report/breakdown-check-get-by-floor?date=${date}&floor=${selectedFloor}`);
      
      let reportExists = false;
      
      if (existenceRes.ok) {
        // If response is successful (200), parse as array
        const reports = await existenceRes.json();
        reportExists = Array.isArray(reports) && reports.some(report => report.line === selectedLine);
      } else if (existenceRes.status === 404) {
        // If no reports found (404), it means the report doesn't exist yet
        reportExists = false;
      } else {
        // Handle other errors
        throw new Error(`API error: ${existenceRes.status}`);
      }
      
      if (reportExists) {
        alert("The report for this date and line has already been saved.");
        setIsSaving(false);
        return;
      }
      
      const allRecords = [...(data.operators || []), ...(data.helpers || [])];
      const excelMap = buildCountMap(excelProcesses);
      const excelLeft = { ...excelMap };
      
      const matchedRecords = [];
      const unmatchedRecords = [];
      const missingProcesses = [];
      
      const allProcessesSanitizedMap = {};
      allRecords.forEach(op => {
        const proc = op.process.replace(/\s/g, "").toLowerCase();
        allProcessesSanitizedMap[proc] = op.process; // Store original version
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
          // Find the original process name. If not found in allRecords, use the sanitized version as fallback.
          const originalProcess = excelProcesses.find(ep => ep.sanitized === procSanitized)?.original || procSanitized;
          for (let i = 0; i < count; i++) {
            missingProcesses.push(originalProcess);
          }
        }
      });

      const reportData = {
        date,
        line: selectedLine,
        floor: selectedFloor, // Changed to use selectedFloor
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

  return (
    <div className="p-6 bg-[#1A1B22] text-[#E5E9F0] font-sans min-h-screen">
      <h2 className="text-xl font-bold mb-4">Line Report</h2>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border p-2 rounded bg-[#2D3039] text-[#E5E9F0] placeholder-[#B0B0B0]"
        />

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
          disabled={!selectedFloor} // Disable line dropdown until a floor is selected
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

      {/* Table */}
      {data && (data.operators || data.helpers) && (
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
                const allRecords = [
                  ...(data.operators || []),
                  ...(data.helpers || []),
                ];

                const excelMap = {};
                excelProcesses.forEach(ep => {
                  excelMap[ep.sanitized] = (excelMap[ep.sanitized] || 0) + 1;
                });
                const excelLeft = { ...excelMap };

                return (
                  <>
                    {allRecords.map((op, idx) => {
                      const proc = op.process.replace(/\s/g, "").toLowerCase(); 
                      let isMatched = false;

                      if (excelLeft[proc] && excelLeft[proc] > 0) {
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
                      // Find the original process name for display
                      const originalProc = excelProcesses.find(ep => ep.sanitized === sanitizedProc)?.original;
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
    </div>
  );
}