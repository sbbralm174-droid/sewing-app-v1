"use client";
import Layout from "@/components/Layout";
import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  ComposedChart,
  LabelList,
} from "recharts";

// This is the ParetoChart component integrated directly into the file
const ParetoChart = ({ data, totalHour, currentHour }) => {
  if (!data || data.length === 0 || !totalHour) {
    return null;
  }

  // Calculate % Achieved and Hourly % for each operator
  const processedData = data.map((item) => {
    const totalTarget = item.target && totalHour ? item.target * totalHour : 0;
    const achievementPercent =
      totalTarget > 0 ? (item.achievement / totalTarget) * 100 : 0;
    
    const estimatedCurrentProduction =
      item.target && currentHour ? item.target * currentHour : 0;
    const hourlyAchievementPercent =
      estimatedCurrentProduction > 0
        ? (item.achievement / estimatedCurrentProduction) * 100
        : 0;

    return {
      name: item.operatorId,
      achievementPercent: parseFloat(achievementPercent.toFixed(1)),
      hourlyAchievementPercent: parseFloat(hourlyAchievementPercent.toFixed(1)),
    };
  });

  // Sort data in descending order by achievementPercent
  processedData.sort((a, b) => b.achievementPercent - a.achievementPercent);

  // Calculate cumulative percentage
  let cumulativeTotal = 0;
  const totalAchievement = processedData.reduce(
    (sum, item) => sum + item.achievementPercent,
    0
  );

  const finalData = processedData.map((item) => {
    cumulativeTotal += item.achievementPercent;
    return {
      ...item,
      cumulativePercent: (cumulativeTotal / totalAchievement) * 100,
    };
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div
          className="p-3 border rounded shadow"
          style={{ backgroundColor: "#2D3039", borderColor: "#4C566A" }}
        >
          <p className="text-sm font-bold" style={{ color: "#E5E9F0" }}>{`Operator: ${label}`}</p>
          <p className="text-xs mt-1" style={{ color: "#8884d8" }}>{`Total Achieved %: ${dataPoint.achievementPercent}%`}</p>
          <p className="text-xs mt-1" style={{ color: "#ff7300" }}>{`Hourly Achieved %: ${dataPoint.hourlyAchievementPercent}%`}</p>
          <p className="text-xs mt-1" style={{ color: "#E5E9F0" }}>{`Cumulative %: ${dataPoint.cumulativePercent.toFixed(1)}%`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: "100%", height: 400, marginBottom: "2rem" }}>
      <ResponsiveContainer>
        <ComposedChart
          data={finalData}
          margin={{
            top: 20,
            right: 20,
            bottom: 20,
            left: 20,
          }}
        >
          <CartesianGrid stroke="#4C566A" />
          <XAxis
            dataKey="name"
            stroke="#E5E9F0"
            angle={-45} // Rotate labels by -45 degrees
            textAnchor="end" // Align the text to the end
            interval={0} // Show all labels
            height={70} // Increase height to prevent cutoff
          />
          <YAxis
            yAxisId="left"
            label={{
              value: "% Achieved",
              angle: -90,
              position: "insideLeft",
              fill: "#E5E9F0",
            }}
            stroke="#E5E9F0"
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            label={{
              value: "Cumulative %",
              angle: 90,
              position: "insideRight",
              fill: "#E5E9F0",
            }}
            stroke="#E5E9F0"
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar
            yAxisId="left"
            dataKey="achievementPercent"
            name="Total Achieved %"
            fill="#8884d8"
          >
            <LabelList dataKey="achievementPercent" position="top" fill="#E5E9F0" />
          </Bar>
          <Line
            yAxisId="right"
            dataKey="cumulativePercent"
            name="Cumulative %"
            stroke="#ff7300"
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default function DailyProductionPage() {
  const [date, setDate] = useState("");
  const [line, setLine] = useState("");
  const [lines, setLines] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [totalHour, setTotalHour] = useState("");
  const [currentHour, setCurrentHour] = useState("");

  // Fetch floor lines
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

    // Basic validation
    if (!date || !line) {
      setError("Please select a date and a line.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `/api/report/line-report?date=${date}&line=${line}`
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || data.message || "Something went wrong");
      } else {
        const updatedData = data.tableData.map((item) => ({
          ...item,
          totalHour: totalHour,
          currentHour: currentHour,
        }));
        setResult({ ...data, tableData: updatedData });
      }
    } catch (e) {
      setError("Failed to fetch data. Check your network or server logs.");
      console.error(e);
    }
    setLoading(false);
  };

  const Table = ({ title, rows, color }) => (
    <div className="mb-8">
      <h3
        className={`text-lg font-semibold mb-2 ${color}`}
        style={{ color: "#E5E9F0" }}
      >
        {title}
      </h3>
      <div
        className="overflow-x-auto border rounded-lg shadow-sm"
        style={{ borderColor: "#4C566A" }}
      >
        <table className="min-w-full text-sm" style={{ color: "#E5E9F0" }}>
          <thead style={{ backgroundColor: "#3B4252", color: "#E5E9F0" }}>
            <tr>
              <th className="px-4 py-2 border">Operator ID</th>
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">Designation</th>
              <th className="px-4 py-2 border">Machine Type</th>
              <th className="px-4 py-2 border">Machine No.</th>
              <th className="px-4 py-2 border">Process</th>
              <th className="px-4 py-2 border">Hourly Target</th>
              <th className="px-4 py-2 border">Achievement</th>
              <th className="px-4 py-2 border">Total Achieved %</th>
              <th className="px-4 py-2 border">Hourly Achieved %</th>
              <th className="px-4 py-2 border">Total Target</th>
              <th className="px-4 py-2 border">Expected Production</th>
              <th className="px-4 py-2 border">Deviation</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const totalTarget =
                row.target && totalHour ? row.target * totalHour : 0;

              const achievementPercent =
                totalTarget > 0
                  ? ((row.achievement / totalTarget) * 100).toFixed(1)
                  : 0;

              const estimatedCurrentProduction =
                row.target && currentHour ? row.target * currentHour : 0;

              const hourlyAchievementPercent =
                estimatedCurrentProduction > 0
                  ? ((row.achievement / estimatedCurrentProduction) * 100).toFixed(1)
                  : 0;

              const deviation =
                (row.achievement || 0) - estimatedCurrentProduction;

              return (
                <tr
                  key={idx}
                  className="even:bg-[#2D3039] odd:bg-[#2D3039] hover:bg-[#3B4252]"
                >
                  <td className="border px-4 py-2">{row.operatorId}</td>
                  <td className="border px-4 py-2 font-medium">
                    {row.operatorName}
                  </td>
                  <td className="border px-4 py-2">{row.designation}</td>
                  <td className="border px-4 py-2">{row.machineType}</td>
                  <td className="border px-4 py-2">{row.uniqueMachine}</td>
                  <td className="border px-4 py-2">{row.process}</td>
                  <td className="border px-4 py-2">{row.target}</td>
                  <td className="border px-4 py-2">{row.achievement}</td>
                  <td className="border px-4 py-2">{achievementPercent}%</td>
                  <td className="border px-4 py-2">{hourlyAchievementPercent}%</td>
                  <td className="border px-4 py-2">{totalTarget}</td>
                  <td className="border px-4 py-2">
                    {estimatedCurrentProduction}
                  </td>
                  <td className="border px-4 py-2">{deviation}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={12}
                  className="text-center py-3 border"
                  style={{ color: "#A3A3A3" }}
                >
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
    <Layout>
      <div
        className="p-6"
        style={{
          backgroundColor: "#1A1B22",
          fontFamily: "'Inter', sans-serif",
          color: "#E5E9F0",
        }}
      >
        <h1
          className="text-2xl font-bold mb-4 text-center"
          style={{ color: "#E5E9F0" }}
        >
          Daily line wise Production Report
        </h1>

        {/* Filter */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-6">
          {/* Date */}
          <div
            className="border rounded px-3 py-2 flex items-center cursor-pointer focus-within:ring-2"
            style={{
              backgroundColor: "#2D3039",
              borderColor: "#4C566A",
              color: "#E5E9F0",
            }}
            onClick={() => document.getElementById("dateInput")?.showPicker()}
          >
            <input
              id="dateInput"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full cursor-pointer outline-none bg-transparent"
              style={{ color: "#E5E9F0" }}
            />
          </div>

          {/* Line */}
          <select
            value={line}
            onChange={(e) => setLine(e.target.value)}
            className="border rounded px-3 py-2 focus:ring-2"
            style={{
              backgroundColor: "#2D3039",
              borderColor: "#4C566A",
              color: "#E5E9F0",
            }}
          >
            <option value="">Select Line</option>
            {lines.map((l, idx) => (
              <option key={idx} value={l.lineNumber}>
                {l.lineNumber}
              </option>
            ))}
          </select>

          {/* Total Hour */}
          <input
            type="number"
            placeholder="Total Hour"
            value={totalHour}
            onChange={(e) => setTotalHour(Number(e.target.value))}
            className="border rounded px-3 py-2"
            style={{
              backgroundColor: "#2D3039",
              borderColor: "#4C566A",
              color: "#E5E9F0",
            }}
          />

          {/* Current Hour */}
          <input
            type="number"
            placeholder="Current Hour"
            value={currentHour}
            onChange={(e) => setCurrentHour(Number(e.target.value))}
            className="border rounded px-3 py-2"
            style={{
              backgroundColor: "#2D3039",
              borderColor: "#4C566A",
              color: "#E5E9F0",
            }}
          />

          <button
            onClick={fetchData}
            disabled={!date || !line || loading}
            className="px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            style={{ backgroundColor: "#5E81AC", color: "#E5E9F0" }}
          >
            {loading ? "Loading..." : "Search"}
          </button>
        </div>

        {error && (
          <p className="mb-4" style={{ color: "#BF616A" }}>
            {error}
          </p>
        )}

        {result && (
          <div>
            {/* Summary */}
            <div
              className="mb-6 p-4 rounded"
              style={{
                backgroundColor: "#2D3039",
                borderLeft: "4px solid #5E81AC",
                color: "#E5E9F0",
              }}
            >
              <h2 className="text-lg font-semibold">
                Line: {result.line} | Supervisor: {result.supervisor}
              </h2>
              <div
                className="mt-2 text-sm"
                style={{ color: "#D8DEE9" }}
              >
                <span className="mr-4">
                  Total Manpower: {result.tableData?.length || 0}
                </span>
                <span className="mr-4">
                  Total Target:{" "}
                  {result.tableData?.reduce(
                    (sum, r) => sum + (r.target || 0),
                    0
                  ) || 0}
                </span>
                <span className="mr-4">
                  Total Achievement:{" "}
                  {result.tableData?.reduce(
                    (sum, r) => sum + (r.achievement || 0),
                    0
                  ) || 0}
                </span>
                <span>
                  Achievement %:{" "}
                  {(() => {
                    const totalTarget = result.tableData?.reduce(
                      (sum, r) => sum + (r.target || 0),
                      0
                    ) || 0;
                    const totalAch = result.tableData?.reduce(
                      (sum, r) => sum + (r.achievement || 0),
                      0
                    ) || 0;
                    return totalTarget > 0
                      ? ((totalAch / totalTarget) * 100).toFixed(1)
                      : "0";
                  })()}
                  %
                </span>
              </div>
            </div>

            {/* Render the new Pareto chart component */}
            <ParetoChart
              data={result.tableData}
              totalHour={totalHour}
              currentHour={currentHour}
            />

            {/* Render the single table with the combined data */}
            <Table
              title="Production Report"
              rows={result.tableData}
              color="text-blue-400"
            />
          </div>
        )}
      </div>
    </Layout>
  );
}