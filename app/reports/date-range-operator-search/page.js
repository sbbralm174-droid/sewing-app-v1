"use client";
import { useState } from "react";
import Layout from "@/components/Layout";

export default function DailyProductionSearchPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [operatorSearch, setOperatorSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!startDate || !endDate || !operatorSearch) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/report/date-range-operator-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate, operatorSearch }),
      });

      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
      alert("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  const calculateAchievement = (hourlyProduction) => {
    if (!Array.isArray(hourlyProduction)) return 0;
    return hourlyProduction.reduce(
      (sum, entry) => sum + (entry.productionCount || 0),
      0
    );
  };

  return (
    <Layout>
      <div
        className="p-6 max-w-6xl mx-auto"
        style={{
          backgroundColor: "#1A1B22",
          color: "#E5E9F0",
          fontFamily: "sans-serif",
        }}
      >
        <h1 className="text-2xl font-bold mb-4">Daily Production Search</h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-end mb-6">
          <div>
            <label className="block text-sm font-medium">Start Date</label>
            <input
              type="date"
              className="border rounded p-2"
              style={{ backgroundColor: "#2D3039", color: "#E5E9F0" }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">End Date</label>
            <input
              type="date"
              className="border rounded p-2"
              style={{ backgroundColor: "#2D3039", color: "#E5E9F0" }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Operator</label>
            <input
              type="text"
              placeholder="Name or ID"
              className="border rounded p-2"
              style={{ backgroundColor: "#2D3039", color: "#E5E9F0" }}
              value={operatorSearch}
              onChange={(e) => setOperatorSearch(e.target.value)}
            />
          </div>
          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Search
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <p>Loading...</p>
        ) : results.length > 0 ? (
          <div
            className="overflow-x-auto border rounded"
            style={{ color: "#E5E9F0" }}
          >
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ backgroundColor: "#2D3039" }}>
                  <th className="border p-2">Date</th>
                  <th className="border p-2">Operator ID</th>
                  <th className="border p-2">Name</th>
                  <th className="border p-2">Floor</th>
                  <th className="border p-2">Line</th>
                  <th className="border p-2">Process</th>
                  <th className="border p-2">Machine Type</th>
                  <th className="border p-2">Unique Machine</th>
                  <th className="border p-2">Target</th>
                  <th className="border p-2">Achievement</th>
                  <th className="border p-2">Achievement %</th>
                  <th className="border p-2">Work As</th>
                </tr>
              </thead>
              <tbody>
                {results.map((prod, i) => {
                  const achievement = calculateAchievement(
                    prod.hourlyProduction
                  );
                  const achievementPercent = prod.target
                    ? ((achievement / prod.target) * 100).toFixed(1) + "%"
                    : "0%";

                  return (
                    <tr
                      key={i}
                      style={{
                        backgroundColor: i % 2 === 0 ? "#1A1B22" : "#2D3039",
                      }}
                    >
                      <td className="border p-2">
                        {new Date(prod.date).toLocaleDateString()}
                      </td>
                      <td className="border p-2">
                        {prod.operator?.operatorId}
                      </td>
                      <td className="border p-2">{prod.operator?.name}</td>
                      <td className="border p-2">{prod.floor}</td>
                      <td className="border p-2">{prod.line}</td>
                      <td className="border p-2">{prod.process}</td>
                      <td className="border p-2">{prod.machineType}</td>
                      <td className="border p-2">{prod.uniqueMachine}</td>
                      <td className="border p-2">{prod.target}</td>
                      <td className="border p-2">{achievement}</td>
                      <td className="border p-2">{achievementPercent}</td>
                      <td className="border p-2">{prod.workAs}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No records found</p>
        )}
      </div>
    </Layout>
  );
}
