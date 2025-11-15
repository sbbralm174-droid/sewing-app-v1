"use client";

import { useState, useEffect } from "react";
import SidebarNavLayout from '@/components/SidebarNavLayout';


export default function ReportPage() {
  const [date, setDate] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);


  // Column search state
  const [filters, setFilters] = useState({
    operatorId: "",
    name: "",
    designation: "",
    grade: "",
    supervisor: "",
    floor: "",
    line: "",
    process: "",
    machineType: "",
    uniqueMachine: "",
    target: "",
    workAs: "",
    status: "",
  });

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async (searchDate) => {
    setLoading(true);
    try {
      let url = "/api/report/present-absent-operator-list";
      if (searchDate) url += `?date=${searchDate}`;
      const res = await fetch(url);
      const data = await res.json();
      setReport(data);
    } catch (err) {
      console.error("Error fetching report:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchReport(date);
  };

  const handleFilterChange = (e, column) => {
    setFilters((prev) => ({ ...prev, [column]: e.target.value }));
  };

  // Filtered operators
  const filteredOperators = report
    ? report.operators.filter((op) =>
        Object.keys(filters).every((key) =>
          String(op[key]).toLowerCase().includes(filters[key].toLowerCase())
        )
      )
    : [];

  return (
    <div className="p-6 max-w-[1400px] mx-auto bg-[#1A1B22] min-h-screen text-[#E5E9F0]">
      <SidebarNavLayout />
      <h1 className="text-3xl font-bold mb-6">Daily Operator Report</h1>

      {/* Date Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          type="date"
          className="bg-[#2D3039] border border-[#2D3039] rounded-md px-3 py-2 text-[#E5E9F0] focus:outline-none focus:ring focus:ring-indigo-500 focus:ring-offset-2"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-[#E5E9F0] px-4 py-2 rounded-md shadow-sm"
        >
          Search
        </button>
      </form>

      {/* Summary */}
      {loading && <p>Loading...</p>}
      {!loading && report && (
        <>
          <div className="border border-[#2D3039] rounded-lg p-4 shadow-lg bg-[#2D3039] mb-6">
            <p>
              <strong>Date:</strong> {report.searchDate}
            </p>
            <p>
              <strong>Total Operators:</strong> {report.totalOperators}
            </p>
            <p className="text-green-700 font-semibold">
              <strong>Present:</strong> {report.present}
            </p>
            <p className="text-red-400 font-semibold">
              <strong>Absent:</strong> {report.absent}
            </p>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border text-sm bg-[#2D3039]">
              <thead>
                <tr className="bg-[#1A1B22] text-[#E5E9F0] text-xs">
                  {[
                    "ID",
                    "Name",
                    "Designation",
                    "Grade",
                    "Supervisor",
                    "Floor",
                    "Line",
                    "Process",
                    "Machine",
                    "Unique",
                    "Target",
                    "WorkAs",
                    "Status",
                  ].map((col) => (
                    <th key={col} className="border border-[#2D3039] px-2 py-2">
                      {col}
                    </th>
                  ))}
                </tr>
                {/* Search Row */}
                <tr className="bg-[#2D3039] text-[#E5E9F0] text-xs">
                  {Object.keys(filters).map((key) => (
                    <th key={key} className="border border-[#2D3039] px-1 py-1">
                      <input
                        type="text"
                        value={filters[key]}
                        onChange={(e) => handleFilterChange(e, key)}
                        placeholder="Search..."
                        className="w-full bg-[#1A1B22] border border-[#2D3039] rounded-md px-1 py-1 text-[#E5E9F0] focus:outline-none focus:ring focus:ring-indigo-500 focus:ring-offset-2 text-xs"
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredOperators.map((op) => (
                  <tr key={op.operatorId} className="text-center even:bg-[#1A1B22]">
                    <td className="border border-[#2D3039] px-2 py-1">{op.operatorId}</td>
                    <td className="border border-[#2D3039] px-2 py-1">{op.name}</td>
                    <td className="border border-[#2D3039] px-2 py-1">{op.designation}</td>
                    <td className="border border-[#2D3039] px-2 py-1">{op.grade}</td>
                    <td className="border border-[#2D3039] px-2 py-1">{op.supervisor}</td>
                    <td className="border border-[#2D3039] px-2 py-1">{op.floor}</td>
                    <td className="border border-[#2D3039] px-2 py-1">{op.line}</td>
                    <td className="border border-[#2D3039] px-2 py-1">{op.process}</td>
                    <td className="border border-[#2D3039] px-2 py-1">{op.machineType}</td>
                    <td className="border border-[#2D3039] px-2 py-1">{op.uniqueMachine}</td>
                    <td className="border border-[#2D3039] px-2 py-1">{op.target}</td>
                    <td className="border border-[#2D3039] px-2 py-1">{op.workAs}</td>
                    <td
                      className={`border border-[#2D3039] px-2 py-1 font-semibold rounded-full ${
                        op.status === "present" ? "bg-green-700 text-white" : "bg-red-400 text-white"
                      }`}
                    >
                      {op.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
