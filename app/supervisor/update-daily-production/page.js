'use client';

import { useState } from 'react';

export default function ProductionUpdatePage() {
  const [date, setDate] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [data, setData] = useState(null);
  const [updatedData, setUpdatedData] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // ✅ Search Data by date + operatorId
  const handleSearch = async () => {
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch(`/api/daily-production/update/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, operatorId }),
      });
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      } else {
        setData(null);
        setMessage(result.message);
      }
    } catch (err) {
      console.error(err);
      setMessage('Error fetching data');
    }
    setLoading(false);
  };

  // ✅ Handle input change
  const handleChange = (field, value) => {
    setUpdatedData((prev) => ({ ...prev, [field]: value }));
  };

  // ✅ Save updates: 1️⃣ Save old data → ProductionHistory, 2️⃣ Update → DailyProduction
  const handleUpdate = async () => {
    if (!data) return;

    setMessage('Updating...');
    setLoading(true);

    try {
      // Step 1️⃣: Save old data to ProductionHistory
      await fetch(`/api/daily-production/productionHistory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: data.date,
          operatorId: data.operator.operatorId,
          savedBy: 'Admin',
        }),
      });

      // Step 2️⃣: Update new data in DailyProduction
      const res2 = await fetch(`/api/daily-production/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: data.date,
          operatorId: data.operator.operatorId,
          updateData: updatedData,
        }),
      });

      const result2 = await res2.json();
      if (result2.success) {
        setMessage('✅ Successfully updated!');
        setData(result2.updatedData);
        setUpdatedData({});
      } else {
        setMessage('❌ Update failed: ' + result2.message);
      }
    } catch (error) {
      console.error(error);
      setMessage('Server error occurred.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-2xl shadow-md">
        <h1 className="text-2xl font-semibold mb-4 text-center">Daily Production Update</h1>

        {/* Search */}
        <div className="flex gap-4 mb-6">
          <input
            type="date"
            className="border p-2 rounded w-1/2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <input
            type="text"
            className="border p-2 rounded w-1/2"
            placeholder="Enter Operator ID"
            value={operatorId}
            onChange={(e) => setOperatorId(e.target.value)}
          />
          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {message && <p className="text-center text-gray-700 mb-4">{message}</p>}

        {/* Display + Edit */}
        {data && (
          <div className="space-y-4">
            {Object.entries({
              supervisor: data.supervisor,
              floor: data.floor,
              line: data.line,
              process: data.process,
              status: data.status,
              machineType: data.machineType,
              uniqueMachine: data.uniqueMachine,
              target: data.target,
              workAs: data.workAs,
            }).map(([field, value]) => (
              <div key={field} className="grid grid-cols-3 items-center gap-3">
                <p className="capitalize font-medium">{field}</p>
                <p className="text-gray-600 border p-2 rounded bg-gray-50">{value ?? 'N/A'}</p>
                <input
                  type="text"
                  className="border p-2 rounded w-full"
                  placeholder={`New ${field}`}
                  value={updatedData[field] || ''}
                  onChange={(e) => handleChange(field, e.target.value)}
                />
              </div>
            ))}

            <div className="text-center mt-6">
              <button
                onClick={handleUpdate}
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
              >
                {loading ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
