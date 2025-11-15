'use client';

import Layout from '@/components/Layout';
import { useState, useEffect, useRef } from 'react';
import SidebarNavLayout from '@/components/SidebarNavLayout';
import SewingIcon from '@/public/images/sewing-machine.png';
import Image from 'next/image';

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

  // Mobile resize logic
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ✅ ডেটা ফেচিং লজিক
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const machinesRes = await fetch('/api/machines/last-location');
        const machinesData = await machinesRes.json();
        
        const runningRes = await fetch(`/api/daily-production?date=${selectedDate}`);
        const runningData = await runningRes.json();
        const runningMachineIds = runningData.map(prod => prod.uniqueMachine);

        const machinesWithDetails = machinesData.map((machine) => ({
          ...machine,
          status: runningMachineIds.includes(machine.uniqueId) ? 'Running' : 'Idle',
        }));

        const uniqueMachines = new Set(
          runningData
            .filter(item => item.uniqueMachine)
            .map(item => item.uniqueMachine)
        );
        
        setAllMachines(machinesWithDetails);
        setFilteredMachines(machinesWithDetails);
        setRunningMachines(uniqueMachines.size);

      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedDate]);

  const selectDateRef = useRef(null);

  // Column filter logic
  useEffect(() => {
    const filtered = allMachines.filter(machine =>
      (machine.machineType?.name?.toLowerCase() || '').includes(searchType.toLowerCase()) &&
      (machine.uniqueId?.toLowerCase() || '').includes(searchId.toLowerCase()) &&
      (machine.status?.toLowerCase() || '').includes(searchStatus.toLowerCase()) &&
      (machine.lastUsageDate?.toLowerCase() || '').includes(searchUsage.toLowerCase()) &&
      (machine.lastUsageLocation?.toLowerCase() || '').includes(searchLocation.toLowerCase())
    );
    setFilteredMachines(filtered);
  }, [searchType, searchId, searchStatus, searchUsage, searchLocation, allMachines]);
  

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center">
          <div className="neon-loader w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="mt-2 text-cyan-300 neon-text">Loading machine data...</p>
        </div>
      </div>
    );
  }

  const totalMachines = allMachines.length;
  const idleMachines = totalMachines - runningMachines;

  // 👉 Machine Type wise stats
  const typeWiseStats = allMachines.reduce((acc, machine) => {
    const type = machine.machineType?.name || 'Unknown';
    if (!acc[type]) {
      acc[type] = { total: 0, running: 0, idle: 0 };
    }
    acc[type].total++;
    if (machine.status === 'Running') {
      acc[type].running++;
    } else {
      acc[type].idle++;
    }
    return acc;
  }, {});

  return (
    <div className="min-h-screen font-sans bg-gradient-to-br from-gray-900 via-purple-900 to-black mt-12 p-6">
      <SidebarNavLayout/>
    
      {/* Header with Neon Glow */}
      <div className="mb-8 text-center font-sans">
        <h1 className="text-4xl font-bold text-white mb-3">Machine Dashboard</h1>
        <p className="text-cyan-300 text-lg neon-text">Real-time machine status and monitoring</p>
      </div>

      {/* Date Picker with Neon Style */}
      <div className="mb-6 text-center">
        <label htmlFor="date" className="block text-sm font-medium text-cyan-300 neon-text mb-3">Select Date</label>
        <input 
          type="date"
          id="date"
          ref={selectDateRef}
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          onClick={() => selectDateRef.current?.showPicker()}
          className="block w-full max-w-xs mx-auto rounded-lg border-2 border-cyan-500 bg-gray-800 text-white p-3 shadow-lg focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300 neon-glow transition-all duration-300"
        />
      </div>

      {/* ✅ Global stats - NEON CARDS */}
      <div className="dashboard-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Total Machines Card */}
        <div className="stat-card neon-card-blue rounded-xl p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-cyan-200 text-lg font-semibold mb-2">Total Machines</p>
              <h3 className="text-3xl font-bold text-white neon-text-primary">{totalMachines}</h3>
            </div>
            <div className="relative">
              <Image 
                src={SewingIcon} 
                alt="Sewing Machine Icon" 
                width={70} 
                height={70}
                className="filter brightness-125"
              />
              <div className="absolute inset-0 bg-cyan-400 rounded-full blur-sm opacity-50 animate-pulse"></div>
            </div>
          </div>
          <div className="mt-4 relative z-10">
            <div className="flex items-center text-cyan-200 text-sm">
              <span>All available machines</span>
            </div>
          </div>
        </div>

        {/* Running Machines Card */}
        <div className="stat-card neon-card-green rounded-xl p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-emerald-200 text-lg font-semibold mb-2">Running Machines</p>
              <h3 className="text-3xl font-bold text-white neon-text-primary">{runningMachines}</h3>
            </div>
            <div className="relative text-xl">
              <div className="text-2xl">🟢</div>
              <div className="absolute inset-0 bg-green-400 rounded-full blur-sm opacity-50 animate-ping"></div>
            </div>
          </div>
          <div className="mt-4 relative z-10">
            <div className="flex items-center text-emerald-200 text-sm">
              <span>Active production</span>
            </div>
          </div>
        </div>

        {/* Idle Machines Card */}
        <div className="stat-card neon-card-yellow rounded-xl p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-amber-500/20"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-amber-200 text-lg font-semibold mb-2">Idle Machines</p>
              <h3 className="text-3xl font-bold text-white neon-text-primary">{idleMachines}</h3>
            </div>
            <div className="relative text-3xl">
              <div className="text-2xl">🟡</div>
              <div className="absolute inset-0 bg-yellow-400 rounded-full blur-sm opacity-50 animate-pulse"></div>
            </div>
          </div>
          <div className="mt-4 relative z-10">
            <div className="flex items-center text-amber-200 text-sm">
              <span>Available for work</span>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Type wise stats - NEON STYLE */}
      <div className="p-4 md:p-6 rounded-xl shadow-2xl mb-8 neon-card-purple">
        <h2 className="text-2xl font-bold text-cyan-300 neon-text mb-6">Machine Type Wise Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(typeWiseStats).map(([type, stats]) => (
            <div key={type} className="p-4 rounded-xl border-2 border-cyan-500/30 bg-gray-800/50 backdrop-blur-sm neon-glow-hover transition-all duration-300">
              <h3 className="text-lg font-semibold text-cyan-300 mb-3 neon-text">{type}</h3>
              <p className="text-sm text-gray-300 mb-1">Total: <span className="font-bold text-cyan-400">{stats.total}</span></p>
              <p className="text-sm text-gray-300 mb-1">Running: <span className="font-bold text-green-400">{stats.running}</span></p>
              <p className="text-sm text-gray-300">Idle: <span className="font-bold text-yellow-400">{stats.idle}</span></p>
            </div>
          ))}
        </div>
      </div>

      {/* ✅ Table / Card view - NEON STYLE */}
      <div className="p-4 md:p-6 rounded-xl shadow-2xl neon-card-purple">
        <h2 className="text-2xl font-bold text-cyan-300 neon-text mb-6">All Machines Status</h2>

        {isMobile ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-cyan-300 mb-2">Machine Type</label>
                <input 
                  value={searchType} 
                  onChange={e => setSearchType(e.target.value)} 
                  className="w-full p-2 text-sm rounded-lg border-2 border-cyan-500 bg-gray-800 text-white focus:border-cyan-300 focus:ring-1 focus:ring-cyan-300 neon-glow"
                  placeholder="Filter type..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-cyan-300 mb-2">ID</label>
                <input 
                  value={searchId} 
                  onChange={e => setSearchId(e.target.value)} 
                  className="w-full p-2 text-sm rounded-lg border-2 border-cyan-500 bg-gray-800 text-white focus:border-cyan-300 focus:ring-1 focus:ring-cyan-300 neon-glow"
                  placeholder="Filter ID..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-cyan-300 mb-2">Status</label>
                <input 
                  value={searchStatus} 
                  onChange={e => setSearchStatus(e.target.value)} 
                  className="w-full p-2 text-sm rounded-lg border-2 border-cyan-500 bg-gray-800 text-white focus:border-cyan-300 focus:ring-1 focus:ring-cyan-300 neon-glow"
                  placeholder="Filter status..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-cyan-300 mb-2">Last Used</label>
                <input 
                  value={searchUsage} 
                  onChange={e => setSearchUsage(e.target.value)} 
                  className="w-full p-2 text-sm rounded-lg border-2 border-cyan-500 bg-gray-800 text-white focus:border-cyan-300 focus:ring-1 focus:ring-cyan-300 neon-glow"
                  placeholder="Filter date..."
                />
              </div>
            </div>

            {filteredMachines.map(machine => (
              <div key={machine.uniqueId} className="p-4 rounded-xl border-2 border-cyan-500/30 bg-gray-800/50 backdrop-blur-sm neon-glow-hover transition-all duration-300">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold text-cyan-300">{machine.machineType?.name}</span>
                  <span 
                    className={`px-3 py-1 text-xs font-semibold rounded-full border-2 ${
                      machine.status === 'Running' 
                        ? 'bg-green-500/20 text-green-300 border-green-400 neon-glow-green' 
                        : 'bg-yellow-500/20 text-yellow-300 border-yellow-400 neon-glow-yellow'
                    }`}
                  >
                    {machine.status}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex justify-between">
                    <span>ID:</span>
                    <span className="font-medium text-cyan-400">{machine.uniqueId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Used:</span>
                    <span>{machine.lastUsageDate || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Location:</span>
                    <span>{machine.lastUsageLocation || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border-2 border-cyan-500/30 bg-gray-800/50 backdrop-blur-sm neon-glow">
            <table className="min-w-full divide-y divide-cyan-500/30">
              <thead className="bg-gray-800/80">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-cyan-300 uppercase tracking-wider border-r border-cyan-500/30">
                    Machine Type
                    <input 
                      value={searchType} 
                      onChange={e => setSearchType(e.target.value)} 
                      className="mt-2 border-2 border-cyan-500 bg-gray-700 text-white rounded p-2 w-full text-sm focus:border-cyan-300 focus:ring-1 focus:ring-cyan-300 neon-glow"
                      placeholder="Filter type..."
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-cyan-300 uppercase tracking-wider border-r border-cyan-500/30">
                    ID
                    <input 
                      value={searchId} 
                      onChange={e => setSearchId(e.target.value)} 
                      className="mt-2 border-2 border-cyan-500 bg-gray-700 text-white rounded p-2 w-full text-sm focus:border-cyan-300 focus:ring-1 focus:ring-cyan-300 neon-glow"
                      placeholder="Filter ID..."
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-cyan-300 uppercase tracking-wider border-r border-cyan-500/30">
                    Status
                    <input 
                      value={searchStatus} 
                      onChange={e => setSearchStatus(e.target.value)} 
                      className="mt-2 border-2 border-cyan-500 bg-gray-700 text-white rounded p-2 w-full text-sm focus:border-cyan-300 focus:ring-1 focus:ring-cyan-300 neon-glow"
                      placeholder="Filter status..."
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-cyan-300 uppercase tracking-wider border-r border-cyan-500/30">
                    Last Used
                    <input 
                      value={searchUsage} 
                      onChange={e => setSearchUsage(e.target.value)} 
                      className="mt-2 border-2 border-cyan-500 bg-gray-700 text-white rounded p-2 w-full text-sm focus:border-cyan-300 focus:ring-1 focus:ring-cyan-300 neon-glow"
                      placeholder="Filter date..."
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-cyan-300 uppercase tracking-wider">
                    Location
                    <input 
                      value={searchLocation} 
                      onChange={e => setSearchLocation(e.target.value)} 
                      className="mt-2 border-2 border-cyan-500 bg-gray-700 text-white rounded p-2 w-full text-sm focus:border-cyan-300 focus:ring-1 focus:ring-cyan-300 neon-glow"
                      placeholder="Filter location..."
                    />
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800/30 divide-y divide-cyan-500/20">
                {filteredMachines.map(machine => (
                  <tr key={machine.uniqueId} className="hover:bg-cyan-500/10 transition-all duration-300">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-cyan-300 border-r border-cyan-500/20">
                      {machine.machineType?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 border-r border-cyan-500/20">{machine.uniqueId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm border-r border-cyan-500/20">
                      <span 
                        className={`px-3 py-2 inline-flex text-xs leading-5 font-semibold rounded-full border-2 ${
                          machine.status === 'Running' 
                            ? 'bg-green-500/20 text-green-300 border-green-400 neon-glow-green' 
                            : 'bg-yellow-500/20 text-yellow-300 border-yellow-400 neon-glow-yellow'
                        }`}
                      >
                        {machine.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 border-r border-cyan-500/20">{machine.lastUsageDate || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{machine.lastUsageLocation || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add these styles to your global CSS */}
      <style jsx>{`
        .neon-text {
          
        }
        .neon-text-primary {
          
        }
        ..neon-glow {
          box-shadow: 0 0 10px #00ffff, 0 0 20px #00ffff, inset 0 0 10px #00ffff33;
        }
        .neon-glow-green {
          box-shadow: 0 0 10px #00ff00, 0 0 20px #00ff00, inset 0 0 10px #00ff0033;
        }
        .neon-glow-yellow {
          box-shadow: 0 0 10px #ffff00, 0 0 20px #ffff00, inset 0 0 10px #ffff0033;
        }
        .neon-card-blue {
          background: linear-gradient(135deg, #1e3a8a33, #0ea5e933);
          border: 0.5px solid #00ffff;
          box-shadow: 0 0 20px , inset 0 0 20px #00ffff33;
        }
        .neon-card-green {
          background: linear-gradient(135deg, #065f4633, #10b98133);
          border: 2px solid #00ff00;
          box-shadow: 0 0 20px #00ff00, inset 0 0 20px #00ff0033;
        }
        .neon-card-yellow {
          background: linear-gradient(135deg, #713f1233, #eab30833);
          border: 2px solid #ffff00;
          box-shadow: 0 0 20px #ffff00, inset 0 0 20px #ffff0033;
        }
        ..neon-card-purple {
          background: linear-gradient(135deg, #4c1d9533, #8b5cf633);
          border: 2px solid #a855f7;
          box-shadow: 0 0 20px #a855f7, inset 0 0 20px #a855f733;
        }
        .neon-glow-hover:hover {
          box-shadow: 0 0 15px #00ffff, 0 0 30px #00ffff, inset 0 0 15px #00ffff33;
          transform: translateY(-2px);
        }
        .neon-loader {
          box-shadow: 0 0 10px #00ffff, 0 0 20px #00ffff;
        }
      `}</style>
    </div>
  );
}