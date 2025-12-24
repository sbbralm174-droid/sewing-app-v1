"use client";

import { useState } from "react";

export default function MismatchReportPage() {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0], // Default today
    floor: "",
    line: "",
    type: "operator-workAs-helper", // Default option
  });

  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setReportData(null);

    try {
      // Query Params তৈরি
      const params = new URLSearchParams();
      params.append("date", formData.date);
      params.append("type", formData.type);
      if (formData.floor) params.append("floor", formData.floor);
      if (formData.line) params.append("line", formData.line);

      const res = await fetch(`/api/reportnewdataentry/workasoperatorandhelper?${params.toString()}`);
      const result = await res.json();

      if (res.ok) {
        setReportData(result);
      } else {
        alert(result.message || "Failed to fetch data");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Designation & Work Mismatch Report
      </h1>

      {/* --- Search Form --- */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          
          {/* Date Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              name="date"
              required
              value={formData.date}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Report Type Dropdown */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="operator-workAs-helper">Designation Operator - Work As Helper</option>
              <option value="helper-workAs-operator">Designation Helper  Work As Operator</option>
            </select>
          </div>

          {/* Floor Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Floor (Optional)</label>
            <input
              type="text"
              name="floor"
              placeholder="e.g. Floor-1"
              value={formData.floor}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Line Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Line (Optional)</label>
            <input
              type="text"
              name="line"
              placeholder="e.g. Line-A"
              value={formData.line}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </form>
        
        <div className="mt-4 text-right">
             <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Searching..." : "Search Report"}
            </button>
        </div>
      </div>

      {/* --- Results Section --- */}
      {reportData && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-700">Results</h2>
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
              Total Count: {reportData.count}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                <tr>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Designation</th>
                  <th className="px-6 py-3">Work As</th>
                  <th className="px-6 py-3">Floor</th>
                  <th className="px-6 py-3">Line</th>
                  <th className="px-6 py-3">Machine</th>
                </tr>
              </thead>
              <tbody>
                {reportData.data.length > 0 ? (
                  reportData.data.map((item) => (
                    <tr key={item._id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{item.operator.operatorId}</td>
                      <td className="px-6 py-4">{item.operator.name}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800">
                          {item.operator.designation}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                         <span className={`px-2 py-1 rounded capitalize ${
                             item.workAs.toLowerCase() === 'operator' 
                             ? 'bg-green-100 text-green-800' 
                             : 'bg-indigo-100 text-indigo-800'
                         }`}>
                          {item.workAs}
                        </span>
                      </td>
                      <td className="px-6 py-4">{item.floor}</td>
                      <td className="px-6 py-4">{item.line}</td>
                      <td className="px-6 py-4">{item.uniqueMachine || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No records found matching the criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}