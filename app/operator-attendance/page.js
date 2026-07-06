"use client";

import { useEffect, useMemo, useState } from "react";

export default function OperatorAttendancePage() {
  const today = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(today);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [statusFilter, setStatusFilter] = useState("all");
  const [floorFilter, setFloorFilter] = useState("all");
  const [lineFilter, setLineFilter] = useState("all");
  const [search, setSearch] = useState("");

  const loadData = async (selectedDate) => {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/operator-attendance?date=${selectedDate}`,
        {
          cache: "no-store",
        }
      );

      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(date);
  }, []);

  // Floor List
  const floors = useMemo(() => {
    return [
      "all",
      ...new Set(
        data
          .map((item) => item.floor)
          .filter((item) => item && item !== "-")
      ),
    ];
  }, [data]);

  // Line List
  const lines = useMemo(() => {
    let list = data;

    if (floorFilter !== "all") {
      list = list.filter((item) => item.floor === floorFilter);
    }

    return [
      "all",
      ...new Set(
        list
          .map((item) => item.line)
          .filter((item) => item && item !== "-")
      ),
    ];
  }, [data, floorFilter]);

  useEffect(() => {
    setLineFilter("all");
  }, [floorFilter]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (
        statusFilter !== "all" &&
        item.status !== statusFilter
      )
        return false;

      if (
        floorFilter !== "all" &&
        item.floor !== floorFilter
      )
        return false;

      if (
        lineFilter !== "all" &&
        item.line !== lineFilter
      )
        return false;

      if (search.trim()) {
        const keyword = search.toLowerCase();

        return (
          item.name?.toLowerCase().includes(keyword) ||
          item.operatorId?.toLowerCase().includes(keyword)
        );
      }

      return true;
    });
  }, [
    data,
    statusFilter,
    floorFilter,
    lineFilter,
    search,
  ]);

  const summary = useMemo(() => {
    return {
      total: filteredData.length,
      present: filteredData.filter(
        (item) => item.status === "Present"
      ).length,
      absent: filteredData.filter(
        (item) => item.status === "Absent"
      ).length,
      production: filteredData.reduce(
        (sum, item) => sum + Number(item.production || 0),
        0
      ),
    };
  }, [filteredData]);

  return (
    <div className="min-h-screen mt-15 bg-gray-100 text-black p-6">
      <div className="max-w-7xl mx-auto">

        <div className="bg-white rounded-xl shadow p-5 mb-5">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

            <h1 className="text-3xl font-bold">
              Operator Attendance
            </h1>

            <div className="flex flex-wrap gap-3">

              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  loadData(e.target.value);
                }}
                className="border rounded-lg px-4 py-2 bg-white text-black"
              />

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
                className="border rounded-lg px-4 py-2 bg-white text-black"
              >
                <option value="all">All Status</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
              </select>

              <select
                value={floorFilter}
                onChange={(e) =>
                  setFloorFilter(e.target.value)
                }
                className="border rounded-lg px-4 py-2 bg-white text-black"
              >
                {floors.map((floor) => (
                  <option key={floor} value={floor}>
                    {floor === "all"
                      ? "All Floors"
                      : floor}
                  </option>
                ))}
              </select>

              <select
                value={lineFilter}
                onChange={(e) =>
                  setLineFilter(e.target.value)
                }
                className="border rounded-lg px-4 py-2 bg-white text-black"
              >
                {lines.map((line) => (
                  <option key={line} value={line}>
                    {line === "all"
                      ? "All Lines"
                      : line}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Search Name / Operator ID"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                className="border rounded-lg px-4 py-2 w-64 bg-white text-black"
              />

            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">

          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-gray-500 text-sm">
              Total Operators
            </p>
            <h2 className="text-3xl font-bold">
              {summary.total}
            </h2>
          </div>

          <div className="bg-green-100 rounded-xl shadow p-5">
            <p className="text-green-700 text-sm">
              Present
            </p>
            <h2 className="text-3xl font-bold text-green-700">
              {summary.present}
            </h2>
          </div>

          <div className="bg-red-100 rounded-xl shadow p-5">
            <p className="text-red-700 text-sm">
              Absent
            </p>
            <h2 className="text-3xl font-bold text-red-700">
              {summary.absent}
            </h2>
          </div>

          <div className="bg-blue-100 rounded-xl shadow p-5">
            <p className="text-blue-700 text-sm">
              Production
            </p>
            <h2 className="text-3xl font-bold text-blue-700">
              {summary.production}
            </h2>
          </div>

        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">

          <div className="overflow-auto max-h-[75vh]">

            <table className="min-w-full text-black">

              <thead className="bg-gray-200 sticky top-0 z-20">

                <tr>

                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Operator ID</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Designation</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Process</th>
                  <th className="px-4 py-3 text-left">Production</th>
                  <th className="px-4 py-3 text-left">machine</th>
                  <th className="px-4 py-3 text-left">Floor</th>
                  <th className="px-4 py-3 text-left">Line</th>
                </tr>

              </thead>

              <tbody>
                                {loading ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="py-12 text-center text-lg font-medium"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="py-12 text-center text-lg font-medium"
                    >
                      No Data Found
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, index) => (
                    <tr
                      key={item._id}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        {index + 1}
                      </td>

                      <td className="px-4 py-3 font-medium">
                        {item.operatorId}
                      </td>

                      <td className="px-4 py-3">
                        {item.name}
                      </td>

                      <td className="px-4 py-3">
                        {item.designation}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                            item.status === "Present"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {item.process || "-"}
                      </td>

                      <td className="px-4 py-3 font-bold">
                        {item.production}
                      </td>
                      <td className="px-4 py-3 font-bold">
                        {item.machine}
                      </td>

                      <td className="px-4 py-3">
                        {item.floor}
                      </td>

                      <td className="px-4 py-3">
                        {item.line}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}