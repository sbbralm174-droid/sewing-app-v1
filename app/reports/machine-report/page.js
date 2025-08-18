'use client';

import Layout from '@/components/Layout';
import { useState, useEffect } from 'react';

export default function MachineDashboard() {
  const [allMachines, setAllMachines] = useState([]);
  const [filteredMachines, setFilteredMachines] = useState([]);
  const [runningMachines, setRunningMachines] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Column search states
  const [searchType, setSearchType] = useState('');
  const [searchId, setSearchId] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [searchUsage, setSearchUsage] = useState('');
  const [searchLocation, setSearchLocation] = useState('');

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
            const lastUsageRes = await fetch(`/api/daily-production/last-usage?machineId=${machine.uniqueId}`);
            let lastUsage = null;
            if (lastUsageRes.ok) {
              lastUsage = await lastUsageRes.json();
            }

            return {
              ...machine,
              status: runningMachineIds.includes(machine.uniqueId) ? 'Running' : 'Idle',
              lastUsageDate: lastUsage ? new Date(lastUsage.date).toLocaleDateString() : 'N/A',
              lastUsageLocation: lastUsage ? lastUsage.location : 'No location data',
            };
          })
        );
        
        setAllMachines(machinesWithDetails);
        setFilteredMachines(machinesWithDetails);
        setRunningMachines(runningData);
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedDate]);

  // Filter whenever search fields change
  useEffect(() => {
    const filtered = allMachines.filter(machine =>
      machine.machineType.name.toLowerCase().includes(searchType.toLowerCase()) &&
      machine.uniqueId.toLowerCase().includes(searchId.toLowerCase()) &&
      machine.status.toLowerCase().includes(searchStatus.toLowerCase()) &&
      machine.lastUsageDate.toLowerCase().includes(searchUsage.toLowerCase()) &&
      machine.lastUsageLocation.toLowerCase().includes(searchLocation.toLowerCase())
    );
    setFilteredMachines(filtered);
  }, [searchType, searchId, searchStatus, searchUsage, searchLocation, allMachines]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#1A1B22', color: '#E5E9F0' }}>
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading machine data...</p>
        </div>
      </div>
    );
  }

  const totalMachines = allMachines.length;
  const idleMachines = totalMachines - runningMachines.length;

  return (
    <Layout>
      <div className="p-4 md:p-8 min-h-screen" style={{ backgroundColor: '#1A1B22', fontFamily: "'Inter', sans-serif", color: '#E5E9F0' }}>
        <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Machine Dashboard</h1>

        <div className="mb-4 md:mb-6">
          <label htmlFor="date" className="block text-sm font-medium mb-1">Select Date</label>
          <input 
            type="date"
            id="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="block w-full rounded-md p-2 text-sm md:text-base"
            style={{ backgroundColor: '#2D3039', color: '#E5E9F0', borderColor: '#4C566A' }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-6">
          <div className="p-4 md:p-6 rounded-lg shadow-md" style={{ backgroundColor: '#2D3039' }}>
            <h2 className="text-base md:text-lg font-semibold">Total Machines</h2>
            <p className="text-2xl md:text-4xl font-bold mt-1 md:mt-2" style={{ color: '#5E81AC' }}>{totalMachines}</p>
          </div>
          <div className="p-4 md:p-6 rounded-lg shadow-md" style={{ backgroundColor: '#2D3039' }}>
            <h2 className="text-base md:text-lg font-semibold">Running Machines</h2>
            <p className="text-2xl md:text-4xl font-bold mt-1 md:mt-2" style={{ color: '#A3BE8C' }}>{runningMachines.length}</p>
          </div>
          <div className="p-4 md:p-6 rounded-lg shadow-md" style={{ backgroundColor: '#2D3039' }}>
            <h2 className="text-base md:text-lg font-semibold">Idle Machines</h2>
            <p className="text-2xl md:text-4xl font-bold mt-1 md:mt-2" style={{ color: '#BF616A' }}>{idleMachines}</p>
          </div>
        </div>

        <div className="p-4 md:p-6 rounded-lg shadow-md" style={{ backgroundColor: '#2D3039' }}>
          <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4">All Machines Status</h2>
          
          {isMobile ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Machine Type</label>
                  <input 
                    value={searchType} 
                    onChange={e => setSearchType(e.target.value)} 
                    className="w-full p-1 text-xs rounded border"
                    style={{ backgroundColor: '#2D3039', color: '#E5E9F0', borderColor: '#4C566A' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">ID</label>
                  <input 
                    value={searchId} 
                    onChange={e => setSearchId(e.target.value)} 
                    className="w-full p-1 text-xs rounded border"
                    style={{ backgroundColor: '#2D3039', color: '#E5E9F0', borderColor: '#4C566A' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Status</label>
                  <input 
                    value={searchStatus} 
                    onChange={e => setSearchStatus(e.target.value)} 
                    className="w-full p-1 text-xs rounded border"
                    style={{ backgroundColor: '#2D3039', color: '#E5E9F0', borderColor: '#4C566A' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Last Used</label>
                  <input 
                    value={searchUsage} 
                    onChange={e => setSearchUsage(e.target.value)} 
                    className="w-full p-1 text-xs rounded border"
                    style={{ backgroundColor: '#2D3039', color: '#E5E9F0', borderColor: '#4C566A' }}
                  />
                </div>
              </div>

              {filteredMachines.map(machine => (
                <div key={machine.uniqueId} className="p-3 rounded" style={{ backgroundColor: '#3B4252' }}>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">Type:</span>
                    <span>{machine.machineType.name}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">ID:</span>
                    <span>{machine.uniqueId}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">Status:</span>
                    <span 
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full`} 
                      style={{
                        backgroundColor: machine.status === 'Running' ? '#A3BE8C20' : '#BF616A20',
                        color: machine.status === 'Running' ? '#A3BE8C' : '#BF616A'
                      }}
                    >
                      {machine.status}
                    </span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">Last Used:</span>
                    <span>{machine.lastUsageDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Location:</span>
                    <span>{machine.lastUsageLocation}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead style={{ backgroundColor: '#3B4252', color: '#E5E9F0' }}>
                  <tr>
                    <th className="px-4 py-2 md:px-6 md:py-3 text-left text-xs md:text-sm font-medium uppercase">
                      Machine Type
                      <input 
                        value={searchType} 
                        onChange={e => setSearchType(e.target.value)} 
                        className="mt-1 border rounded p-1 w-full text-xs"
                        style={{ backgroundColor: '#2D3039', color: '#E5E9F0', borderColor: '#4C566A' }}
                      />
                    </th>
                    <th className="px-4 py-2 md:px-6 md:py-3 text-left text-xs md:text-sm font-medium uppercase">
                      ID
                      <input 
                        value={searchId} 
                        onChange={e => setSearchId(e.target.value)} 
                        className="mt-1 border rounded p-1 w-full text-xs"
                        style={{ backgroundColor: '#2D3039', color: '#E5E9F0', borderColor: '#4C566A' }}
                      />
                    </th>
                    <th className="px-4 py-2 md:px-6 md:py-3 text-left text-xs md:text-sm font-medium uppercase">
                      Status
                      <input 
                        value={searchStatus} 
                        onChange={e => setSearchStatus(e.target.value)} 
                        className="mt-1 border rounded p-1 w-full text-xs"
                        style={{ backgroundColor: '#2D3039', color: '#E5E9F0', borderColor: '#4C566A' }}
                      />
                    </th>
                    <th className="px-4 py-2 md:px-6 md:py-3 text-left text-xs md:text-sm font-medium uppercase">
                      Last Used
                      <input 
                        value={searchUsage} 
                        onChange={e => setSearchUsage(e.target.value)} 
                        className="mt-1 border rounded p-1 w-full text-xs"
                        style={{ backgroundColor: '#2D3039', color: '#E5E9F0', borderColor: '#4C566A' }}
                      />
                    </th>
                    <th className="px-4 py-2 md:px-6 md:py-3 text-left text-xs md:text-sm font-medium uppercase">
                      Location
                      <input 
                        value={searchLocation} 
                        onChange={e => setSearchLocation(e.target.value)} 
                        className="mt-1 border rounded p-1 w-full text-xs"
                        style={{ backgroundColor: '#2D3039', color: '#E5E9F0', borderColor: '#4C566A' }}
                      />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredMachines.map(machine => (
                    <tr key={machine.uniqueId}>
                      <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap text-sm">{machine.machineType.name}</td>
                      <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap text-sm">{machine.uniqueId}</td>
                      <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap text-sm">
                        <span 
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full`} 
                          style={{
                            backgroundColor: machine.status === 'Running' ? '#A3BE8C20' : '#BF616A20',
                            color: machine.status === 'Running' ? '#A3BE8C' : '#BF616A'
                          }}
                        >
                          {machine.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap text-sm">{machine.lastUsageDate}</td>
                      <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap text-sm">{machine.lastUsageLocation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}