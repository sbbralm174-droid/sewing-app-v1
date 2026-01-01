"use client";
import React, { useEffect, useState } from "react";

export default function MachineReport() {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // API theke data fetch kora
    const fetchMachines = async () => {
      try {
        const response = await fetch("/api/machines/last-location");
        const data = await response.json();
        setMachines(data);
      } catch (error) {
        console.error("Error fetching machine data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMachines();
  }, []);

  // Running/Idle status determine korar logic
  const getStatus = (machine) => {
    if (!machine.lastLocation || !machine.lastLocation.date) return "Idle";
    
    const lastDate = new Date(machine.lastLocation.date).toDateString();
    const today = new Date().toDateString();
    
    return lastDate === today ? "Running" : "Idle";
  };

  // Summary Calculation
  const totalMachines = machines.length;
  const runningMachines = machines.filter(m => getStatus(m) === "Running").length;
  const idleMachines = totalMachines - runningMachines;

  if (loading) return <div className="p-10 text-center text-xl font-bold">Loading Report...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 underline">Machine Last Location Report</h1>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
          <p className="text-sm text-gray-500 uppercase font-semibold">Total Machines</p>
          <p className="text-3xl font-bold text-gray-800">{totalMachines}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
          <p className="text-sm text-gray-500 uppercase font-semibold">Running Today</p>
          <p className="text-3xl font-bold text-green-600">{runningMachines}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-orange-500">
          <p className="text-sm text-gray-500 uppercase font-semibold">Idle Machines</p>
          <p className="text-3xl font-bold text-orange-600">{idleMachines}</p>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-200">
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Machine (ID)</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Floor</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Line</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Supervisor</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Usage Date</th>
            </tr>
          </thead>
          <tbody>
            {machines.map((machine) => {
              const status = getStatus(machine);
              const lastLoc = machine.lastLocation || {};
              
              return (
                <tr key={machine._id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 text-sm font-medium text-gray-900">{machine.uniqueId}</td>
                  <td className="px-5 py-4 text-sm text-gray-700">{lastLoc.floor || "N/A"}</td>
                  <td className="px-5 py-4 text-sm text-gray-700">{lastLoc.line || "N/A"}</td>
                  <td className="px-5 py-4 text-sm text-gray-700">{lastLoc.supervisor || "N/A"}</td>
                  <td className="px-5 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      status === "Running" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                    }`}>
                      {status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    {lastLoc.date ? new Date(lastLoc.date).toLocaleDateString() : "No Date"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {machines.length === 0 && (
          <div className="p-5 text-center text-gray-500">No machine data found.</div>
        )}
      </div>
    </div>
  );
}