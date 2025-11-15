'use client'
import { useState, useEffect } from 'react';
import SidebarNavLayout from '@/components/SidebarNavLayout';

export default function FloorLineForm() {
  const [formData, setFormData] = useState({
    floor: '',
    lineNumber: '',
    supervisor: '',
    operators: [],
    machines: [],
    currentProcess: ''
  });
  const [floors, setFloors] = useState([]);
  const [floorName, setFloorName] = useState('');
  const [floorLines, setFloorLines] = useState([]); // table data
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [floorsRes, floorLinesRes] = await Promise.all([
          fetch('/api/floors'),
          fetch('/api/floor-lines'),
        ]);

        const floorsData = await floorsRes.json();
        const floorLinesData = await floorLinesRes.json();

        setFloors(floorsData.data);
        // 👇 ensure array
        setFloorLines(Array.isArray(floorLinesData) ? floorLinesData : []);
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'floor') {
      const selectedFloor = floors.find(f => f._id === value);
      setFloorName(selectedFloor ? selectedFloor.floorName : '');
      setFormData(prev => ({ ...prev, floor: value }));
    } else if (name === 'lineNumber') {
      const sanitizedValue = value.replace(floorName + '-', '');
      setFormData(prev => ({ ...prev, lineNumber: sanitizedValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        lineNumber: `${floorName}-${formData.lineNumber}`
      };
      
      const response = await fetch('/api/floor-lines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const newFloorLine = await response.json();
        setSuccessMessage('✅ New Floor Line added successfully!');
        setFloorLines(prev => [...prev, newFloorLine]); // add directly
        setFormData({ floor: '', lineNumber: '', supervisor: '', operators: [], machines: [], currentProcess: '' });
        setFloorName('');
        setTimeout(() => setSuccessMessage(''), 3000); // hide after 3s
      } else {
        const errorText = await response.text();
        console.error('Failed to submit form:', errorText);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // 🔹 Group floorLines by floorName
  const groupedByFloor = floorLines.reduce((acc, line) => {
    const name = line.floor?.floorName || 'No Floor';
    if (!acc[name]) acc[name] = [];
    acc[name].push(line);
    return acc;
  }, {});

  return (
    
      <div className="container mx-auto p-4 bg-[#1A1B22] text-[#E5E9F0] font-sans min-h-screen">
       <SidebarNavLayout />
        <h1 className="text-2xl font-bold mb-4">Add New Floor Line</h1>

        {/* ✅ Success Message */}
        {successMessage && (
          <div className="mb-4 p-2 bg-green-700 text-white rounded-md">
            {successMessage}
          </div>
        )}

        {/* ✅ Form */}
        <form onSubmit={handleSubmit} className="space-y-4 bg-[#2D3039] p-6 rounded-lg shadow-lg mb-6">
          <div>
            <label className="block mb-1">Floor:</label>
            <select
              name="floor"
              value={formData.floor}
              onChange={handleChange}
              className="w-full p-2 border border-gray-600 rounded-md bg-[#2D3039] text-[#E5E9F0] focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Floor</option>
              {floors.map((floor) => (
                <option key={floor._id} value={floor._id}>
                  {floor.floorName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1">Line Number:</label>
            <input
              type="text"
              name="lineNumber"
              value={floorName ? `${floorName}-${formData.lineNumber}` : formData.lineNumber}
              onChange={handleChange}
              className="w-full p-2 border border-gray-600 rounded-md bg-[#2D3039] text-[#E5E9F0] focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="e.g., 101"
            />
          </div>
          <button
            type="submit"
            className="bg-green-600 text-white font-bold px-4 py-2 rounded-md hover:bg-green-700 transition-colors duration-300"
          >
            Submit
          </button>
        </form>

        {/* ✅ Floor wise Tables */}
        <h2 className="text-xl font-semibold mb-4">All Floor Lines (Grouped by Floor)</h2>
        {Object.keys(groupedByFloor).length === 0 ? (
          <p className="text-gray-400">No floor lines available</p>
        ) : (
          Object.keys(groupedByFloor).map((floor, i) => (
            <div key={i} className="mb-8">
              <h3 className="text-lg font-bold mb-2 text-blue-400">Floor: {floor}</h3>
              <table className="w-full border border-gray-700 text-left text-sm">
                <thead className="bg-[#2D3039]">
                  <tr>
                    <th className="p-2 border border-gray-700">#</th>
                    <th className="p-2 border border-gray-700">Line Number</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedByFloor[floor].map((line, index) => (
                    <tr key={line._id} className="odd:bg-[#1E2028] even:bg-[#2A2C34]">
                      <td className="p-2 border border-gray-700">{index + 1}</td>
                      <td className="p-2 border border-gray-700">{line.lineNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>

  );
}
