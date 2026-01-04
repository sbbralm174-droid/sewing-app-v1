"use client";
import React, { useEffect, useState, useMemo } from 'react';

export default function AdvancedInventory() {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch('/api/machines')
      .then(res => res.json())
      .then(data => {
        setMachines(data);
        setLoading(false);
      });
  }, []);

  // 📊 Summary Calculation
  const summary = useMemo(() => {
    const counts = {};
    machines.forEach(m => {
      const typeName = m.machineType?.name || 'Unknown';
      counts[typeName] = (counts[typeName] || 0) + 1;
    });
    return Object.entries(counts);
  }, [machines]);

  // 🔍 Advanced Search (GMS ID, Brand, Company ID)
  const filteredMachines = machines.filter(m => 
    m.brandName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.uniqueId?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.companyUniqueNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );
console.log(filteredMachines)
  if (loading) return <div className="flex justify-center items-center h-screen font-sans text-slate-500">Loading Inventory...</div>;

  return (
    <div className="p-4 md:p-8 mt-10 bg-slate-100 min-h-screen font-sans">
      
      {/* 🚀 Machine Type Summary Header */}
      <div className="mb-8 overflow-x-auto pb-2">
        <div className="flex gap-4 min-w-max">
          {summary.map(([type, count]) => (
            <div key={type} className="bg-white p-4 rounded-xl shadow-sm border-b-4 border-blue-600 min-w-[160px]">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{type}</p>
              <p className="text-2xl font-black text-slate-800">{count}</p>
            </div>
          ))}
          <div className="bg-slate-900 p-4 rounded-xl shadow-sm border-b-4 border-slate-700 min-w-[160px]">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Machines</p>
            <p className="text-2xl font-black text-white">{machines.length}</p>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Header & Search Bar */}
        <div className="p-6 bg-white border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Advanced Inventory</h1>
            <p className="text-slate-400 text-xs">Manage and track all factory assets</p>
          </div>
          <div className="relative w-full md:w-96">
            <input 
              type="text" 
              placeholder="Search by GMS ID (e.g. GT/LS...)" 
              className="p-3 pl-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 text-slate-500 text-[11px] uppercase tracking-widest font-bold">
              <tr>
                <th className="p-4 border-b border-slate-100 font-semibold">Asset Info</th>
                <th className="p-4 border-b border-slate-100 font-semibold">Commercials</th>
                <th className="p-4 border-b border-slate-100 font-semibold">Location Details</th>
                <th className="p-4 border-b border-slate-100 font-semibold">Status</th>
                <th className="p-4 border-b border-slate-100 font-semibold">Components</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredMachines.map((machine) => (
                <tr key={machine._id} className="hover:bg-slate-50/80 transition-colors group">
                  
                  {/* Asset Info: Brand, Type, GMS ID */}
                  <td className="p-4">
                    <div className="font-bold text-slate-800 text-base">{machine.brandName}</div>
                    <div className="flex flex-wrap gap-2 mt-1.5 items-center">
                        <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-bold uppercase border border-indigo-100">
                            {machine.machineType?.name || 'Uncategorized'}
                        </span>
                        <span className="text-[10px] font-mono font-medium text-slate-500">
                          {machine.uniqueId}
                        </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-2 font-medium">Model: {machine.model || 'N/A'}</div>
                    <div className="text-[10px] text-slate-400">Company ID: {machine.companyUniqueNumber}</div>
                  </td>

                  {/* Commercials: Price & Date */}
                  <td className="p-4">
                    <div className="text-sm font-bold text-slate-700">
                      ${machine.price?.toLocaleString() || '0'}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Installed: {machine.installationDate ? new Date(machine.installationDate).toLocaleDateString() : 'N/A'}
                    </div>
                    <div className="text-[10px] font-semibold text-orange-500 uppercase mt-0.5">
                      Warranty: {machine.warrantyYears || 0} Yrs
                    </div>
                  </td>

                  {/* Location Details: Floor & Line Names */}
                  <td className="p-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                        {/* floorName display */}
                        <span className="text-xs font-bold text-slate-700">
                          {machine.lastLocation?.floor?.floorName || 'N/A'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 pl-3.5 italic border-l border-slate-200">
                        {/* lineNumber display */}
                        Line: <span className="font-bold not-italic text-slate-600">
                          {machine.lastLocation?.line?.lineNumber || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Status & Maintenance */}
                  <td className="p-4">
                    <div className={`w-fit px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border
                      ${machine.currentStatus === 'running' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        machine.currentStatus === 'maintenance' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                        'bg-slate-100 text-slate-500 border-slate-200'}`}>
                      {machine.currentStatus}
                    </div>
                    <div className="mt-3">
                      <p className="text-[9px] text-slate-400 font-bold uppercase leading-none mb-1">Service Due</p>
                      <p className="text-[11px] font-bold text-slate-600">
                        {machine.nextServiceDate ? new Date(machine.nextServiceDate).toDateString() : 'TBD'}
                      </p>
                    </div>
                  </td>

                  {/* Parts Section */}
                  <td className="p-4">
                    {machine.parts && machine.parts.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        <div className="text-[10px] bg-slate-50 p-2 rounded-lg border border-slate-100 group-hover:bg-white transition-colors">
                          <span className="font-bold text-slate-700 block mb-0.5">{machine.parts[0].partName}</span>
                          <span className="text-[9px] text-slate-400">ID: {machine.parts[0].uniquePartId}</span>
                        </div>
                        {machine.parts.length > 1 && (
                          <div className="text-[9px] text-blue-500 font-bold ml-1 tracking-tight">
                            +{machine.parts.length - 1} OTHER COMPONENTS
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-300 italic">No configuration</span>
                    )}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}