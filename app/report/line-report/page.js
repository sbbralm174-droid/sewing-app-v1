"use client";
import { useState, useEffect } from "react";

export default function DailyProductionPage() {
  const [date, setDate] = useState("");
  const [line, setLine] = useState("");
  const [lines, setLines] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch floor lines for dropdown
  useEffect(() => {
    const fetchLines = async () => {
      try {
        const res = await fetch("/api/floor-lines");
        const data = await res.json();
        if (res.ok) {
          setLines(data || []);
        }
      } catch {
        console.error("Failed to fetch lines");
      }
    };
    fetchLines();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`/api/report/line-report?date=${date}&line=${line}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || data.message || "Something went wrong");
      } else {
        setResult(data);
      }
    } catch {
      setError("Failed to fetch data");
    }
    setLoading(false);
  };

  const Table = ({ title, rows, color }) => (
    <div className="mb-8">
      <h3 className={`text-lg font-semibold mb-2 ${color}`}>{title}</h3>
      <div className="overflow-x-auto border rounded-lg shadow-sm">
        <table className="min-w-full text-sm text-gray-800">
          <thead className="bg-blue-700 text-white">
            <tr>
              <th className="px-4 py-2 border">Operator ID</th>
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">Designation</th>
              <th className="px-4 py-2 border">Machine Type</th>
              <th className="px-4 py-2 border">Machine No.</th>
              <th className="px-4 py-2 border">Process</th>
              <th className="px-4 py-2 border">Target</th>
              <th className="px-4 py-2 border">Achievement</th>
              <th className="px-4 py-2 border">% Achieved</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const achievementPercent =
                row.target > 0 ? ((row.achievement / row.target) * 100).toFixed(1) : "0";
              return (
                <tr
                  key={idx}
                  className="even:bg-gray-50 odd:bg-white hover:bg-yellow-50"
                >
                  <td className="border px-4 py-2">{row.operatorId}</td>
                  <td className="border px-4 py-2 font-medium">{row.operatorName}</td>
                  <td className="border px-4 py-2">{row.designation}</td>
                  <td className="border px-4 py-2">{row.machineType}</td>
                  <td className="border px-4 py-2">{row.uniqueMachine}</td>
                  <td className="border px-4 py-2">{row.process}</td>
                  <td className="border px-4 py-2">{row.target}</td>
                  <td className="border px-4 py-2">{row.achievement}</td>
                  <td className="border px-4 py-2">{achievementPercent}%</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center text-gray-500 py-3 border">
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="p-6 font-sans">
      <h1 className="text-2xl font-bold mb-4 text-center text-white-800">
        Daily line wise Production Report
      </h1>

      {/* Filter */}
<div className="flex flex-col sm:flex-row gap-4 mb-6">
<div
  className="border rounded bg-white text-black px-3 py-2 focus-within:ring-2 focus-within:ring-blue-400 cursor-pointer flex items-center"
  onClick={() => document.getElementById("dateInput")?.showPicker()} // ✅ যেকোনো জায়গায় ক্লিক করলে date picker খুলবে
>
  <input
    id="dateInput"
    type="date"
    value={date}
    onChange={(e) => setDate(e.target.value)}
    className="w-full   cursor-pointer outline-none"
  />
</div>


  <select
    value={line}
    onChange={(e) => setLine(e.target.value)}
    className="border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400 bg-white text-black"
  >
    <option value="">Select Line</option>
    {lines.map((l, idx) => (
      <option key={idx} value={l.lineNumber}>
        {l.lineNumber}
      </option>
    ))}
  </select>

  <button
    onClick={fetchData}
    disabled={!date || !line || loading}
    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
  >
    {loading ? "Loading..." : "Search"}
  </button>
</div>


      {error && <p className="text-red-500 mb-4">{error}</p>}

      {result && (
        <div>
          {/* Summary */}
          <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-600 rounded">
            <h2 className="text-lg font-semibold text-blue-900">
              Line: {result.line} | Supervisor: {result.supervisor}
            </h2>
            <div className="mt-2 text-sm text-gray-700">
              <span className="mr-4">Total Operators: {result.operators?.length || 0}</span>
              <span className="mr-4">Total Helpers: {result.helpers?.length || 0}</span>
              <span className="mr-4">
                Total Manpower: {(result.operators?.length || 0) + (result.helpers?.length || 0)}
              </span>
              <span className="mr-4">
                Total Target:{" "}
                {[
                  ...(result.operators || []),
                  ...(result.helpers || []),
                ].reduce((sum, r) => sum + (r.target || 0), 0)}
              </span>
              <span className="mr-4">
                Total Achievement:{" "}
                {[
                  ...(result.operators || []),
                  ...(result.helpers || []),
                ].reduce((sum, r) => sum + (r.achievement || 0), 0)}
              </span>
              <span>
                Achievement %:{" "}
                {(() => {
                  const totalTarget = [
                    ...(result.operators || []),
                    ...(result.helpers || []),
                  ].reduce((sum, r) => sum + (r.target || 0), 0);
                  const totalAch = [
                    ...(result.operators || []),
                    ...(result.helpers || []),
                  ].reduce((sum, r) => sum + (r.achievement || 0), 0);
                  return totalTarget > 0
                    ? ((totalAch / totalTarget) * 100).toFixed(1)
                    : "0";
                })()}%
              </span>
            </div>
          </div>

          {/* Tables */}
          <Table title="Operators" rows={result.operators} color="text-blue-700" />
          <Table title="Helpers" rows={result.helpers} color="text-green-700" />
        </div>
      )}
    </div>
  );
}
