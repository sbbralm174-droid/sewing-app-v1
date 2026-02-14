"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { Search, MapPin, Users, CheckCircle, XCircle, ChevronDown, Activity, Cog, List } from 'lucide-react';

export default function InventoryReport() {
    const [report, setReport] = useState({ summary: {}, data: [] });
    const [loading, setLoading] = useState(true);
    
    const [filters, setFilters] = useState({
        global: '',
        floor: '',
        line: '',
        status: '',
        runningProcess: '', // নতুন filter field
        allProcesses: ''    // নতুন filter field
    });

    useEffect(() => {
        fetch('/api/operators/inventory')
            .then(res => res.json())
            .then(data => {
                setReport(data || { summary: {}, data: [] });
                setLoading(false);
            });
    }, []);

    // ১. মেইন ফিল্টার লজিক (আপডেট করা হয়েছে)
    const filteredData = useMemo(() => {
        return (report.data || []).filter(item => {
            const matchesGlobal = (item.name?.toLowerCase().includes(filters.global.toLowerCase()) || 
                                 item.operatorId?.includes(filters.global));
            const matchesFloor = filters.floor === '' || item.floorName === filters.floor;
            const matchesLine = filters.line === '' || item.line === filters.line;
            const matchesStatus = filters.status === '' || item.status === filters.status;
            
            // নতুন ফিল্টার লজিক
            const matchesRunningProcess = filters.runningProcess === '' || 
                item.runningProcess?.toLowerCase().includes(filters.runningProcess.toLowerCase());
            const matchesAllProcesses = filters.allProcesses === '' || 
                item.allProcesses?.toLowerCase().includes(filters.allProcesses.toLowerCase());

            return matchesGlobal && matchesFloor && matchesLine && matchesStatus && 
                   matchesRunningProcess && matchesAllProcesses;
        });
    }, [filters, report.data]);

    // ২. ডায়নামিক ক্যালকুলেশন
    const stats = useMemo(() => {
        const total = filteredData.length;
        const present = filteredData.filter(d => d.status === 'Present').length;
        const absent = total - present;
        return { total, present, absent };
    }, [filteredData]);

    // ইউনিক ভ্যালুগুলো সংগ্রহ (প্রক্রিয়া ফিল্টারের জন্য)
    const uniqueFloors = [...new Set((report.data || []).map(item => item.floorName))].filter(Boolean).sort();
    const uniqueLines = [...new Set((report.data || []).map(item => item.line))].filter(Boolean).sort();
    const uniqueRunningProcesses = [...new Set((report.data || []).map(item => item.runningProcess))].filter(Boolean).sort();
    const uniqueAllProcessesKeywords = useMemo(() => {
        // All Processes থেকে কমা দিয়ে আলাদা করা শব্দগুলো সংগ্রহ
        const allKeywords = new Set();
        (report.data || []).forEach(item => {
            if (item.allProcesses) {
                item.allProcesses.split(',').forEach(keyword => {
                    const trimmed = keyword.trim();
                    if (trimmed) allKeywords.add(trimmed);
                });
            }
        });
        return Array.from(allKeywords).sort();
    }, [report.data]);

    if (loading) return <div className="p-10 text-center font-medium text-slate-500 animate-pulse">Loading Inventory...</div>;

    return (
        <div className="p-6 mt-20 bg-[#F1F5F9] min-h-screen">
            
            {/* ৩. সামারি সেকশন */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Users size={20} /></div>
                        <span className="text-sm font-bold text-slate-600">Total Filtered</span>
                    </div>
                    <span className="text-2xl font-black text-slate-800">{stats.total}</span>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><CheckCircle size={20} /></div>
                        <span className="text-sm font-bold text-slate-600">Present</span>
                    </div>
                    <span className="text-2xl font-black text-emerald-600">{stats.present}</span>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-100 text-rose-600 rounded-lg"><XCircle size={20} /></div>
                        <span className="text-sm font-bold text-slate-600">Absent</span>
                    </div>
                    <span className="text-2xl font-black text-rose-600">{stats.absent}</span>
                </div>
            </div>

            {/* ৪. সার্চ ও ফিল্টার বক্স (আপডেট করা হয়েছে) */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    {/* সার্চ */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search Name or ID..." 
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm"
                            onChange={(e) => setFilters({...filters, global: e.target.value})}
                        />
                    </div>
                    
                    {/* Floor Filter */}
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select 
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm appearance-none cursor-pointer"
                            onChange={(e) => setFilters({...filters, floor: e.target.value})}
                            value={filters.floor}
                        >
                            <option value="">All Floors</option>
                            {uniqueFloors.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>

                    {/* Line Filter */}
                    <div className="relative">
                        <Activity className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select 
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm appearance-none cursor-pointer"
                            onChange={(e) => setFilters({...filters, line: e.target.value})}
                            value={filters.line}
                        >
                            <option value="">All Lines</option>
                            {uniqueLines.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>

                    {/* Running Process Filter */}
                    <div className="relative">
                        <Cog className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select 
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm appearance-none cursor-pointer"
                            onChange={(e) => setFilters({...filters, runningProcess: e.target.value})}
                            value={filters.runningProcess}
                        >
                            <option value="">All Processes</option>
                            <option value="">All Running Processes</option>
                            {uniqueRunningProcesses.map(process => (
                                <option key={process} value={process}>{process}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>

                    {/* All Processes Filter */}
                    <div className="relative">
                        <List className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select 
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm appearance-none cursor-pointer"
                            onChange={(e) => setFilters({...filters, allProcesses: e.target.value})}
                            value={filters.allProcesses}
                        >
                            <option value="">All Skills</option>
                            {uniqueAllProcessesKeywords.map(keyword => (
                                <option key={keyword} value={keyword}>{keyword}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>

                    {/* Status Filter */}
                    <select 
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm cursor-pointer"
                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                        value={filters.status}
                    >
                        <option value="">All Status</option>
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                    </select>
                </div>
            </div>

            {/* ৫. টেবিল সেকশন */}
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
                                        <div className="text-[11px] text-slate-500 font-medium uppercase">{item.operatorId} | {item.designation}</div>
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
                                    <td className="px-6 py-4 text-xs text-slate-500 max-w-xs">
                                        <div className="flex flex-wrap gap-1">
                                            {item.allProcesses?.split(',').map((process, index) => (
                                                <span 
                                                    key={index}
                                                    className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs border border-slate-200"
                                                >
                                                    {process.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase ${
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
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                                        No results found...
                                        <button 
                                            className="ml-2 text-blue-600 hover:text-blue-800 font-medium"
                                            onClick={() => setFilters({
                                                global: '',
                                                floor: '',
                                                line: '',
                                                status: '',
                                                runningProcess: '',
                                                allProcesses: ''
                                            })}
                                        >
                                            Clear filters
                                        </button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}