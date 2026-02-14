"use client";
import React, { useEffect, useState } from 'react';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Link from 'next/link';


const ReportPage = () => {
  const [candidates, setCandidates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedFloor, setSelectedFloor] = useState('ALL');
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      // API call with both date and floor
      const res = await fetch(`/api/iep-interview/candidate/report?date=${selectedDate}&floor=${selectedFloor}`);
      const data = await res.json();
      setCandidates(data);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate, selectedFloor]);

  const getTrueKeys = (obj) => {
    if (!obj) return "";
    return Object.keys(obj).filter(k => obj[k] === true).map(k => k.replace(/_/g, " ")).join(", ");
  };

  // PDF Download Function
  const downloadPDF = () => {
  const doc = new jsPDF();

  doc.text(
    `Candidate Report - ${selectedDate} (Floor: ${selectedFloor})`,
    14,
    15
  );

  const tableColumn = ["ID", "Name", "District", "Experience", "Floor", "Result"];
  const tableRows = [];

  candidates.forEach(c => {
    tableRows.push([
      c.candidateId,
      c.name,
      c.homeDistrict,
      getTrueKeys(c.experienceMachines),
      c.floor,
      c.result === "PASSED"
        ? "PASSED"
        : `FAILED (${c.failureReason})`
    ]);
  });

  // 🔴 এখানে doc.autoTable না লিখে
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 20,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] }
  });

  doc.save(`Report_${selectedDate}_${selectedFloor}.pdf`);
};


  return (
    <div className="p-4 bg-gray-50 mt-20 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto bg-white shadow-sm border rounded-lg">
        
        {/* Filter Bar */}
        <div className="p-5 border-b flex flex-wrap justify-between items-center bg-white gap-4">
          <h1 className="text-xs text-gray-600 text-center">
                
                <Link href="/admin/iep-interview/2nd-step" className="text-blue-600 font-medium hover:underline text-sm">
                  Go to Assessment
                </Link>
              </h1>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Candidate Report</h1>
            <p className="text-sm text-gray-500">Records for: {selectedDate} | Floor: {selectedFloor}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Date Filter */}
            <input 
              type="date" 
              className="border p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />

            {/* Floor Filter */}
            <select 
              className="border p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
            >
              <option value="ALL">All Floors</option>
              <option value="SHAPLA">SHAPLA</option>
              <option value="PODDO">PODDO</option>
              <option value="KODOM">KODOM</option>
              <option value="BELLY">BELLY</option>
            </select>

            {/* Print PDF Button */}
            <button 
              onClick={downloadPDF}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Download PDF
            </button>
          </div>
        </div>

        {/* Table Area */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 text-center text-blue-600 font-medium italic">Searching Database...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-600 border-b">
                <tr className="text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">Candidate ID</th>
                  <th className="p-4 font-semibold">Name</th>
                  <th className="p-4 font-semibold">NID / Birth Cert</th>
                  <th className="p-4 font-semibold">District</th>
                  <th className="p-4 font-semibold">Experience</th>
                  <th className="p-4 font-semibold">Floor</th>
                  <th className="p-4 font-semibold">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {candidates.length > 0 ? candidates.map((c) => (
                  <tr key={c._id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="p-4 font-bold text-blue-700">{c.candidateId}</td>
                    <td className="p-4 text-slate-700 font-medium">{c.name}</td>
                    <td className="p-4 text-slate-600">
                      {[c.nid, c.birthCertificate].filter(Boolean).join(", ")}
                    </td>
                    <td className="p-4">{c.homeDistrict}</td>
                    <td className="p-4">{getTrueKeys(c.experienceMachines)}</td>
                    <td className="p-4 font-semibold text-slate-600">{c.floor}</td>
                    <td className="p-4">
                      {c.result === 'FAILED' ? (
                        <span className="text-red-500 bg-red-50 px-2 py-1 rounded text-xs">{c.failureReason}</span>
                      ) : (
                        <span className="text-emerald-600 font-bold">PASSED</span>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="p-10 text-center text-gray-400">No data found for these filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportPage;