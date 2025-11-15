'use client'; // This directive is crucial for client-side functionality like state and event handling

import { useState } from 'react';
import { dashboardData } from '../app/data/dashboardData';
import Header from './header/page'
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
    <div >
     
    <Header />
   </div>
  );
}