"use client";
import { useState, useEffect } from "react";

export default function ViewReportByFloor() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedFloor, setSelectedFloor] = useState("");
  const [floors, setFloors] = useState([]);
  const [allData, setAllData] = useState({ matched: [], unmatched: [], missing: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Separate filters for matched and unmatched data
  const [matchedFilters, setMatchedFilters] = useState({
    operatorId: '',
    line: '',
    operatorName: '',
    designation: '',
    machineType: '',
    uniqueMachine: '',
    process: '',
    target: '',
    achievement: '',
    status: '',
    workAs: ''
  });

  const [unmatchedFilters, setUnmatchedFilters] = useState({
    operatorId: '',
    line: '',
    operatorName: '',
    designation: '',
    machineType: '',
    uniqueMachine: '',
    process: '',
    target: '',
    achievement: '',
    status: '',
    workAs: ''
  });

  // Initial data fetch: fetch all floors to populate the dropdown
  useEffect(() => {
    const fetchFloors = async () => {
      try {
        const res = await fetch("/api/floor-lines");
        const result = await res.json();
        
        if (Array.isArray(result)) {
          // Extract unique floor names
          const uniqueFloors = [...new Set(result.map(lineItem => lineItem.floor?.floorName).filter(Boolean))];
          setFloors(uniqueFloors);
        }
      } catch (err) {
        console.error("Error fetching floors", err);
      }
    };
    fetchFloors();
  }, []);

  const handleSearch = async () => {
    if (!date || !selectedFloor) {
      setError("Please provide both a date and a floor name.");
      return;
    }

    setLoading(true);
    setError(null);
    setAllData({ matched: [], unmatched: [], missing: [] });

    try {
      const res = await fetch(`/api/report/breakdown-check-get-by-floor?date=${date}&floor=${selectedFloor}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message);
      }
      const reports = await res.json();
      
      let allMatched = [];
      let allUnmatched = [];
      let allMissing = [];

      reports.forEach(report => {
        allMatched = [...allMatched, ...report.matchedProcesses.map(p => ({ ...p, line: report.line }))];
        allUnmatched = [...allUnmatched, ...report.unmatchedProcesses.map(p => ({ ...p, line: report.line }))];
        allMissing = [...allMissing, ...report.missingProcesses.map(p => ({ process: p, line: report.line }))];
      });

      setAllData({
        matched: allMatched,
        unmatched: allUnmatched,
        missing: allMissing
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Handlers for individual filter states
  const handleMatchedFilterChange = (e) => {
    const { name, value } = e.target;
    setMatchedFilters(prevFilters => ({
      ...prevFilters,
      [name]: value.toLowerCase()
    }));
  };

  const handleUnmatchedFilterChange = (e) => {
    const { name, value } = e.target;
    setUnmatchedFilters(prevFilters => ({
      ...prevFilters,
      [name]: value.toLowerCase()
    }));
  };

  const filteredMatchedData = allData.matched.filter(item => {
    return Object.keys(matchedFilters).every(key => {
      const value = item[key] || '';
      return value.toString().toLowerCase().includes(matchedFilters[key]);
    });
  });

  const filteredUnmatchedData = allData.unmatched.filter(item => {
    return Object.keys(unmatchedFilters).every(key => {
      const value = item[key] || '';
      return value.toString().toLowerCase().includes(unmatchedFilters[key]);
    });
  });

  return (
    <div className="p-6 bg-[#1A1B22] text-[#E5E9F0] font-sans min-h-screen">
      <h2 className="text-2xl font-bold mb-6">View Saved Reports by Floor</h2>

      {/* Search fields and button */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border p-2 rounded bg-[#2D3039] text-[#E5E9F0]"
        />
        <select
          value={selectedFloor}
          onChange={(e) => setSelectedFloor(e.target.value)}
          className="border p-2 rounded bg-[#2D3039] text-[#E5E9F0]"
        >
          <option value="">Select a Floor</option>
          {floors.map((fl, idx) => (
            <option key={idx} value={fl}>
              {fl}
            </option>
          ))}
        </select>
        <button
          onClick={handleSearch}
          className="bg-blue-600 text-[#E5E9F0] px-6 py-2 rounded font-semibold"
          disabled={loading}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Loading and error messages */}
      {loading && <p className="text-gray-400">Loading report...</p>}
      {error && <p className="text-red-500">{error}</p>}
      
      {/* Report display section */}
      {allData.matched.length > 0 && (
        <div className="space-y-8">
          {/* Matched Processes Table (Combined) */}
          <div className="mt-4 overflow-x-auto">
            <h4 className="text-md font-semibold mb-2 text-green-400">Matched Processes from breakdown</h4>
            <table className="w-full border border-collapse text-sm">
              <thead>
                <tr className="bg-[#1A1B22]">
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
                <tr className="bg-[#2D3039]">
                  <td className="border p-2"><input type="text" name="operatorId" onChange={handleMatchedFilterChange} className="w-full bg-[#1A1B22] text-[#E5E9F0] rounded p-1 text-xs" placeholder="Filter" /></td>
                  <td className="border p-2"><input type="text" name="line" onChange={handleMatchedFilterChange} className="w-full bg-[#1A1B22] text-[#E5E9F0] rounded p-1 text-xs" placeholder="Filter" /></td>
                  <td className="border p-2"><input type="text" name="operatorName" onChange={handleMatchedFilterChange} className="w-full bg-[#1A1B22] text-[#E5E9F0] rounded p-1 text-xs" placeholder="Filter" /></td>
                  <td className="border p-2"><input type="text" name="designation" onChange={handleMatchedFilterChange} className="w-full bg-[#1A1B22] text-[#E5E9F0] rounded p-1 text-xs" placeholder="Filter" /></td>
                  <td className="border p-2"><input type="text" name="machineType" onChange={handleMatchedFilterChange} className="w-full bg-[#1A1B22] text-[#E5E9F0] rounded p-1 text-xs" placeholder="Filter" /></td>
                  <td className="border p-2"><input type="text" name="uniqueMachine" onChange={handleMatchedFilterChange} className="w-full bg-[#1A1B22] text-[#E5E9F0] rounded p-1 text-xs" placeholder="Filter" /></td>
                  <td className="border p-2"><input type="text" name="process" onChange={handleMatchedFilterChange} className="w-full bg-[#1A1B22] text-[#E5E9F0] rounded p-1 text-xs" placeholder="Filter" /></td>
                  <td className="border p-2"><input type="text" name="target" onChange={handleMatchedFilterChange} className="w-full bg-[#1A1B22] text-[#E5E9F0] rounded p-1 text-xs" placeholder="Filter" /></td>
                  <td className="border p-2"><input type="text" name="achievement" onChange={handleMatchedFilterChange} className="w-full bg-[#1A1B22] text-[#E5E9F0] rounded p-1 text-xs" placeholder="Filter" /></td>
                  <td className="border p-2"><input type="text" name="status" onChange={handleMatchedFilterChange} className="w-full bg-[#1A1B22] text-[#E5E9F0] rounded p-1 text-xs" placeholder="Filter" /></td>
                  <td className="border p-2"><input type="text" name="workAs" onChange={handleMatchedFilterChange} className="w-full bg-[#1A1B22] text-[#E5E9F0] rounded p-1 text-xs" placeholder="Filter" /></td>
                </tr>
              </thead>
              <tbody>
                {filteredMatchedData.map((p, idx) => (
                  <tr key={idx} className="bg-green-800/20">
                    <td className="border p-2">{p.operatorId}</td>
                    <td className="border p-2">{p.line}</td>
                    <td className="border p-2">{p.operatorName}</td>
                    <td className="border p-2">{p.designation}</td>
                    <td className="border p-2">{p.machineType}</td>
                    <td className="border p-2">{p.uniqueMachine}</td>
                    <td className="border p-2">{p.process}</td>
                    <td className="border p-2">{p.target}</td>
                    <td className="border p-2">{p.achievement}</td>
                    <td className="border p-2">{p.status}</td>
                    <td className="border p-2">{p.workAs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {allData.unmatched.length > 0 && (
        <div className="space-y-8">
          {/* Unmatched Processes Table (Combined) */}
          <div className="mt-4 overflow-x-auto">
            <h4 className="text-md font-semibold mb-2 text-red-400">Unmatched Processes from breakdown</h4>
            <table className="w-full border border-collapse text-sm">
              <thead>
                <tr className="bg-[#1A1B22]">
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
                <tr className="bg-[#2D3039]">
                  <td className="border p-2"><input type="text" name="operatorId" onChange={handleUnmatchedFilterChange} className="w-full bg-[#1A1B22] text-[#E5E9F0] rounded p-1 text-xs" placeholder="Filter" /></td>
                  <td className="border p-2"><input type="text" name="line" onChange={handleUnmatchedFilterChange} className="w-full bg-[#1A1B22] text-[#E5E9F0] rounded p-1 text-xs" placeholder="Filter" /></td>
                  <td className="border p-2"><input type="text" name="operatorName" onChange={handleUnmatchedFilterChange} className="w-full bg-[#1A1B22] text-[#E5E9F0] rounded p-1 text-xs" placeholder="Filter" /></td>
                  <td className="border p-2"><input type="text" name="designation" onChange={handleUnmatchedFilterChange} className="w-full bg-[#1A1B22] text-[#E5E9F0] rounded p-1 text-xs" placeholder="Filter" /></td>
                  <td className="border p-2"><input type="text" name="machineType" onChange={handleUnmatchedFilterChange} className="w-full bg-[#1A1B22] text-[#E5E9F0] rounded p-1 text-xs" placeholder="Filter" /></td>
                  <td className="border p-2"><input type="text" name="uniqueMachine" onChange={handleUnmatchedFilterChange} className="w-full bg-[#1A1B22] text-[#E5E9F0] rounded p-1 text-xs" placeholder="Filter" /></td>
                  <td className="border p-2"><input type="text" name="process" onChange={handleUnmatchedFilterChange} className="w-full bg-[#1A1B22] text-[#E5E9F0] rounded p-1 text-xs" placeholder="Filter" /></td>
                  <td className="border p-2"><input type="text" name="target" onChange={handleUnmatchedFilterChange} className="w-full bg-[#1A1B22] text-[#E5E9F0] rounded p-1 text-xs" placeholder="Filter" /></td>
                  <td className="border p-2"><input type="text" name="achievement" onChange={handleUnmatchedFilterChange} className="w-full bg-[#1A1B22] text-[#E5E9F0] rounded p-1 text-xs" placeholder="Filter" /></td>
                  <td className="border p-2"><input type="text" name="status" onChange={handleUnmatchedFilterChange} className="w-full bg-[#1A1B22] text-[#E5E9F0] rounded p-1 text-xs" placeholder="Filter" /></td>
                  <td className="border p-2"><input type="text" name="workAs" onChange={handleUnmatchedFilterChange} className="w-full bg-[#1A1B22] text-[#E5E9F0] rounded p-1 text-xs" placeholder="Filter" /></td>
                </tr>
              </thead>
              <tbody>
                {filteredUnmatchedData.map((p, idx) => (
                  <tr key={idx} className="bg-red-800/20">
                    <td className="border p-2">{p.operatorId}</td>
                    <td className="border p-2">{p.line}</td>
                    <td className="border p-2">{p.operatorName}</td>
                    <td className="border p-2">{p.designation}</td>
                    <td className="border p-2">{p.machineType}</td>
                    <td className="border p-2">{p.uniqueMachine}</td>
                    <td className="border p-2">{p.process}</td>
                    <td className="border p-2">{p.target}</td>
                    <td className="border p-2">{p.achievement}</td>
                    <td className="border p-2">{p.status}</td>
                    <td className="border p-2">{p.workAs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {allData.missing.length > 0 && (
        <div className="space-y-8">
          {/* Missing Processes List (Combined) */}
          <div className="mt-4">
            <h4 className="text-md font-semibold mb-2 text-yellow-400">Missing Processes from breakdown</h4>
            <ul className="list-disc pl-5">
              {allData.missing.map((p, idx) => (
                <li key={idx} className="text-yellow-200">{`Line: ${p.line} - Process: ${p.process}`}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}