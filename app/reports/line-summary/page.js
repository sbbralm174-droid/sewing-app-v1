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
