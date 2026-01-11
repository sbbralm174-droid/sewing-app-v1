"use client";
import React, { useEffect, useState, useMemo, useRef } from 'react';

// --- Multi-select Searchable Dropdown Component ---
const MultiSelectDropdown = ({ title, options, selectedValues, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tempSelected, setTempSelected] = useState(selectedValues);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setTempSelected(selectedValues);
  }, [selectedValues]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        if (isOpen) {
          onChange(tempSelected);
          setIsOpen(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, tempSelected, onChange]);

  const toggleOption = (option) => {
    if (option === 'CLEAR_ALL') {
      setTempSelected([]);
      onChange([]); // সরাসরি আপডেট করে দিবে
      return;
    }
    const newSelected = tempSelected.includes(option) 
      ? tempSelected.filter(v => v !== option) 
      : [...tempSelected, option];
    setTempSelected(newSelected);
  };

  const filteredOptions = options.filter(opt => 
    String(opt).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative min-w-[180px] mt-2" ref={dropdownRef}>
      <button 
        type="button"
        onClick={() => {
          if (isOpen) onChange(tempSelected);
          setIsOpen(!isOpen);
        }}
        className="w-full p-3 text-sm font-medium border rounded-xl bg-white flex justify-between items-center hover:border-blue-400 focus:ring-2 focus:ring-blue-400 outline-none transition-all"
      >
        <span className="truncate text-slate-700">
          {tempSelected.length > 0 ? `${title} (${tempSelected.length})` : placeholder}
        </span>
        <span className="text-xs text-slate-400">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border rounded-xl shadow-2xl max-h-72 overflow-hidden flex flex-col">
          <input
            className="p-3 text-sm border-b bg-slate-50 outline-none focus:bg-white"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="overflow-y-auto p-2 max-h-56 custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <label key={option} className="flex items-center gap-3 p-2.5 hover:bg-blue-50 cursor-pointer text-sm text-slate-600 rounded-lg">
                  <input
                    type="checkbox"
                    checked={tempSelected.includes(option)}
                    onChange={() => toggleOption(option)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  {option}
                </label>
              ))
            ) : (
              <div className="p-4 text-sm text-slate-400 italic text-center">No results</div>
            )}
          </div>
          {tempSelected.length > 0 && (
            <button 
              onClick={() => toggleOption('CLEAR_ALL')}
              className="text-xs font-bold text-red-500 p-3 border-t hover:bg-red-50"
            >
              Clear Selections
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default function AdvancedInventory() {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [floors, setFloors] = useState([]);

  // 🔍 Filter States
  const initialFilters = {
    asset: "",
    commercial: "",
    location: "",
    status: "",
    component: "",
    selectedFloors: [],
    selectedBrands: [],
    selectedModels: [],
    selectedYears: [],
    selectedLines: [],
    selectedMachineTypes: []
  };

  const [filters, setFilters] = useState(initialFilters);

  // 1-Click Clear All Filters
  const clearAllFilters = () => setFilters(initialFilters);

  useEffect(() => {
    fetch('/api/machines')
      .then(res => res.json())
      .then(data => {
        setMachines(data);
        setLoading(false);
        const uniqueFloors = [...new Set(data.map(m => m.lastLocation?.floor?.floorName).filter(Boolean).sort())];
        setFloors(uniqueFloors);
      });
  }, []);

  // 🛠️ Filter Logic (Unchanged from original)
  const filteredMachines = useMemo(() => {
    return machines.filter(m => {
      const mYear = m.installationDate ? new Date(m.installationDate).getFullYear().toString() : 'N/A';
      const mLine = m.lastLocation?.line?.lineNumber || 'No Line';
      const mType = m.machineType?.name || 'N/A';
      
      const brandMatch = filters.selectedBrands.length === 0 || filters.selectedBrands.includes(m.brandName || 'N/A');
      const modelMatch = filters.selectedModels.length === 0 || filters.selectedModels.includes(m.model || 'N/A');
      const yearMatch = filters.selectedYears.length === 0 || filters.selectedYears.includes(mYear);
      const lineMatch = filters.selectedLines.length === 0 || filters.selectedLines.includes(mLine);
      const machineTypeMatch = filters.selectedMachineTypes.length === 0 || filters.selectedMachineTypes.includes(mType);
      const floorBtnMatch = filters.selectedFloors.length === 0 || filters.selectedFloors.includes(m.lastLocation?.floor?.floorName || '');

      const assetMatch = !filters.asset || 
        m.brandName?.toLowerCase().includes(filters.asset.toLowerCase()) || 
        m.uniqueId?.toLowerCase().includes(filters.asset.toLowerCase()) || 
        String(m.companyUniqueNumber || "").toLowerCase().includes(filters.asset.toLowerCase());

      const statusMatch = !filters.status || m.currentStatus === filters.status;
      const commercialMatch = !filters.commercial || String(m.price || "").includes(filters.commercial) || String(m.warrantyYears || "").includes(filters.commercial);
      const locationTextMatch = !filters.location || 
        m.lastLocation?.floor?.floorName?.toLowerCase().includes(filters.location.toLowerCase()) || 
        m.lastLocation?.line?.lineNumber?.toLowerCase().includes(filters.location.toLowerCase());

      const componentMatch = !filters.component || m.parts?.some(p => 
        p.partName?.toLowerCase().includes(filters.component.toLowerCase()) || 
        p.uniquePartId?.toLowerCase().includes(filters.component.toLowerCase())
      );

      return brandMatch && modelMatch && yearMatch && lineMatch && floorBtnMatch && assetMatch && 
             machineTypeMatch && statusMatch && commercialMatch && locationTextMatch && componentMatch;
    });
  }, [machines, filters]);

  // 📊 Summary Calculation (Fixed Scroll in JSX)
  const summaryData = useMemo(() => {
    const lineMap = {}, brandMap = {}, modelMap = {}, typeMap = {};
    filteredMachines.forEach(m => {
      const line = m.lastLocation?.line?.lineNumber || 'No Line';
      const brand = m.brandName || 'N/A';
      const model = (m.model || 'N/A').trim().toUpperCase();
      const type = m.machineType?.name || 'N/A';
      lineMap[line] = (lineMap[line] || 0) + 1;
      brandMap[brand] = (brandMap[brand] || 0) + 1;
      modelMap[model] = (modelMap[model] || 0) + 1;
      typeMap[type] = (typeMap[type] || 0) + 1;
    });
    return { 
        lines: Object.entries(lineMap), 
        brands: Object.entries(brandMap), 
        models: Object.entries(modelMap),
        types: Object.entries(typeMap),
        totalItems: filteredMachines.length 
    };
  }, [filteredMachines]);

  // Options (Dynamic from original)
  const brandOptions = useMemo(() => [...new Set(filteredMachines.map(m => m.brandName || 'N/A'))].sort(), [filteredMachines]);
  const modelOptions = useMemo(() => [...new Set(filteredMachines.map(m => m.model || 'N/A'))].sort(), [filteredMachines]);
  const yearOptions = useMemo(() => [...new Set(filteredMachines.map(m => m.installationDate ? new Date(m.installationDate).getFullYear().toString() : 'N/A'))].sort(), [filteredMachines]);
  const lineOptions = useMemo(() => [...new Set(filteredMachines.map(m => m.lastLocation?.line?.lineNumber || 'No Line'))].sort(), [filteredMachines]);
  const typeOptions = useMemo(() => [...new Set(filteredMachines.map(m => m.machineType?.name).filter(Boolean))].sort(), [filteredMachines]);

  const handleDropdownChange = (key, values) => {
    setFilters(prev => ({ ...prev, [key]: values }));
  };

  const handleToggleFloor = (floor) => {
    setFilters(prev => {
      const current = prev.selectedFloors;
      return { ...prev, selectedFloors: current.includes(floor) ? current.filter(v => v !== floor) : [...current, floor] };
    });
  };

  if (loading) return <div className="flex justify-center items-center h-screen font-sans text-slate-500 text-2xl font-bold animate-pulse">Loading Inventory...</div>;

  return (
    <div className="p-4 md:p-8 mt-10 bg-slate-100 min-h-screen font-sans">
      
      {/* 📊 Summary Cards (Scroll Fixed) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { title: "Type Summary", data: summaryData.types, color: "border-orange-500", badge: "bg-orange-500" },
          { title: "Line Summary", data: summaryData.lines, color: "border-blue-500", badge: "bg-blue-500" },
          { title: "Brand Inventory", data: summaryData.brands, color: "border-indigo-500", badge: "bg-indigo-500" },
          { title: "Model Dist.", data: summaryData.models, color: "border-emerald-500", badge: "bg-emerald-500" }
        ].map((item, idx) => (
          <div key={idx} className={`bg-white p-5 rounded-2xl shadow-sm border-b-4 ${item.color} h-52 flex flex-col`}>
            <div className="flex justify-between items-center mb-3">
               <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest">{item.title}</h3>
               <span className={`text-xs font-bold ${item.badge} text-white px-2 py-0.5 rounded-full`}>{item.data.length}</span>
            </div>
            <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
              {item.data.map(([label, count]) => (
                <div key={label} className="flex justify-between py-1.5 border-b border-slate-50 text-sm">
                  <span className="font-bold text-slate-600">{label}</span>
                  <span className="bg-slate-100 text-slate-700 px-2 rounded-lg font-black">{count}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="max-w-full mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header Section */}
        <div className="p-8 bg-white border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Advanced Inventory</h1>
            <p className="text-slate-500 text-base mt-1 font-medium">Showing {filteredMachines.length} machines</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            {/* 🛑 CLEAR ALL BUTTON */}
            <button 
              onClick={clearAllFilters}
              className="w-full sm:w-auto px-6 py-3 bg-red-600 text-white font-black text-sm rounded-xl hover:bg-red-700 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              CLEAR ALL FILTERS
            </button>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 w-full lg:w-auto">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-black text-slate-400 uppercase tracking-tighter">Floor Filter:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {floors.map(floor => (
                  <button 
                    key={floor} 
                    onClick={() => handleToggleFloor(floor)}
                    className={`px-4 py-2 text-sm font-bold rounded-lg border transition-all ${filters.selectedFloors.includes(floor) ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'}`}
                  >
                    {floor} {filters.selectedFloors.includes(floor) && '✓'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 text-slate-600 text-xs uppercase tracking-wider font-black">
              <tr>
                <th className="p-6 border-b border-slate-100 align-top min-w-[240px]">
                  Asset Details
                  <input 
                    value={filters.asset} onChange={(e) => setFilters(p => ({...p, asset: e.target.value}))}
                    placeholder="Search Brand/ID/Co-Se..." className="block w-full p-3 mt-4 text-sm font-normal border rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-400" 
                  />
                  <MultiSelectDropdown title="Type" options={typeOptions} selectedValues={filters.selectedMachineTypes} onChange={(v) => handleDropdownChange('selectedMachineTypes', v)} placeholder="Machine Type" />
                  <MultiSelectDropdown title="Brand" options={brandOptions} selectedValues={filters.selectedBrands} onChange={(v) => handleDropdownChange('selectedBrands', v)} placeholder="Filter Brand" />
                  <MultiSelectDropdown title="Model" options={modelOptions} selectedValues={filters.selectedModels} onChange={(v) => handleDropdownChange('selectedModels', v)} placeholder="Filter Model" />
                </th>

                <th className="p-6 border-b border-slate-100 align-top min-w-[200px]">
                  Commercials
                  <input 
                    value={filters.commercial} onChange={(e) => setFilters(p => ({...p, commercial: e.target.value}))}
                    placeholder="Price/Warranty..." className="block mt-4 w-full p-3 text-sm font-normal border rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-400 shadow-sm" 
                  />
                  <MultiSelectDropdown title="Year" options={yearOptions} selectedValues={filters.selectedYears} onChange={(v) => handleDropdownChange('selectedYears', v)} placeholder="Install Year" />
                </th>

                <th className="p-6 border-b border-slate-100 align-top min-w-[200px]">
                  Placement
                  <input 
                    value={filters.location} onChange={(e) => setFilters(p => ({...p, location: e.target.value}))}
                    placeholder="Text search..." className="block mt-4 w-full p-3 text-sm font-normal border rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-400 shadow-sm" 
                  />
                  <MultiSelectDropdown title="Line" options={lineOptions} selectedValues={filters.selectedLines} onChange={(v) => handleDropdownChange('selectedLines', v)} placeholder="Filter Line" />
                </th>

                <th className="p-6 border-b border-slate-100 align-top min-w-[180px]">
                  Status
                  <select 
                    value={filters.status} onChange={(e) => setFilters(p => ({...p, status: e.target.value}))}
                    className="block mt-4 w-full p-3 text-sm font-normal border rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
                  >
                    <option value="">All Status</option>
                    <option value="running">Running</option>
                    <option value="idle">Idle</option>
                  </select>
                </th>

                <th className="p-6 border-b border-slate-100 align-top min-w-[200px]">
                  Components
                  <input 
                    value={filters.component} onChange={(e) => setFilters(p => ({...p, component: e.target.value}))}
                    placeholder="Part Name/ID..." className="block mt-4 w-full p-3 text-sm font-normal border rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-400" 
                  />
                </th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100">
              {filteredMachines.map((machine) => (
                <tr key={machine._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-6">
                    <div className="font-black text-slate-800 text-xl leading-tight">{machine.brandName}</div>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md font-black uppercase tracking-tighter">{machine.machineType?.name}</span>
                      <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{machine.uniqueId}</span>
                    </div>
                    <div className="text-sm text-slate-500 mt-3 font-medium">Model: <span className="font-bold text-slate-700">{machine.model || 'N/A'}</span></div>
                    <div className="text-sm text-slate-500 mt-1 font-medium">Co-Se-No: <span className="font-bold text-slate-700">{machine.companyUniqueNumber || 'N/A'}</span></div>
                  </td>
                  <td className="p-6">
                    <div className="font-black text-blue-700 text-lg">${machine.price?.toLocaleString()}</div>
                    <div className="text-slate-500 text-sm mt-2 font-medium italic">Installed: {machine.installationDate ? new Date(machine.installationDate).toLocaleDateString() : 'N/A'}</div>
                    <div className="text-xs font-black text-orange-600 uppercase mt-3 bg-orange-50 w-fit px-3 py-1 rounded-full border border-orange-100 shadow-sm">Warranty: {machine.warrantyYears} Yrs</div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm"></div>
                      <span className="text-lg font-black text-slate-800">{machine.lastLocation?.floor?.floorName}</span>
                    </div>
                    <div className="text-base text-slate-500 mt-2 pl-4 border-l-4 border-blue-100 ml-1">
                      Line: <span className="font-black text-slate-700">{machine.lastLocation?.line?.lineNumber}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase border shadow-md inline-block ${machine.currentStatus === 'running' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-amber-400 text-white border-amber-300'}`}>
                      {machine.currentStatus}
                    </span>
                  </td>
                  <td className="p-6">
                    {machine.parts?.length > 0 ? (
                      <div className="text-sm bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner">
                        <span className="font-bold block text-slate-700 text-base">{machine.parts[0].partName}</span>
                        <span className="text-xs text-slate-400 font-mono mt-1 block">ID: {machine.parts[0].uniquePartId}</span>
                        {machine.parts.length > 1 && <div className="text-blue-600 text-[10px] mt-2 font-black bg-blue-50 w-fit px-2 py-0.5 rounded-md">+{machine.parts.length - 1} MORE COMPONENTS</div>}
                      </div>
                    ) : <span className="text-sm text-slate-400 italic">No components</span>}
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