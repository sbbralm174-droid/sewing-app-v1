"use client";

import { useState, useEffect } from 'react';

// UI component for the Next.js App Router
export default function Home() {
    const [date, setDate] = useState('');
    const [floor, setFloor] = useState('');
    const [floorLine, setFloorLine] = useState('');
    const [totalHour, setTotalHour] = useState('');
    const [message, setMessage] = useState('');
    const [dailyData, setDailyData] = useState([]);
    const [floors, setFloors] = useState([]);
    const [floorLines, setFloorLines] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch daily data and floor/line data from the API
    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetching floor and line data
            const floorLineRes = await fetch('/api/floor-lines');
            if (!floorLineRes.ok) throw new Error('Failed to fetch floor/line data');
            const floorLineData = await floorLineRes.json();
            setFloorLines(floorLineData);

            // Extracting unique floors and filtering out null values
            const uniqueFloors = Array.from(new Map(floorLineData.map(line => [line.floor?._id, line.floor])).values());
            setFloors(uniqueFloors.filter(f => f));

            // Fetching today's data
            const dailyDataRes = await fetch('/api/date-floorline-hours');
            if (!dailyDataRes.ok) {
                // Logging detailed error for debugging
                console.error("Failed to fetch daily data, server response:", dailyDataRes.status, dailyDataRes.statusText);
                throw new Error('Failed to fetch daily data');
            }
            const dailyData = await dailyDataRes.json();
            setDailyData(dailyData);

        } catch (error) {
            console.error(error);
            setMessage('Failed to load data.');
        } finally {
            setLoading(false);
        }
    };

    // Handler for form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('Saving data...');
        try {
            const res = await fetch('/api/date-floorline-hours', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date, floor, floorLine, totalHour: Number(totalHour) }),
            });
            if (!res.ok) throw new Error('Failed to save data');
            setMessage('Data saved successfully!');
            
            // Update the table after successful save
            fetchData();

            // Reset the form
            setDate(new Date().toISOString().split('T')[0]);
            setFloor('');
            setFloorLine('');
            setTotalHour('');

        } catch (error) {
            console.error(error);
            setMessage('Error: ' + error.message);
        }
    };
    
    // Fetch data on component load and when dependencies change
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        setDate(today);
        fetchData();
    }, []);

    const filteredLines = floorLines.filter(line => line.floor && line.floor._id === floor);

    if (loading) {
      return (
        <div className="bg-gray-100 min-h-screen flex items-center justify-center">
            <p className="text-gray-600">Loading data...</p>
        </div>
      );
    }

    return (
        <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl w-full">
                <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Floorline Hours Tracker</h1>

                {/* Data Input Form */}
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="col-span-1">
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
                        <input
                            type="date"
                            id="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                        />
                    </div>
                    <div className="col-span-1">
                        <label htmlFor="floor" className="block text-sm font-medium text-gray-700">Floor</label>
                        <select
                            id="floor"
                            value={floor}
                            onChange={(e) => { setFloor(e.target.value); setFloorLine(''); }}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                        >
                            <option value="" disabled>Select a floor</option>
                            {floors.map((f) => (
                                <option key={f._id} value={f._id}>{f.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-span-1">
                        <label htmlFor="floorLine" className="block text-sm font-medium text-gray-700">Line</label>
                        <select
                            id="floorLine"
                            value={floorLine}
                            onChange={(e) => setFloorLine(e.target.value)}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                        >
                            <option value="" disabled>Select a line</option>
                            {filteredLines.map((l) => (
                                <option key={l._id} value={l._id}>{l.lineNumber}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-span-1">
                        <label htmlFor="totalHour" className="block text-sm font-medium text-gray-700">Total Hours</label>
                        <input
                            type="number"
                            id="totalHour"
                            value={totalHour}
                            onChange={(e) => setTotalHour(e.target.value)}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                        />
                    </div>
                    <button type="submit" className="col-span-full md:col-span-2 lg:col-span-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out">
                        Save Data
                    </button>
                </form>

                {/* Message Display Area */}
                {message && (
                    <div className={`text-center mb-4 font-semibold ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                        {message}
                    </div>
                )}
                
                <hr className="my-6 border-gray-300" />

                {/* Today's Data Table */}
                <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">Today's Data</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Floor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Line</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hours</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {dailyData.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center py-4 text-gray-500">No data for today.</td>
                                </tr>
                            ) : (
                                dailyData.map(item => {
                                    const floorName = floors.find(f => f._id === (item.floor?._id || item.floor))?.name;
                                    const floorLineNumber = floorLines.find(l => l._id === (item.floorLine?._id || item.floorLine))?.lineNumber;

                                    return (
                                        <tr key={item._id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {new Date(item.date).toLocaleDateString('bn-BD')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {floorName || `Unknown Floor (ID: ${item.floor})`}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {floorLineNumber || `Unknown Line (ID: ${item.floorLine})`}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {item.totalHour}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
