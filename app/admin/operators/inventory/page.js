"use client";
import React, { useEffect, useState } from 'react';

export default function InventoryReport() {
    const [report, setReport] = useState({ summary: {}, data: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/operators/inventory')
            .then(res => res.json())
            .then(data => {
                setReport(data);
                setLoading(false);
            });
    }, []);
    console.log(report)

    if (loading) return <div className="p-10 text-center">Loading Report...</div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Operator Inventory Report</h1>

            {/* Summary Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
    <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
        <p className="text-sm text-gray-500 uppercase font-semibold">Total Operators</p>
        <p className="text-3xl font-bold">{report.summary?.total || 0}</p>
    </div>
    <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
        <p className="text-sm text-gray-500 uppercase font-semibold">Present Today</p>
        <p className="text-3xl font-bold text-green-600">{report.summary?.present || 0}</p>
    </div>
    <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500">
        <p className="text-sm text-gray-500 uppercase font-semibold">Absent</p>
        <p className="text-3xl font-bold text-red-600">{report.summary?.absent || 0}</p>
    </div>
</div>

            {/* Table Section */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr className="bg-gray-100 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            <th className="px-5 py-3">Operator Name</th>
                            <th className="px-5 py-3">Location</th>
                            <th className="px-5 py-3">Running Process</th>
                            <th className="px-5 py-3">All Processes</th>
                            <th className="px-5 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {report.data.map((item) => (
                            <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                <td className="px-5 py-4 text-sm">
                                    <p className="text-gray-900 font-medium">{item.name}</p>
                                    <p className="text-gray-500 text-xs">{item.operatorId} | {item.designation}</p>
                                    <p className="text-gray-500 text-xs">Joining Date: {item.joiningDate  ? new Date(item.joiningDate).toLocaleDateString("en-GB") : ""} </p>
                                </td>
                                <td className="px-5 py-4 text-sm text-gray-600">
                                    <p className="text-gray-900 font-medium">{item.floorName}</p>
                                    <p className="text-gray-500 text-xs">{item.line}</p>
                                </td>
                                <td className="px-5 py-4 text-sm">
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                                        {item.runningProcess}
                                    </span>
                                </td>
                                <td className="px-5 py-4 text-sm text-gray-600 italic">
                                    {item.allProcesses}
                                </td>
                                <td className="px-5 py-4 text-sm">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        item.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                        {item.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}