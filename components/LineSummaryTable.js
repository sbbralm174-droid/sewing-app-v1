import React from "react";

const LineSummaryTable = ({ reportData }) => {
  const { date, totalLines, data } = reportData;

  return (
    <div className="bg-white shadow-lg rounded-sm overflow-hidden border border-gray-200">
      {/* Header Section */}
      <div className="bg-slate-800 text-white p-5 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-wide uppercase">
            Line Summary Report
          </h1>
          <p className="text-slate-400 text-sm">Date: {date}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase text-slate-400">Total Lines</p>
          <p className="text-2xl font-black text-blue-400">{totalLines}</p>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-gray-100 text-gray-700 uppercase font-bold border-b-2 border-gray-300">
              <th className="px-3 py-3 border-r">Line</th>
              <th className="px-3 py-3 border-r">Buyer</th>
              <th className="px-3 py-3 border-r">Style</th>
              <th className="px-3 py-3 border-r text-center">SMV</th>
              <th className="px-3 py-3 border-r text-center text-blue-600">OP</th>
              <th className="px-3 py-3 border-r text-center text-blue-600">HP</th>
              <th className="px-3 py-3 border-r text-center bg-blue-50">Total MP</th>
              <th className="px-3 py-3 border-r text-center">Target</th>
              <th className="px-3 py-3 border-r text-center">Avg W.H</th>
              <th className="px-3 py-3 border-r text-center text-red-500">NPT</th>
              {/* Breakdown Group */}
              <th className="px-3 py-3 border-r text-center bg-emerald-50 text-emerald-800">BD SMV</th>
              <th className="px-3 py-3 border-r text-center bg-emerald-50 text-emerald-800">BD OP</th>
              <th className="px-3 py-3 border-r text-center bg-emerald-50 text-emerald-800">BD HP</th>
              <th className="px-3 py-3 text-center bg-emerald-100 text-emerald-900 font-black">BD Cap.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                <td className="px-3 py-2 border-r font-bold bg-gray-50">{row.line}</td>
                <td className="px-3 py-2 border-r whitespace-nowrap">{row.buyer}</td>
                <td className="px-3 py-2 border-r min-w-[150px]">{row.style}</td>
                <td className="px-3 py-2 border-r text-center font-mono">{row.totalSmv}</td>
                <td className="px-3 py-2 border-r text-center">{row.operator}</td>
                <td className="px-3 py-2 border-r text-center">{row.helper}</td>
                <td className="px-3 py-2 border-r text-center font-bold bg-blue-50/30 text-blue-700">
                  {row.totalManpower}
                </td>
                <td className="px-3 py-2 border-r text-center font-semibold">{row.hourlyTarget}</td>
                <td className="px-3 py-2 border-r text-center">{row.avgWorkingHour}</td>
                <td className="px-3 py-2 border-r text-center text-red-600 font-medium">
                  {row.npt > 0 ? row.npt : "-"}
                </td>
                {/* Breakdown Data */}
                <td className="px-3 py-2 border-r text-center text-emerald-700 italic">{row.breakdownSMV}</td>
                <td className="px-3 py-2 border-r text-center text-emerald-700 italic">{row.breakdownOperator}</td>
                <td className="px-3 py-2 border-r text-center text-emerald-700 italic">{row.breakdownHP}</td>
                <td className="px-3 py-2 text-center bg-emerald-50 font-bold text-emerald-800">
                  {row.breakdownCapacity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Footer / Legend */}
      <div className="bg-gray-50 p-3 text-[11px] text-gray-500 flex gap-4 border-t">
         <span><strong>OP:</strong> Operator</span>
         <span><strong>HP:</strong> Helper</span>
         <span><strong>MP:</strong> Manpower</span>
         <span><strong>BD:</strong> Breakdown</span>
      </div>
    </div>
  );
};

export default LineSummaryTable;