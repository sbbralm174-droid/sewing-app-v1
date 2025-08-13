'use client';

import { useState, useEffect } from 'react';

export default function MachineDashboard() {
  const [allMachines, setAllMachines] = useState([]);
  const [runningMachines, setRunningMachines] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const machinesRes = await fetch('/api/machines');
        const machinesData = await machinesRes.json();
        
        const runningRes = await fetch(`/api/daily-production?date=${selectedDate}`);
        const runningData = await runningRes.json();
        const runningMachineIds = runningData.map(prod => prod.uniqueMachine);

        const machinesWithDetails = await Promise.all(
          machinesData.map(async (machine) => {
            // uniqueMachine এর বদলে uniqueId ব্যবহার করা হয়েছে
            const lastUsageRes = await fetch(`/api/daily-production/last-usage?machineId=${machine.uniqueId}`);
            let lastUsage = null;
            if (lastUsageRes.ok) {
              lastUsage = await lastUsageRes.json();
            }

            return {
              ...machine,
              // uniqueMachine এর বদলে uniqueId ব্যবহার করা হয়েছে
              status: runningMachineIds.includes(machine.uniqueId) ? 'Running' : 'Idle',
              lastUsageDate: lastUsage ? new Date(lastUsage.date).toLocaleDateString() : 'N/A',
              // API থেকে formatted location ব্যবহার করা হচ্ছে
              lastUsageLocation: lastUsage ? lastUsage.location : 'location not entry',
            };
          })
        );
        
        setAllMachines(machinesWithDetails);
        setRunningMachines(runningData);
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedDate]);
  
  if (loading) {
    return <div>Loading...</div>;
  }

  const totalMachines = allMachines.length;
  const idleMachines = totalMachines - runningMachines.length;

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">মেশিন ড্যাশবোর্ড</h1>

      <div className="mb-6">
        <label htmlFor="date" className="block text-sm font-medium text-gray-700">তারিখ নির্বাচন করুন</label>
        <input 
          type="date"
          id="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-600">মোট মেশিন</h2>
          <p className="text-4xl font-bold text-indigo-600 mt-2">{totalMachines}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-600">চলমান মেশিন</h2>
          <p className="text-4xl font-bold text-green-600 mt-2">{runningMachines.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-600">অব্যবহৃত মেশিন</h2>
          <p className="text-4xl font-bold text-red-600 mt-2">{idleMachines}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4 text-gray-800">সকল মেশিনের স্ট্যাটাস</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">মেশিন টাইপ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">আইডি</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">স্ট্যাটাস</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">সর্বশেষ ব্যবহার</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">লোকেশন</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allMachines.map(machine => (
                <tr key={machine.uniqueId}>
                  <td className="px-6 py-4 whitespace-nowrap">{machine.machineType.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{machine.uniqueId}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${machine.status === 'Running' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {machine.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{machine.lastUsageDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{machine.lastUsageLocation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}