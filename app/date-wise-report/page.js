
'use client'

import { useState, useEffect } from 'react';

function ProductionReportPage() {
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [floor, setFloor] = useState('');
  const [line, setLine] = useState('');

  // ডেটা ফেচ করার ফাংশন
  const fetchReport = async (filters = {}) => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams(filters);

    try {
      const res = await fetch(`/api/report/production-report?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to fetch data');
      }
      const data = await res.json();
      setReport(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // কম্পোনেন্ট লোড হওয়ার সাথে সাথে বর্তমান দিনের ডেটা দেখানোর জন্য
  useEffect(() => {
    fetchReport(); // কোনো ফিল্টার না পাঠিয়ে কল করা হচ্ছে
  }, []);

  // যখন ফিল্টার বাটনে ক্লিক করা হবে
  const handleFilter = () => {
    fetchReport({ startDate, endDate, floor, line });
  };

  return (
    <div>
      <h1>Production Report</h1>
      {/* ফিল্টার ইনপুট ফিল্ড */}
      <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      <input type="text" value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="Floor" />
      <input type="text" value={line} onChange={(e) => setLine(e.target.value)} placeholder="Line" />
      <button onClick={handleFilter}>Generate Report</button>

      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}

      <ul>
        {report.map((item, index) => (
          <li key={index}>
            Date: {item._id.date}, Floor: {item._id.floor}, Line: {item._id.line}, Total Target: {item.totalTarget}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ProductionReportPage;