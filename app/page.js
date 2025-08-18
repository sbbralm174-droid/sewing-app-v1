'use client'; // This directive is crucial for client-side functionality like state and event handling

import { useState } from 'react';
import Layout from '../components/Layout';
import BarChartComponent from '../components/BarChartComponent';
import { dashboardData } from '../app/data/dashboardData';

const DashboardCard = ({ title, value, unit = '' }) => (
  <div className="bg-white p-6 rounded-lg shadow-md text-center">
    <h3 className="text-lg font-medium text-gray-500">{title}</h3>
    <p className="mt-2 text-3xl font-bold text-gray-900">
      {value.toLocaleString()} {unit}
    </p>
  </div>
);

export default function GarmentsDashboard() {
  const [selectedFloor, setSelectedFloor] = useState('all'); // State to track selected floor

  const handleFloorChange = (event) => {
    setSelectedFloor(event.target.value);
  };

  // Determine which data to display based on the selected floor
  let chartData;
  if (selectedFloor === 'all') {
    // Show overall data
    chartData = [
      {
        name: "Factory",
        target: dashboardData.total.target,
        achievement: dashboardData.total.achievement,
      },
    ];
  } else {
    // Show data for the selected floor's lines
    const floor = dashboardData.floors.find(f => f.name === selectedFloor);
    chartData = floor ? floor.lines.map(line => ({
      name: line.name,
      target: line.target,
      achievement: line.achievement,
    })) : [];
  }

  // Get the title for the chart dynamically
  const chartTitle = selectedFloor === 'all'
    ? 'Overall Factory Performance'
    : `Performance for ${selectedFloor}'s Lines`;

  return (
    <Layout>
      <h1 className="text-4xl font-bold text-gray-800 mb-8">Garments Production Dashboard 📊</h1>

      {/* Overall Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <DashboardCard title="Total Target" value={dashboardData.total.target} />
        <DashboardCard title="Total Achievement" value={dashboardData.total.achievement} />
        <DashboardCard title="Total Employees" value={dashboardData.total.employees} />
      </div>

      {/* Filter and Chart Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Performance Overview</h2>
          <div className="flex items-center">
            <label htmlFor="floor-select" className="mr-2 text-gray-600">Select Floor:</label>
            <select
              id="floor-select"
              onChange={handleFloorChange}
              value={selectedFloor}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Floors (Overall)</option>
              {dashboardData.floors.map(floor => (
                <option key={floor.name} value={floor.name}>
                  {floor.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* The single, dynamic bar chart */}
        <BarChartComponent
          data={chartData}
          dataKey="name"
          barKey={{ target: "target", achievement: "achievement" }}
          title={chartTitle}
        />
      </div>
    </Layout>
  );
}