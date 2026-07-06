'use client'
import { useState, useEffect } from 'react';
import SidebarNavLayout from '../../../components/SidebarNavLayout';

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
  const [floorLines, setFloorLines] = useState([]);
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
        setFloorLines(prev => [...prev, newFloorLine]);
        setFormData({
          floor: '',
          lineNumber: '',
          supervisor: '',
          operators: [],
          machines: [],
          currentProcess: ''
        });
        setFloorName('');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const errorText = await response.text();
        console.error('Failed to submit form:', errorText);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const groupedByFloor = floorLines.reduce((acc, line) => {
    const name = line.floor?.floorName || 'No Floor';
    if (!acc[name]) acc[name] = [];
    acc[name].push(line);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#a162e8] via-[#8a43d6] to-[#6b21a8] flex justify-center p-6 font-sans">
      <SidebarNavLayout />

      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl p-8 mt-16">
        <h1 className="text-3xl font-bold mb-6 text-[#6b21a8]">
          Add New Floor Line
        </h1>

        {successMessage && (
          <div className="mb-6 p-3 bg-green-600 text-white rounded-md shadow">
            {successMessage}
          </div>
        )}

        {/* FORM (unchanged) */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-[#F9FAFB] p-6 rounded-xl shadow-md mb-10"
        >
          <div>
            <label className="block mb-1 text-[#7e22ce] font-semibold">Floor:</label>
            <select
              name="floor"
              value={formData.floor}
              onChange={handleChange}
              className="w-full p-2 border border-purple-200 rounded-md bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
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
            <label className="block mb-1 text-[#7e22ce] font-semibold">
              Line Number:
            </label>
            <input
              type="text"
              name="lineNumber"
              value={
                floorName
                  ? `${floorName}-${formData.lineNumber}`
                  : formData.lineNumber
              }
              onChange={handleChange}
              className="w-full p-2 border border-purple-200 rounded-md bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
              required
              placeholder="e.g., 101"
            />
          </div>

          <button
            type="submit"
            className="bg-gradient-to-r from-[#7e22ce] to-[#9333ea] text-white font-bold px-6 py-2 rounded-md hover:scale-105 transition-all duration-300 shadow-lg"
          >
            Submit
          </button>
        </form>

        {/* TABLE SECTION - PREMIUM UI UPGRADED */}
        <h2 className="text-2xl font-semibold mb-6 text-[#6b21a8]">
          All Floor Lines (Grouped by Floor)
        </h2>

        {Object.keys(groupedByFloor).length === 0 ? (
          <p className="text-gray-500">No floor lines available</p>
        ) : (
          Object.keys(groupedByFloor).map((floor, i) => (
            <div key={i} className="mb-10">

              <h3 className="text-lg font-bold mb-3 text-white bg-gradient-to-r from-[#7e22ce] to-[#a855f7] px-4 py-2 rounded-md shadow-md inline-block">
                Floor: {floor}
              </h3>

              <div className="rounded-xl overflow-hidden shadow-2xl border border-purple-200 bg-white/80 backdrop-blur-md">
                <table className="w-full text-left text-sm">

                  <thead className="bg-gradient-to-r from-[#6b21a8] to-[#9333ea] text-white uppercase tracking-wider">
                    <tr>
                      <th className="p-4">#</th>
                      <th className="p-4">Line Number</th>
                    </tr>
                  </thead>

                  <tbody>
                    {groupedByFloor[floor].map((line, index) => (
                      <tr
                        key={line._id}
                        className="transition duration-300 hover:bg-purple-100/70 even:bg-white odd:bg-purple-50/40"
                      >
                        <td className="p-4 font-medium text-gray-700 border-b border-purple-100">
                          {index + 1}
                        </td>
                        <td className="p-4 font-semibold text-gray-800 border-b border-purple-100">
                          {line.lineNumber}
                        </td>
                      </tr>
                    ))}
                  </tbody>

                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}