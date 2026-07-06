"use client";

import { useEffect, useMemo, useState } from "react";

export default function OperatorAttendancePage() {
  const today = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(today);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

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
      setData(json);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(date);
  }, []);

  const filteredData = useMemo(() => {
    if (statusFilter === "all") return data;

    return data.filter((item) => item.status === statusFilter);
  }, [data, statusFilter]);

  const totalOperator = data.length;
  const totalPresent = data.filter(
    (item) => item.status === "Present"
  ).length;
  const totalAbsent = data.filter(
    (item) => item.status === "Absent"
  ).length;

  return (
    <div className="min-h-screen bg-gray-100 mt-15 text-black p-6">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-5 mb-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <h1 className="text-3xl font-bold text-black">
              Operator Attendance
            </h1>

            <div className="flex flex-wrap items-center gap-3">

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 bg-white text-black rounded-lg px-4 py-2 outline-none"
              >
                <option value="all">All</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
              </select>

              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  loadData(e.target.value);
                }}
                className="border border-gray-300 bg-white text-black rounded-lg px-4 py-2 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">

          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-gray-500 text-sm">Total Operators</p>
            <h2 className="text-3xl font-bold text-black">
              {totalOperator}
            </h2>
          </div>

          <div className="bg-green-100 rounded-xl shadow p-5">
            <p className="text-green-700 text-sm">Present</p>
            <h2 className="text-3xl font-bold text-green-700">
              {totalPresent}
            </h2>
          </div>

          <div className="bg-red-100 rounded-xl shadow p-5">
            <p className="text-red-700 text-sm">Absent</p>
            <h2 className="text-3xl font-bold text-red-700">
              {totalAbsent}
            </h2>
          </div>

        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">

          <div className="overflow-x-auto">

            <table className="min-w-full text-black">

              <thead className="bg-gray-200">

                <tr>

                  <th className="px-4 py-3 text-left font-semibold">
                    #
                  </th>

                  <th className="px-4 py-3 text-left font-semibold">
                    Operator ID
                  </th>

                  <th className="px-4 py-3 text-left font-semibold">
                    Name
                  </th>

                  <th className="px-4 py-3 text-left font-semibold">
                    Designation
                  </th>

                  <th className="px-4 py-3 text-left font-semibold">
                    Status
                  </th>

                  <th className="px-4 py-3 text-left font-semibold">
                    Process
                  </th>

                  <th className="px-4 py-3 text-left font-semibold">
                    Production
                  </th>

                  <th className="px-4 py-3 text-left font-semibold">
                    Floor
                  </th>

                  <th className="px-4 py-3 text-left font-semibold">
                    Line
                  </th>

                </tr>

              </thead>

              <tbody>

                {loading && (
                  <tr>
                    <td
                      colSpan={9}
                      className="text-center py-10 text-lg"
                    >
                      Loading...
                    </td>
                  </tr>
                )}

                {!loading && filteredData.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="text-center py-10 text-lg"
                    >
                      No Data Found
                    </td>
                  </tr>
                )}

                {!loading &&
                  filteredData.map((item, index) => (
                    <tr
                      key={item._id}
                      className="border-b hover:bg-gray-50 transition"
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
                          className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
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

                      <td className="px-4 py-3">
                        {item.floor}
                      </td>

                      <td className="px-4 py-3">
                        {item.line}
                      </td>
                    </tr>
                  ))}

              </tbody>

            </table>

          </div>

        </div>

      </div>
    </div>
  );
}