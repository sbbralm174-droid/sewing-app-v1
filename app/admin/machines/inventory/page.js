"use client";
import React, { useEffect, useState } from 'react';

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

  // Filter logic
  const filteredMachines = machines.filter(m => 
    m.brandName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.companyUniqueNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex justify-center items-center h-screen">Loading Detailed Inventory...</div>;

  return (
    <div className="p-4 md:p-8 bg-slate-100 mt-10 min-h-screen font-sans">
      <div className="max-w-full mx-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        
        {/* Header & Search */}
        <div className="p-6 bg-slate-900 text-white flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Machine Inventory</h1>
            <p className="text-slate-400 text-sm">Total {machines.length} Machines Registered</p>
          </div>
          <input 
            type="text" 
            placeholder="Search by Brand or ID..." 
            className="p-2 rounded bg-slate-800 border border-slate-700 text-white w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
              <tr>
                <th className="p-4 font-semibold">Asset Info</th>
                <th className="p-4 font-semibold">Commercials</th>
                <th className="p-4 font-semibold">Location & Supervisor</th>
                <th className="p-4 font-semibold">Maintenance Status</th>
                <th className="p-4 font-semibold">Parts & Config</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMachines.map((machine) => (
                <tr key={machine._id} className="hover:bg-blue-50/50 transition-all">
                  
                  {/* Asset Info */}
                  <td className="p-4">
                    <div className="font-bold text-slate-800 text-lg">{machine.brandName}</div>
                    
                    <div className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded inline-block mb-1">
                      GMS ID: {machine.uniqueId} 
                    </div>
                    <div className="text-sm text-slate-500">Model: {machine.model || 'N/A'}</div>
                    <div className="text-xs text-slate-400">Origin: {machine.origin}</div>
                    <div className="text-xs text-slate-400">ID: {machine.companyUniqueNumber} </div>
                  </td>

                  {/* Commercials */}
                  <td className="p-4">
                    <div className="text-sm font-semibold text-green-700">
                      Price: ${machine.price?.toLocaleString() || '0'}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Installed: {machine.installationDate ? new Date(machine.installationDate).toLocaleDateString() : 'N/A'}
                    </div>
                    <div className="text-xs font-medium text-orange-600">
                      Warranty: {machine.warrantyYears} Years
                    </div>
                  </td>

                  {/* Location & Supervisor */}
                  <td className="p-4 text-sm">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1">
                         <span className="font-medium text-slate-700">Floor:</span> {machine.lastLocation?.floor}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500 text-xs italic">
                        Line: {machine.lastLocation?.line}
                      </span>
                      <div className="mt-2 text-xs border-t pt-1 border-slate-100">
                        <span className="text-blue-600 font-medium">Supervisor:</span> {machine.lastLocation?.supervisor}
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider
                      ${machine.currentStatus === 'running' ? 'bg-green-100 text-green-700 border border-green-200' : 
                        machine.currentStatus === 'maintenance' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 
                        'bg-slate-100 text-slate-700'}`}>
                      {machine.currentStatus}
                    </span>
                    <div className="mt-2 text-[11px]">
                      <span className="text-slate-400 block underline uppercase">Next Service:</span>
                      <span className="font-semibold text-slate-600">
                        {machine.nextServiceDate ? new Date(machine.nextServiceDate).toDateString() : 'Not Scheduled'}
                      </span>
                    </div>
                  </td>

                  {/* Parts Details */}
                  <td className="p-4">
                    {machine.parts && machine.parts.length > 0 ? (
                      <div className="space-y-1">
                        {machine.parts.slice(0, 2).map((part, idx) => (
                          <div key={idx} className="text-[10px] bg-indigo-50 p-1 border border-indigo-100 rounded">
                            <span className="font-bold text-indigo-700">{part.partName}</span>
                            <br/>ID: {part.uniquePartId}
                          </div>
                        ))}
                        {machine.parts.length > 2 && (
                          <div className="text-[10px] text-indigo-400 italic">+{machine.parts.length - 2} more parts...</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300 italic">No parts listed</span>
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