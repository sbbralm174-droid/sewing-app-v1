"use client";

import { useEffect, useMemo, useState } from "react";
import { FiCalendar, FiFilter, FiAlertCircle, FiLoader, FiChevronDown } from "react-icons/fi";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

function num(n) {
  return new Intl.NumberFormat().format(n ?? 0);
}
function pct(n) {
  return `${(n ?? 0).toFixed(2)}%`;
}

export default function DailyProductionPage() {
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [floorData, setFloorData] = useState({ rows: [], summary: null });
  const [lineData, setLineData] = useState({ rows: [], summary: null });
  const [err, setErr] = useState("");
  const [openDatePicker, setOpenDatePicker] = useState(false);

  const fetchData = async (d) => {
    const dateStr = d.toISOString().split("T")[0];
    setLoading(true);
    setErr("");
    try {
      const [fRes, lRes] = await Promise.all([
        fetch(`/api/report/floor-wise-production?date=${dateStr}`),
        fetch(`/api/report/line-wise-production?date=${dateStr}`),
      ]);
      if (!fRes.ok) throw new Error("Failed to load floor-wise data");
      if (!lRes.ok) throw new Error("Failed to load line-wise data");
      const fJson = await fRes.json();
      const lJson = await lRes.json();
      setFloorData({ rows: fJson.rows || [], summary: fJson.summary || null });
      setLineData({ rows: lJson.rows || [], summary: lJson.summary || null });
    } catch (e) {
      console.error(e);
      setErr(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(date);
  }, [date]);

  const [floorFilter, setFloorFilter] = useState("");
  const lineRowsFiltered = useMemo(() => {
    if (!floorFilter) return lineData.rows;
    return lineData.rows.filter((r) => r.floor === floorFilter);
  }, [lineData.rows, floorFilter]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto bg-gray-50 rounded-xl shadow-sm">
        {/* Header Section */}
        <header className="space-y-4 bg-white p-4 rounded-lg shadow">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Daily Production Report</h1>
            <p className="text-sm text-gray-600">
              View production targets and achievements by floor and line
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <div 
                className="relative cursor-pointer"
                onClick={() => setOpenDatePicker(!openDatePicker)}
              >
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiCalendar className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={date.toLocaleDateString()}
                  readOnly
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm cursor-pointer bg-white"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <FiChevronDown className="text-gray-400" />
                </div>
              </div>
              {openDatePicker && (
                <div className="absolute z-10 mt-1">
                  <DatePicker
                    open={openDatePicker}
                    onClose={() => setOpenDatePicker(false)}
                    value={date}
                    onChange={(newDate) => {
                      setDate(newDate);
                      setOpenDatePicker(false);
                    }}
                    renderInput={({ inputRef }) => (
                      <div ref={inputRef} style={{ opacity: 0, height: 0 }} />
                    )}
                  />
                </div>
              )}
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Floor</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiFilter className="text-gray-400" />
                </div>
                <select
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm appearance-none bg-white"
                  value={floorFilter}
                  onChange={(e) => setFloorFilter(e.target.value)}
                >
                  <option value="">All Floors</option>
                  {Array.from(new Set(lineData.rows.map((r) => r.floor))).map(
                    (f) => (
                      <option key={f} value={f}>
                        {f || "-"}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          </div>
        </header>

        {/* Error Alert */}
        {err && (
          <div className="rounded-md bg-red-50 p-4 border border-red-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiAlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading data</h3>
                <div className="mt-2 text-sm text-red-700">
                  {err}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center justify-center p-4 space-x-2 text-indigo-600 bg-indigo-50 rounded-lg">
            <FiLoader className="animate-spin" />
            <span>Loading production data...</span>
          </div>
        )}

        {/* Floor-wise Table */}
        <section className="space-y-3 bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Floor-wise Production</h2>
            {floorData.summary && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Overall:</span> {pct(floorData.summary.percentage)} achieved
              </div>
            )}
          </div>

          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Floor
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Achievement
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    % Achieved
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {floorData.rows.map((r) => (
                  <tr key={r.floor} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {r.floor || "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500">
                      {num(r.totalTarget)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500">
                      {num(r.totalAchievement)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${r.percentage >= 100 ? 'bg-green-100 text-green-800' : r.percentage >= 80 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {pct(r.percentage)}
                      </span>
                    </td>
                  </tr>
                ))}

                {floorData.summary && (
                  <tr className="bg-gray-50 font-medium">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      Total
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      {num(floorData.summary.totalTarget)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      {num(floorData.summary.totalAchievement)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${floorData.summary.percentage >= 100 ? 'bg-green-100 text-green-800' : floorData.summary.percentage >= 80 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {pct(floorData.summary.percentage)}
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Line-wise Table */}
        <section className="space-y-3 bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Line-wise Production</h2>
            {lineData.summary && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Overall:</span> {pct(lineData.summary.percentage)} achieved
              </div>
            )}
          </div>

          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Floor
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Line
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Achievement
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    % Achieved
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lineRowsFiltered.map((r) => (
                  <tr key={`${r.floor}-${r.line}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {r.floor || "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {r.line || "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500">
                      {num(r.totalTarget)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500">
                      {num(r.totalAchievement)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${r.percentage >= 100 ? 'bg-green-100 text-green-800' : r.percentage >= 80 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {pct(r.percentage)}
                      </span>
                    </td>
                  </tr>
                ))}

                {lineData.summary && (
                  <tr className="bg-gray-50 font-medium">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      —
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      Total
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      {num(lineData.summary.totalTarget)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      {num(lineData.summary.totalAchievement)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${lineData.summary.percentage >= 100 ? 'bg-green-100 text-green-800' : lineData.summary.percentage >= 80 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {pct(lineData.summary.percentage)}
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </LocalizationProvider>
  );
}