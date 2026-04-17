'use client'

import { useEffect, useState } from 'react'

export default function LineSummaryReport() {
  const [date, setDate] = useState('2025-12-25')
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchReport = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/line-summery-report?date=${date}`)
      const data = await res.json()
      setReport(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [])
  const totalQcPassPerDay = 200;
  const todayBallanceTarget = 150;
  const activeWipInLine = 2200;

  return (
    <div className="p-4  mt-20 min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        

        <div className="flex gap-2 items-center">
          <span className="text-sm font-medium">Date:</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border px-2 py-1 text-sm"
          />
          <button
            onClick={fetchReport}
            className="bg-blue-600 text-white px-3 py-1 text-sm rounded"
          >
            Load
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto bg-white border">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            {/* ===== HEADER ROW 1 ===== */}
            <tr className="bg-gray-100 text-center font-semibold">
              <th rowSpan={2} className="border px-2 py-1">LINE</th>
              <th rowSpan={2} className="border px-2 py-1">BUYER</th>
              <th rowSpan={2} className="border px-2 py-1">STYLE</th>
              <th rowSpan={2} className="border px-2 py-1">job</th>
              <th rowSpan={2} className="border px-2 py-1">SMV</th>

              
              <th colSpan={3} className="border px-2 py-1">LAYOUT OP & HP</th>
              <th colSpan={5} className="border px-2 py-1">USE MP</th>
              <th colSpan={3} className="border px-2 py-1">ACTUAL USE OP & HP</th>

              <th rowSpan={2} className="border px-2 py-1">HO<br />URLY<br />TAR<br />GET</th>
              <th rowSpan={2} className="border px-2 py-1">WH</th>
              <th rowSpan={2} className="border px-2 py-1">BAL<br />ANCE <br/> TARGET<br />/DAY</th>
              <th rowSpan={2} className="border px-2 py-1">TOTAL<br />QC PASS <br/> PER/<br />DAY(API)</th>
              <th rowSpan={2} className="border px-2 py-1">DAVI<br />ATION</th>
              <th rowSpan={2} className="border px-2 py-1">DAVI<br />ATION %</th>
              <th rowSpan={2} className="border px-2 py-1">AVAIL<br />ABLE MIN (PER HR)</th>
              <th rowSpan={2} className="border px-2 py-1">EARN MIN(Per Hr)</th>
              <th rowSpan={2} className="border px-2 py-1">EFF%</th>
              <th rowSpan={2} className="border px-2 py-1">PER<br />FORM<br />ANCE %</th>
              <th rowSpan={2} className="border px-2 py-1">NPT</th>
              <th rowSpan={2} className="border px-2 py-1">LOSS PCS</th>
              <th rowSpan={2} className="border px-2 py-1">REMARKS</th>
              <th colSpan={6} className="border px-2 py-1">
                APROXIMATE FORCASTING FOR TODAY
              </th>
            </tr>

            {/* ===== HEADER ROW 2 ===== */}
            <tr className="bg-gray-100 text-center font-semibold">
              {/* PRESENT MP */}
              

              {/* LAYOUT */}
              <th className="border px-2 py-1">OP</th>
              <th className="border px-2 py-1">HP</th>
              <th className="border px-2 py-1">TOTAL</th>

              {/* USE MP */}
              <th className="border px-2 py-1">OP</th>
              <th className="border px-2 py-1">HP</th>
              <th className="border px-2 py-1">OP<br/>AS HP</th>
              <th className="border px-2 py-1">TOTAL<br/>OP HP</th>
              <th className="border px-2 py-1">G.TO<br />TAL</th>

              {/* ACTUAL */}
              <th className="border px-2 py-1">OP</th>
              <th className="border px-2 py-1">HP</th>
              <th className="border px-2 py-1">TOTAL</th>

              {/* ACTUAL */}
              <th className="border px-2 py-1">TODAY <br/>(BALANCE <br/>TARGET_HOUR)</th>
              <th className="border px-2 py-1">LINE BALANCING TARGET/DAY</th>
              <th className="border px-2 py-1">BALANCE EFF%_ HOURS</th>
              <th className="border px-2 py-1">TOTAL INPUT DEMAND</th>
              <th className="border px-2 py-1">ACTIVE WIP IN LINE</th>
              <th className="border px-2 py-1">ACTUALL INPUT DEMAND FOR TODAY</th>
            </tr>
          </thead>

          {/* ===== BODY ===== */}
          <tbody>
            {loading && (
              <tr>
                <td colSpan="26" className="text-center py-6">
                  Loading...
                </td>
              </tr>
            )}

            {!loading && report?.data?.map((row, index) => {
              const presentTotal = row.operator + row.helper
              const useTotal = row.operator + row.helper + row.helperWorkAsOp
              return (
                <tr key={index} className="hover:bg-gray-50 text-center">
                  <td className="border px-2 py-1">{row.line}</td>
                  <td className="border px-2 py-1">{row.buyer}</td>
                  <td className="border px-2 py-1">{row.style}</td>
                  <td className="border px-2 py-1">{row.jobNo}</td>
                  <td className="border px-2 py-1">{row.totalSmv}</td>

                  {/* PRESENT MP */}
                  

                  {/* LAYOUT */}
                  <td className="border px-2 py-1">{row.breakdownOperator}</td>
                  <td className="border px-2 py-1">{row.breakdownHP}</td>
                  <td className="border px-2 py-1">
                    {row.breakdownOperator + row.breakdownHP}
                  </td>

                  {/* USE MP */}
                  <td className="border px-2 py-1">{row.operator}</td>
                  <td className="border px-2 py-1">{row.helper}</td>
                  <td className="border px-2 py-1">{row.opWorkAsHelper}</td>
                  <td className="border px-2 py-1">{row.operator + row.helper + row.opWorkAsHelper}</td>
                  <td className="border px-2 py-1">{row.operator + row.helper + row.opWorkAsHelper}</td>

                  {/* ACTUAL */}
                  <td className="border px-2 py-1">{row.operator}</td>
                  <td className="border px-2 py-1">{row.helper}</td>
                  <td className="border px-2 py-1">{presentTotal}</td>

                  <td className="border px-2 py-1">{row.hourlyTarget}</td>
                  <td className="border px-2 py-1">{row.avgWorkingHour}</td>
                  <td className="border px-2 py-1">{row.hourlyTarget * row.avgWorkingHour}</td>
                  <td className="border px-2 py-1">{totalQcPassPerDay}</td>
                  <td className="border px-2 py-1">{totalQcPassPerDay - (row.hourlyTarget * row.avgWorkingHour)}</td>
                  <td className="border px-2 py-1">{((totalQcPassPerDay - (row.hourlyTarget * row.avgWorkingHour)) / (row.hourlyTarget * row.avgWorkingHour)).toFixed(2)}</td>
                  <td className="border px-2 py-1">{ ((row.operator + row.helper + row.opWorkAsHelper) * row.avgWorkingHour * 60).toFixed(2)}</td>
                  <td className="border px-2 py-1">{totalQcPassPerDay * row.breakdownSMV  }</td>
                  <td className="border px-2 py-1">{((totalQcPassPerDay * row.breakdownSMV) /  (((row.operator + row.helper + row.opWorkAsHelper) * row.avgWorkingHour * 60))).toFixed(2) }fg</td>
                  <td className="border px-2 py-1">{(totalQcPassPerDay /  (row.hourlyTarget * row.avgWorkingHour)).toFixed(2) }</td>
                  <td className="border px-2 py-1">{row.npt }</td>
                  <td className="border px-2 py-1">{(row.npt / row.breakdownSMV).toFixed(2) }</td>
                  <td className="border px-2 py-1">-</td>
                  <td className="border px-2 py-1">{todayBallanceTarget}</td>
                  <td className="border px-2 py-1">{todayBallanceTarget * 8}</td>
                  <td className="border px-2 py-1">{(((todayBallanceTarget * 8) * row.breakdownSMV) / ((row.operator + row.helper + row.opWorkAsHelper) * 8 * 60)).toFixed(2)}</td>
                  <td className="border px-2 py-1">{(todayBallanceTarget * 8) * 1.6}</td>
                  <td className="border px-2 py-1">{activeWipInLine}</td>
                  <td className="border px-2 py-1">{((todayBallanceTarget * 8) * 1.6) - activeWipInLine}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}






// 'use client';

// import { useState, useEffect } from 'react';

// export default function ProductionSummary() {
//   const today = new Date().toISOString().split('T')[0];

//   const [activeTab, setActiveTab] = useState('summary');
//   const [summaryData, setSummaryData] = useState([]);
//   const [mismatchData, setMismatchData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   const [filters, setFilters] = useState({
//     date: today,
//     floor: '',
//     line: '',
//     type: 'operator-workAs-helper'   // default mismatch type
//   });

//   const [floors, setFloors] = useState([]);
//   const [lines, setLines] = useState([]);

//   // Fetch Summary (তোমার আগের summary API)
//   const fetchSummary = async () => {
//     setLoading(true);
//     setError('');
//     let url = `/api/line-summery-report?date=${filters.date}`;
//     if (filters.floor) url += `&floor=${encodeURIComponent(filters.floor)}`;
//     if (filters.line) url += `&line=${encodeURIComponent(filters.line)}`;

//     try {
//       const res = await fetch(url);
//       const result = await res.json();
//       if (result.success) {
//         setSummaryData(result.data || []);
//         const uniqueFloors = [...new Set((result.data || []).map(item => item.floor))];
//         const uniqueLines = [...new Set((result.data || []).map(item => item.line))];
//         setFloors(uniqueFloors);
//         setLines(uniqueLines);
//       } else {
//         setError(result.message || 'Failed to load summary');
//       }
//     } catch (err) {
//       setError('Failed to fetch summary data');
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Fetch Mismatch using YOUR provided API
//   const fetchMismatch = async () => {
//     setLoading(true);
//     setError('');
//     let url = `/api/reportnewdataentry/workasoperatorandhelper?date=${filters.date}&type=${filters.type}`;
    
//     if (filters.floor) url += `&floor=${encodeURIComponent(filters.floor)}`;
//     if (filters.line) url += `&line=${encodeURIComponent(filters.line)}`;

//     try {
//       const res = await fetch(url);
//       const result = await res.json();

//       if (result && result.data) {
//         setMismatchData(result.data);
//       } else if (result && result.count !== undefined) {
//         // যদি তোমার API এর ফরম্যাট count + data হয়
//         setMismatchData(result.data || []);
//       } else {
//         setMismatchData([]);
//       }
//     } catch (err) {
//       setError('Failed to fetch mismatch data');
//       console.error(err);
//       setMismatchData([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Load data when filters or tab changes
//   useEffect(() => {
//     if (activeTab === 'summary') {
//       fetchSummary();
//     } else {
//       fetchMismatch();
//     }
//   }, [filters.date, filters.floor, filters.line, activeTab, filters.type]);

//   const handleFilterChange = (e) => {
//     const { name, value } = e.target;
//     setFilters(prev => ({ ...prev, [name]: value }));
//   };

//   const resetFilters = () => {
//     setFilters({
//       date: today,
//       floor: '',
//       line: '',
//       type: 'operator-workAs-helper'
//     });
//   };

//   // Grand Total Calculation
//   const grandTotal = summaryData.reduce((acc, item) => ({
//     manpower: acc.manpower + (item.totalManpower || 0),
//     operator: acc.operator + (item.totalOperator || 0),
//     helper: acc.helper + (item.totalHelper || 0),
//     hourlyTarget: acc.hourlyTarget + (item.hourlyTarget || 0),
//     totalSMV: acc.totalSMV + (item.totalSMV || 0),
//   }), { manpower: 0, operator: 0, helper: 0, hourlyTarget: 0, totalSMV: 0 });

//   return (
//     <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
//       <div className="max-w-7xl mx-auto px-4">
//         <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
//           Production Report
//         </h1>
//         {/* <p className="text-gray-600 dark:text-gray-400 mb-8">Summary & Designation vs WorkAs Mismatch</p> */}

//         {/* Tabs */}
//         <div className="flex border-b border-gray-200 dark:border-gray-700 mb-8">
//           <button
//             onClick={() => setActiveTab('summary')}
//             className={`px-8 py-4 font-semibold text-lg transition-all ${activeTab === 'summary'
//               ? 'border-b-4 border-blue-600 text-blue-600 font-bold'
//               : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'}`}
//           >
//             Summary
//           </button>
//           <button
//             onClick={() => setActiveTab('mismatch')}
//             className={`px-8 py-4 font-semibold text-lg transition-all ${activeTab === 'mismatch'
//               ? 'border-b-4 border-blue-600 text-blue-600 font-bold'
//               : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'}`}
//           >
//             Work as Report
//           </button>
//         </div>

//         {/* Filters */}
//         <div className="bg-white dark:bg-gray-900 rounded-3xl shadow p-6 mb-8">
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
//             <div>
//               <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Date</label>
//               <input
//                 type="date"
//                 name="date"
//                 value={filters.date}
//                 onChange={handleFilterChange}
//                 className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Floor</label>
//               <select name="floor" value={filters.floor} onChange={handleFilterChange}
//                 className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500">
//                 <option value="">All Floors</option>
//                 {floors.map(f => <option key={f} value={f}>{f}</option>)}
//               </select>
//             </div>

//             <div>
//               <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Line</label>
//               <select name="line" value={filters.line} onChange={handleFilterChange}
//                 className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500">
//                 <option value="">All Lines</option>
//                 {lines.map(l => <option key={l} value={l}>{l}</option>)}
//               </select>
//             </div>

//             {activeTab === 'mismatch' && (
//               <div>
//                 <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Mismatch Type</label>
//                 <select 
//                   name="type" 
//                   value={filters.type} 
//                   onChange={handleFilterChange}
//                   className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 >
//                   <option value="operator-workAs-helper">Designation Operator + WorkAs Helper</option>
//                   <option value="helper-workAs-operator">Designation Helper + WorkAs Operator</option>
//                 </select>
//               </div>
//             )}

//             <div className="flex items-end">
//               <button
//                 onClick={resetFilters}
//                 className="w-full py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-2xl font-medium transition"
//               >
//                 Reset Filters
//               </button>
//             </div>
//           </div>
//         </div>

//         {error && <div className="bg-red-100 text-red-700 p-4 rounded-2xl mb-6">{error}</div>}

//         {/* ==================== SUMMARY TAB ==================== */}
//         {activeTab === 'summary' && (
//           <>
//             {/* Grand Total Cards */}
//             <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-10">
//               {[
//                 { label: "Total Manpower", value: grandTotal.manpower, color: "blue" },
//                 { label: "Total Operator", value: grandTotal.operator, color: "emerald" },
//                 { label: "Total Helper", value: grandTotal.helper, color: "amber" },
//                 //{ label: "Hourly Target", value: Math.round(grandTotal.hourlyTarget), color: "violet" },
//                 { label: "Total SMV", value: grandTotal.totalSMV.toFixed(2), color: "rose" },
//               ].map((card, i) => (
//                 <div key={i} className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow border border-gray-100 dark:border-gray-800">
//                   <p className="text-gray-500 dark:text-gray-400 text-sm">{card.label}</p>
//                   <p className={`text-4xl font-bold mt-3 text-${card.color}-600 dark:text-${card.color}-400`}>
//                     {card.value}
//                   </p>
//                 </div>
//               ))}
//             </div>

//             {/* Summary Table */}
//             <div className="bg-white dark:bg-gray-900 rounded-3xl shadow overflow-hidden">
//               <table className="w-full">
//                 <thead className="bg-gray-100 dark:bg-gray-800">
//                   <tr>
//                     <th className="px-6 py-5 text-left">Date</th>
//                     <th className="px-6 py-5 text-left">Floor</th>
//                     <th className="px-6 py-5 text-left">Line</th>
//                     <th className="px-6 py-5 text-center">Manpower</th>
//                     <th className="px-6 py-5 text-center">Operator</th>
//                     <th className="px-6 py-5 text-center">Helper</th>
//                     {/* <th className="px-6 py-5 text-center">Hourly Target</th> */}
//                     <th className="px-6 py-5 text-center">Total SMV</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
//                   {loading ? (
//                     <tr><td colSpan={8} className="py-16 text-center text-gray-500">Loading summary...</td></tr>
//                   ) : summaryData.length === 0 ? (
//                     <tr><td colSpan={8} className="py-16 text-center text-gray-500">No data found</td></tr>
//                   ) : (
//                     summaryData.map((item, idx) => (
//                       <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
//                         <td className="px-6 py-5">{item.date}</td>
//                         <td className="px-6 py-5">{item.floor}</td>
//                         <td className="px-6 py-5 font-medium">{item.line}</td>
//                         <td className="px-6 py-5 text-center text-xl font-bold text-blue-600">{item.totalManpower}</td>
//                         <td className="px-6 py-5 text-center text-xl font-bold text-emerald-600">{item.totalOperator}</td>
//                         <td className="px-6 py-5 text-center text-xl font-bold text-amber-600">{item.totalHelper}</td>
//                         {/* <td className="px-6 py-5 text-center font-semibold">{item.hourlyTarget}</td> */}
//                         <td className="px-6 py-5 text-center font-semibold">{item.totalSMV}</td>
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </>
//         )}

//         {/* ==================== MISMATCH TAB (তোমার API ব্যবহার করে) ==================== */}
//         {activeTab === 'mismatch' && (
//           <div className="bg-white dark:bg-gray-900 rounded-3xl shadow overflow-hidden">
//             <div className="p-6 border-b bg-gray-50 dark:bg-gray-800">
//               <h2 className="text-2xl font-semibold">
//                 {filters.type === "operator-workAs-helper" 
//                   ? "Designation Operator BUT WorkAs Helper" 
//                   : "Designation Helper BUT WorkAs Operator"}
//               </h2>
//               <p className="text-gray-600 dark:text-gray-400 mt-1">
//                 Total Records: <span className="font-bold text-red-600">{mismatchData.length}</span>
//               </p>
//             </div>

//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
//                   <tr>
//                     <th className="px-6 py-4 text-left">Floor</th>
//                     <th className="px-6 py-4 text-left">Line</th>
//                     <th className="px-6 py-4 text-left">Operator ID</th>
//                     <th className="px-6 py-4 text-left">Name</th>
//                     <th className="px-6 py-4 text-left">Designation</th>
//                     <th className="px-6 py-4 text-left">WorkAs</th>
//                     <th className="px-6 py-4 text-left">Machine</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y">
//                   {loading ? (
//                     <tr><td colSpan={7} className="py-20 text-center">Loading mismatch records...</td></tr>
//                   ) : mismatchData.length === 0 ? (
//                     <tr><td colSpan={7} className="py-20 text-center text-red-500">No mismatch found for this filter</td></tr>
//                   ) : (
//                     mismatchData.map((item, idx) => (
//                       <tr key={idx} className="hover:bg-red-50 dark:hover:bg-red-950/20 transition">
//                         <td className="px-6 py-5">{item.floor}</td>
//                         <td className="px-6 py-5">{item.line}</td>
//                         <td className="px-6 py-5 font-mono text-sm">{item.operator?.operatorId || item.operatorId}</td>
//                         <td className="px-6 py-5 font-medium">{item.operator?.name || item.name}</td>
//                         <td className="px-6 py-5">
//                           <span className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full">
//                             {item.operator?.designation || item.designation}
//                           </span>
//                         </td>
//                         <td className="px-6 py-5">
//                           <span className="px-3 py-1 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded-full">
//                             {item.workAs}
//                           </span>
//                         </td>
//                         <td className="px-6 py-5 text-gray-600">{item.uniqueMachine || '-'}</td>
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }