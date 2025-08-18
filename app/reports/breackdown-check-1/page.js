"use client";
import { useState, useEffect } from "react";

export default function LineReport() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [line, setLine] = useState("");
  const [lines, setLines] = useState([]); // সব লাইন নাম রাখবে
  const [data, setData] = useState(null);
  const [excelProcesses, setExcelProcesses] = useState([]);

  // Line dropdown data fetch
  useEffect(() => {
    const fetchLines = async () => {
      try {
        const res = await fetch("/api/floor-lines");
        const result = await res.json();
        if (Array.isArray(result)) {
          setLines(result.map((l) => l.lineNumber));
        }
      } catch (err) {
        console.error("Error fetching lines", err);
      }
    };
    fetchLines();
  }, []);

  // Fetch line report data
  const fetchData = async () => {
    if (!date || !line) return;

    try {
      const res = await fetch(
        `/api/report/line-report?date=${date}&line=${line}`
      );
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error("Error fetching line report", err);
    }
  };

  // Excel process paste
  const handleExcelPaste = (e) => {
    const pasted = e.target.value
      .split(/\r?\n/)
      .map((p) => p.trim())
      .filter((p) => p !== "");
    setExcelProcesses(pasted.map((p) => p.toLowerCase()));
  };

  // Frequency map
  const buildCountMap = (arr) => {
    const map = {};
    arr.forEach((item) => {
      map[item] = (map[item] || 0) + 1;
    });
    return map;
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

        {/* Line dropdown */}
        <select
          value={line}
          onChange={(e) => setLine(e.target.value)}
          className="border p-2 rounded bg-[#2D3039] text-[#E5E9F0]"
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

                const excelMap = buildCountMap(excelProcesses);
                const excelLeft = { ...excelMap };

                return (
                  <>
                    {allRecords.map((op, idx) => {
                      const proc = op.process.toLowerCase();
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

                    {Object.entries(excelLeft).map(([proc, count], idx) =>
                      Array.from({ length: count }).map((_, i) => (
                        <tr
                          key={`extra-${idx}-${i}`}
                          className="bg-yellow-700/40"
                        >
                          <td colSpan={10} className="border p-2 text-center font-semibold">
                            Missing Process: {proc}
                          </td>
                        </tr>
                      ))
                    )}
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
