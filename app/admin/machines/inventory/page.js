"use client";
import React, { useEffect, useState, useMemo } from 'react';

export default function AdvancedInventory() {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔍 Filter States
  const [filters, setFilters] = useState({
    asset: "",
    commercial: "",
    location: "",
    status: "",
    component: ""
  });

  useEffect(() => {
    fetch('/api/machines')
      .then(res => res.json())
      .then(data => {
        setMachines(data);
        setLoading(false);
      });
  }, []);

  // 🛠️ Filter Logic: Empty thakle shob dekhabe, likhle filter hobe
  const filteredMachines = useMemo(() => {
    return machines.filter(m => {
      // Asset Info Filter (String conversion added for safe search)
      const assetMatch = !filters.asset || 
        m.brandName?.toLowerCase().includes(filters.asset.toLowerCase()) || 
        m.uniqueId?.toLowerCase().includes(filters.asset.toLowerCase()) || 
        String(m.companyUniqueNumber || "").toLowerCase().includes(filters.asset.toLowerCase()); // Fixed Line

      const commercialMatch = !filters.commercial || 
        String(m.price || "").includes(filters.commercial) || 
        String(m.warrantyYears || "").includes(filters.commercial);

      const locationMatch = !filters.location || 
        m.lastLocation?.floor?.floorName?.toLowerCase().includes(filters.location.toLowerCase()) || 
        m.lastLocation?.line?.lineNumber?.toLowerCase().includes(filters.location.toLowerCase());

      const statusMatch = !filters.status || 
        m.currentStatus === filters.status;

      const componentMatch = !filters.component || 
        m.parts?.some(p => 
          p.partName?.toLowerCase().includes(filters.component.toLowerCase()) || 
          p.uniquePartId?.toLowerCase().includes(filters.component.toLowerCase())
        );

      return assetMatch && commercialMatch && locationMatch && statusMatch && componentMatch;
    });
  }, [machines, filters]);

  // 📊 Summary Cards auto-update
  const summary = useMemo(() => {
    const counts = {};
    filteredMachines.forEach(m => {
      const typeName = m.machineType?.name || 'Unknown';
      counts[typeName] = (counts[typeName] || 0) + 1;
    });
    return Object.entries(counts);
  }, [filteredMachines]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  if (loading) return <div className="flex justify-center items-center h-screen font-sans text-lg text-slate-500">Loading Inventory...</div>;

  return (
    <div className="p-4 md:p-8 mt-10 bg-slate-100 min-h-screen font-sans">
      
      {/* 📊 Summary Cards */}
      <div className="mb-8 overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex gap-4">
          {summary.map(([type, count]) => (
            <div key={type} className="bg-white p-5 rounded-xl shadow-md border-b-4 border-blue-600 min-w-[200px] flex-shrink-0">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">{type}</p>
              <p className="text-3xl font-black text-slate-800">{count}</p>
            </div>
          ))}
          <div className="bg-slate-900 p-5 rounded-xl shadow-md border-b-4 border-slate-700 min-w-[200px] flex-shrink-0">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Total Found</p>
            <p className="text-3xl font-black text-white">{filteredMachines.length}</p>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        
        <div className="p-6 bg-white border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-2xl font-extrabold text-slate-800">Advanced Inventory</h1>
            <p className="text-slate-500 text-sm md:text-base mt-1">Manage and track all factory assets</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 text-slate-600 text-sm uppercase tracking-wider font-bold hidden md:table-header-group">
              <tr>
                <th className="p-5 border-b border-slate-100">
                  Asset Info
                  <input name="asset" value={filters.asset} onChange={handleFilterChange} placeholder="Search GMS/Brand..." className="block mt-2 w-full p-2 text-xs font-normal border rounded-lg bg-white outline-none focus:ring-1 focus:ring-blue-400" />
                </th>
                <th className="p-5 border-b border-slate-100">
                  Commercials
                  <input name="commercial" value={filters.commercial} onChange={handleFilterChange} placeholder="Price/Warranty..." className="block mt-2 w-full p-2 text-xs font-normal border rounded-lg bg-white outline-none focus:ring-1 focus:ring-blue-400" />
                </th>
                <th className="p-5 border-b border-slate-100">
                  Location Details
                  <input name="location" value={filters.location} onChange={handleFilterChange} placeholder="Floor/Line..." className="block mt-2 w-full p-2 text-xs font-normal border rounded-lg bg-white outline-none focus:ring-1 focus:ring-blue-400" />
                </th>
                <th className="p-5 border-b border-slate-100">
                  Status
                  <select name="status" value={filters.status} onChange={handleFilterChange} className="block mt-2 w-full p-2 text-xs font-normal border rounded-lg bg-white outline-none">
                    <option value="">All Status</option>
                    <option value="running">running</option>
                    <option value="idle">idle</option>
                  </select>
                </th>
                <th className="p-5 border-b border-slate-100">
                  Components
                  <input name="component" value={filters.component} onChange={handleFilterChange} placeholder="Part Name/ID..." className="block mt-2 w-full p-2 text-xs font-normal border rounded-lg bg-white outline-none focus:ring-1 focus:ring-blue-400" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 flex flex-col md:table-row-group">
              {filteredMachines.map((machine) => (
                <tr key={machine._id} className="hover:bg-slate-50/80 transition-colors flex flex-col md:table-row p-4 md:p-0 mb-4 md:mb-0 bg-white md:bg-transparent rounded-lg border md:border-none shadow-sm md:shadow-none">
                  
                  {/* Asset Info (GMS ID, Brand, Model, Co. ID) */}
                  <td className="p-2 md:p-5">
                    <div className="font-black text-slate-800 text-lg md:text-xl">{machine.brandName}</div>
                    <div className="flex flex-wrap gap-2 mt-2 items-center">
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-md font-bold uppercase">
                            {machine.machineType?.name || 'Uncategorized'}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                          {machine.uniqueId}
                        </span>
                    </div>
                    <div className="text-sm text-slate-500 mt-2">Model: <span className="font-semibold text-slate-700">{machine.model || 'N/A'}</span></div>
                    <div className="text-xs text-slate-400 font-medium">Co. ID: {machine.companyUniqueNumber}</div>
                  </td>

                  {/* Commercials (Price, Install Date, Warranty) */}
                  <td className="p-2 md:p-5">
                    <div className="text-lg font-black text-blue-700 md:text-slate-700">
                      ${machine.price?.toLocaleString() || '0'}
                    </div>
                    <div className="text-sm text-slate-600 mt-1">
                      Installed: <span className="font-medium">{machine.installationDate ? new Date(machine.installationDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="text-xs font-bold text-orange-600 uppercase mt-1 bg-orange-50 w-fit px-2 py-0.5 rounded">
                      Warranty: {machine.warrantyYears || 0} Yrs
                    </div>
                  </td>

                  {/* Location Details (Floor, Line) */}
                  <td className="p-2 md:p-5">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                        <span className="text-sm md:text-base font-bold text-slate-800">
                          {machine.lastLocation?.floor?.floorName || 'N/A'}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600 pl-4 border-l-2 border-slate-200 ml-1">
                        Line: <span className="font-black text-slate-800">{machine.lastLocation?.line?.lineNumber || 'N/A'}</span>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="p-2 md:p-5">
                    <div className={`w-fit px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wide border
                      ${machine.currentStatus === 'running' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                        machine.currentStatus === 'idle' ? 'bg-amber-100 text-amber-700 border-amber-200' : 
                        'bg-slate-200 text-slate-600 border-slate-300'}`}>
                      {machine.currentStatus}
                    </div>
                  </td>

                  {/* Components (Parts) */}
                  <td className="p-2 md:p-5">
                    {machine.parts && machine.parts.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        <div className="text-sm bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <span className="font-bold text-slate-800 block">{machine.parts[0].partName}</span>
                          <span className="text-xs text-slate-500">ID: {machine.parts[0].uniquePartId}</span>
                        </div>
                        {machine.parts.length > 1 && (
                          <div className="text-xs text-blue-600 font-black ml-1">
                            + {machine.parts.length - 1} MORE COMPONENTS
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400 italic font-medium">No configuration available</span>
                    )}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
          {filteredMachines.length === 0 && (
            <div className="p-12 text-center text-slate-400 font-medium italic">No matching assets found.</div>
          )}
        </div>
      </div>
    </div>
  );
}