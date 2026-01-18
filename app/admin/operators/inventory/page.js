"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { Search, MapPin, Users, CheckCircle, XCircle, ChevronDown } from 'lucide-react';

export default function InventoryReport() {
    const [report, setReport] = useState({ summary: {}, data: [] });
    const [loading, setLoading] = useState(true);
    
    const [filters, setFilters] = useState({
        global: '',
        floor: '',
        line: '',
        status: ''
    });

    useEffect(() => {
        fetch('/api/operators/inventory')
            .then(res => res.json())
            .then(data => {
                setReport(data || { summary: {}, data: [] });
                setLoading(false);
            });
    }, []);

    // Smart Filter Logic
    const filteredData = useMemo(() => {
        return (report.data || []).filter(item => {
            const matchesGlobal = (item.name?.toLowerCase().includes(filters.global.toLowerCase()) || 
                                 item.operatorId?.includes(filters.global));
            const matchesFloor = filters.floor === '' || item.floorName === filters.floor;
            const matchesLine = filters.line === '' || item.line === filters.line;
            const matchesStatus = filters.status === '' || item.status === filters.status;

            return matchesGlobal && matchesFloor && matchesLine && matchesStatus;
        });
    }, [filters, report.data]);

    const uniqueFloors = [...new Set((report.data || []).map(item => item.floorName))].filter(Boolean);
    const uniqueLines = [...new Set((report.data || []).map(item => item.line))].filter(Boolean);

    if (loading) return <div className="p-10 text-center font-medium text-slate-500 animate-pulse">Loading Inventory...</div>;

    return (
        <div className="p-6 bg-[#F1F5F9] min-h-screen">
            {/* 1. TOP SUMMARY SECTION */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-slate-800">Operator Inventory</h1>
                <div className="flex gap-4">
                    <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-sm font-bold text-slate-700">Total: {filteredData.length}</span>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-sm font-bold text-emerald-600">Present: {filteredData.filter(d => d.status === 'Present').length}</span>
                    </div>
                </div>
            </div>

            {/* 2. SMART SEARCH & DROPDOWNS */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Name/ID Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search Name or ID..." 
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg outline-none text-sm transition-all"
                            onChange={(e) => setFilters({...filters, global: e.target.value})}
                        />
                    </div>
                    
                    {/* Floor Dropdown Search */}
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select 
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-lg outline-none text-sm appearance-none cursor-pointer"
                            onChange={(e) => setFilters({...filters, floor: e.target.value})}
                        >
                            <option value="">Search Floor</option>
                            {uniqueFloors.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>

                    {/* Line Dropdown Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select 
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-lg outline-none text-sm appearance-none cursor-pointer"
                            onChange={(e) => setFilters({...filters, line: e.target.value})}
                        >
                            <option value="">Search Line</option>
                            {uniqueLines.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>

                    {/* Status Filter */}
                    <select 
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-lg outline-none text-sm cursor-pointer"
                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                    >
                        <option value="">All Status</option>
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                    </select>
                </div>
            </div>

            {/* 3. TABLE SECTION */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Operator Name</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Location (Floor/Line)</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Running Process</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">All Processes</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredData.length > 0 ? filteredData.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-slate-800 text-sm">{item.name}</div>
                                        <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">{item.operatorId} | {item.designation}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="inline-flex flex-col bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                                            <span className="text-xs font-bold text-slate-700">{item.floorName}</span>
                                            <span className="text-[10px] text-blue-600 font-extrabold uppercase">{item.line}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                                            {item.runningProcess}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-500 italic max-w-xs truncate">
                                        {item.allProcesses}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                            item.status === 'Present' 
                                            ? 'bg-emerald-100 text-emerald-700' 
                                            : 'bg-rose-100 text-rose-700'
                                        }`}>
                                            {item.status}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400">No results found...</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}