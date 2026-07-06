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
  
  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
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

  // Open Edit Modal
  const openEditModal = (candidate) => {
    setEditingCandidate({ ...candidate });
    setIsEditModalOpen(true);
  };

  // Handle Update
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/iep-interview/candidate/delete-candidate-from-down-admin/${editingCandidate._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCandidate),
      });

      if (res.ok) {
        alert("Updated successfully!");
        setIsEditModalOpen(false);
        loadData(); // Refresh list
      } else {
        alert("Update failed");
      }
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const getTrueKeys = (obj) => {
    if (!obj) return "";
    return Object.keys(obj).filter(k => obj[k] === true).map(k => k.replace(/_/g, " ")).join(", ");
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text(`Candidate Report - ${selectedDate} (Floor: ${selectedFloor})`, 14, 15);
    const tableColumn = ["ID", "Name", "District", "Experience", "Floor", "Result"];
    const tableRows = candidates.map(c => [
      c.candidateId, c.name, c.homeDistrict, getTrueKeys(c.experienceMachines), c.floor,
      c.result === "PASSED" ? "PASSED" : `FAILED (${c.failureReason})`
    ]);
    autoTable(doc, {
      head: [tableColumn], body: tableRows, startY: 20, styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });
    doc.save(`Report_${selectedDate}.pdf`);
  };

  return (
    <div className="p-4 bg-gray-50 mt-20 text-black min-h-screen font-sans">
      <div className="max-w-7xl mx-auto bg-white shadow-sm border rounded-lg">
        
        {/* Header/Filter Bar */}
        <div className="p-5 border-b flex flex-wrap justify-between items-center bg-white gap-4">
          <div>
            <Link href="/admin/iep-interview/2nd-step" className="text-blue-600 font-medium hover:underline text-sm block mb-1">
              ← Go to Assessment
            </Link>
            <h1 className="text-xl font-bold text-slate-800">Candidate Report</h1>
            <p className="text-sm text-gray-500">Records for: {selectedDate}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input type="date" className="border p-2 rounded-md text-sm outline-none" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            <select className="border p-2 rounded-md text-sm outline-none" value={selectedFloor} onChange={(e) => setSelectedFloor(e.target.value)}>
              <option value="ALL">All Floors</option>
              <option value="SHAPLA">SHAPLA</option><option value="PODDO">PODDO</option><option value="KODOM">KODOM</option><option value="BELLY">BELLY</option>
            </select>
            <button onClick={downloadPDF} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">Download PDF</button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 text-center text-blue-600 font-medium italic">Searching Database...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-600 border-b">
                <tr className="text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">ID</th>
                  <th className="p-4 font-semibold">Name</th>
                  <th className="p-4 font-semibold">District</th>
                  <th className="p-4 font-semibold">Floor</th>
                  <th className="p-4 font-semibold">Remarks</th>
                  <th className="p-4 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {candidates.length > 0 ? candidates.map((c) => (
                  <tr key={c._id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="p-4 font-bold text-blue-700">{c.candidateId}</td>
                    <td className="p-4 text-slate-700 font-medium">{c.name}</td>
                    <td className="p-4">{c.homeDistrict}</td>
                    <td className="p-4 font-semibold text-slate-600">{c.floor}</td>
                    <td className="p-4">
                      {c.result === 'FAILED' ? <span className="text-red-500 bg-red-50 px-2 py-1 rounded text-xs">{c.failureReason}</span> : <span className="text-emerald-600 font-bold">PASSED</span>}
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => openEditModal(c)} className="text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-3 py-1 rounded">Edit</button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="6" className="p-10 text-center text-gray-400">No data found.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* --- Edit Modal --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Edit Candidate: {editingCandidate?.candidateId}</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase">Full Name</label>
                <input type="text" className="w-full border p-2 rounded mt-1" value={editingCandidate.name} onChange={(e) => setEditingCandidate({...editingCandidate, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase">Floor</label>
                  <select className="w-full border p-2 rounded mt-1" value={editingCandidate.floor} onChange={(e) => setEditingCandidate({...editingCandidate, floor: e.target.value})}>
                    <option value="SHAPLA">SHAPLA</option><option value="PODDO">PODDO</option><option value="KODOM">KODOM</option><option value="BELLY">BELLY</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase">Result</label>
                  <select className="w-full border p-2 rounded mt-1" value={editingCandidate.result} onChange={(e) => setEditingCandidate({...editingCandidate, result: e.target.value})}>
                    <option value="PASSED">PASSED</option><option value="FAILED">FAILED</option>
                  </select>
                </div>
              </div>
              {editingCandidate.result === 'FAILED' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase">Failure Reason</label>
                  <input type="text" className="w-full border p-2 rounded mt-1" value={editingCandidate.failureReason || ''} onChange={(e) => setEditingCandidate({...editingCandidate, failureReason: e.target.value})} />
                </div>
              )}
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportPage;