// app/machines/page.js
import React from 'react';
export const dynamic = "force-dynamic";
async function getMachines() {
  try {
    const res = await fetch('http://localhost:3000/api/machines', {
      cache: 'no-store'
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch machines');
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error fetching machines:', error);
    return [];
  }
}

export default async function MachinesPage() {
  const machines = await getMachines();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Machine Last Locations
        </h1>
        
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Machine ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Machine Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Floor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Line
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supervisor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {machines.map((machine) => (
                <tr key={machine._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {machine.uniqueId}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {machine.machineType.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      machine.lastLocation.floor === 'N/A' 
                        ? 'text-gray-400' 
                        : 'text-green-600'
                    }`}>
                      {machine.lastLocation.floor}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${
                      machine.lastLocation.line === 'N/A' 
                        ? 'text-gray-400' 
                        : 'text-blue-600'
                    }`}>
                      {machine.lastLocation.line}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${
                      machine.lastLocation.supervisor === 'N/A' 
                        ? 'text-gray-400' 
                        : 'text-purple-600'
                    }`}>
                      {machine.lastLocation.supervisor}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(machine.lastLocation.updatedAt).toLocaleDateString('en-BD')}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(machine.lastLocation.updatedAt).toLocaleTimeString('en-BD')}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Total Machines</div>
            <div className="text-2xl font-bold text-gray-900">{machines.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Assigned Locations</div>
            <div className="text-2xl font-bold text-green-600">
              {machines.filter(m => m.lastLocation.floor !== 'N/A').length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Unassigned</div>
            <div className="text-2xl font-bold text-gray-400">
              {machines.filter(m => m.lastLocation.floor === 'N/A').length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Last Updated</div>
            <div className="text-lg font-semibold text-gray-900">
              {new Date().toLocaleDateString('en-BD')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}