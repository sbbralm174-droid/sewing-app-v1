'use client';
import { useState } from "react";

export default function MachineServiceManager() {
  const [uniqueId, setUniqueId] = useState('');
  const [machine, setMachine] = useState(null);
  const [lastServiced, setLastServiced] = useState('');
  const [customInterval, setCustomInterval] = useState('');
  const [isNotificationActive, setIsNotificationActive] = useState(true);
  const [message, setMessage] = useState('');

  const handleSearch = async () => {
    setMessage('');
    const res = await fetch(`/api/machines/search?uniqueId=${uniqueId}`);
    const data = await res.json();
    if (data.success) {
      setMachine(data.machine);
      setLastServiced(data.machine.servicingConfig.lastServiced ? data.machine.servicingConfig.lastServiced.split('T')[0] : '');
      setCustomInterval(data.machine.servicingConfig.customInterval ?? data.machine.servicingConfig.defaultInterval ?? 15);
      setIsNotificationActive(data.machine.servicingConfig.isNotificationActive);
    } else {
      setMessage(data.message);
      setMachine(null);
    }
  }

  const handleUpdate = async () => {
    const payload = { uniqueId };
    if (lastServiced) payload.lastServiced = lastServiced;
    if (customInterval) payload.customInterval = Number(customInterval);
    payload.isNotificationActive = isNotificationActive;

    const res = await fetch('/api/machines/update-service', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
      setMessage(`Updated! Next Service: ${new Date(data.machine.servicingConfig.nextServiceDate).toLocaleDateString()}`);
      setMachine(data.machine);
    } else {
      setMessage(`Error: ${data.error || data.message}`);
    }
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 border rounded-lg shadow-md bg-white space-y-4">
      <h2 className="text-xl font-bold mb-4">Machine Service Manager</h2>

      {/* Search */}
      <div className="flex space-x-2">
        <input 
          type="text" 
          value={uniqueId} 
          onChange={e => setUniqueId(e.target.value)} 
          placeholder="Enter Machine Unique ID"
          className="flex-1 border px-3 py-2 rounded"
        />
        <button onClick={handleSearch} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Search
        </button>
      </div>

      {/* Update Form */}
      {machine && (
        <div className="space-y-3 border-t pt-4">
          <p className="font-medium">Machine: {machine.uniqueId} ({machine.machineType.name})</p>

          <div>
            <label className="block font-medium mb-1">Last Serviced Date</label>
            <input 
              type="date" 
              value={lastServiced} 
              onChange={e => setLastServiced(e.target.value)} 
              className="w-full border px-3 py-2 rounded" 
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Custom Interval (days)</label>
            <input 
              type="number" 
              value={customInterval} 
              onChange={e => setCustomInterval(e.target.value)} 
              className="w-full border px-3 py-2 rounded" 
              min={1} 
            />
          </div>

          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              checked={isNotificationActive} 
              onChange={e => setIsNotificationActive(e.target.checked)} 
            />
            <span>Notification Active</span>
          </div>

          <button onClick={handleUpdate} className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600">
            Update Machine
          </button>
        </div>
      )}

      {message && <p className="mt-2 text-green-600">{message}</p>}
    </div>
  );
}
