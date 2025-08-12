'use client'

import React, { useState, useEffect } from 'react';

const App = () => {
  const [date, setDate] = useState('');
  const [floor, setFloor] = useState('');
  const [line, setLine] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [hourlyData, setHourlyData] = useState({});
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [expandedOperator, setExpandedOperator] = useState(null);
  const [floorLines, setFloorLines] = useState([]);
  const [filteredLines, setFilteredLines] = useState([]);

  // Fetch floor and line data on component mount
  useEffect(() => {
    const fetchFloorLines = async () => {
      try {
        const response = await fetch('/api/floor-lines');
        if (!response.ok) {
          throw new Error('Failed to fetch floor and line data');
        }
        const data = await response.json();
        setFloorLines(data);
      } catch (err) {
        console.error('Error fetching floor lines:', err);
        setError('Failed to load floor and line data');
      }
    };
    fetchFloorLines();
  }, []);

  // Filter lines when floor changes
  useEffect(() => {
    if (floor) {
      const linesForFloor = floorLines
        .filter(item => item.floor?.floorName === floor)
        .map(item => item.lineNumber);
      setFilteredLines(linesForFloor);
      setLine(''); // Reset line when floor changes
    } else {
      setFilteredLines([]);
      setLine('');
    }
  }, [floor, floorLines]);

  const fetchTimeSlotsByFloor = async (selectedFloor) => {
    try {
      const response = await fetch(`/api/hours?floor=${selectedFloor}`);
      if (!response.ok) {
        throw new Error('সময় স্লট আনতে ব্যর্থ হয়েছে');
      }
      const data = await response.json();
      const slots = data.map(report => report.hour);
      setTimeSlots(slots);
    } catch (err) {
      console.error(err.message);
      setError('সময় স্লট লোড করা যায়নি।');
      setTimeSlots(['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM']);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!date || !floor || !line) {
      setError('অনুগ্রহ করে তারিখ, ফ্লোর এবং লাইন পূরণ করুন।');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    setSearchResults([]);
    setHourlyData({});
    setTimeSlots([]);
    setExpandedOperator(null);

    try {
      const response = await fetch(`/api/daily-production/search?date=${date}&floor=${floor}&line=${line}`);
      if (!response.ok) {
        throw new Error('খোঁজা ডেটা আনতে ব্যর্থ হয়েছে');
      }
      const results = await response.json();

      if (results.length === 0) {
        setError('এই শর্তে কোনো ডেটা পাওয়া যায়নি।');
      } else {
        setSearchResults(results);
        const initialHourlyData = {};
        results.forEach(report => {
          const currentData = (report.hourlyProduction || []).reduce((acc, item) => {
            acc[item.hour] = parseInt(item.productionCount, 10) || 0; 
            return acc;
          }, {});
          initialHourlyData[report._id] = currentData;
        });
        setHourlyData(initialHourlyData);
        fetchTimeSlotsByFloor(floor);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('খোঁজার সময় একটি ত্রুটি হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const handleHourlyChange = (reportId, hour, value) => {
    setHourlyData(prev => ({
      ...prev,
      [reportId]: {
        ...prev[reportId],
        [hour]: value,
      },
    }));
  };

  const handleHourlySubmit = async (reportId) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const dataToSubmit = timeSlots.map(hour => ({
        hour: hour,
        productionCount: parseInt(hourlyData[reportId]?.[hour], 10) || 0,
      }));

      const response = await fetch('/api/daily-production/update-hourly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: reportId, hourlyProduction: dataToSubmit }),
      });

      if (!response.ok) {
        throw new Error('রিপোর্ট জমা দিতে ব্যর্থ হয়েছে');
      }

      setSuccess('Hourly রিপোর্ট সফলভাবে সেভ করা হয়েছে!');
      setSearchResults(prevResults => prevResults.map(report =>
        report._id === reportId
          ? { ...report, hourlyProduction: dataToSubmit }
          : report
      ));

    } catch (err) {
      console.error('Submission error:', err);
      setError('রিপোর্ট সেভ করার সময় একটি ত্রুটি হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const toggleOperatorForm = (operatorId) => {
    setExpandedOperator(expandedOperator === operatorId ? null : operatorId);
  };

  // Get unique floor names
  const uniqueFloors = [...new Set(floorLines.map(item => item.floor?.floorName).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8 font-sans">
      <div className="container mx-auto max-w-7xl">
        <div className="bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
          <h1 className="text-4xl font-bold text-center text-blue-400 mb-2">প্রোডাকশন ম্যানেজমেন্ট সিস্টেম</h1>
          <p className="text-center text-gray-400 mb-6">দৈনিক রিপোর্ট খুঁজতে এবং hourly ডেটা জমা দিতে বিবরণ লিখুন।</p>
          
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-gray-700 text-gray-200 border-none rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            
            <select
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              className="bg-gray-700 text-gray-200 border-none rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            >
              <option value="">ফ্লোর নির্বাচন করুন</option>
              {uniqueFloors.map((floorName) => (
                <option key={floorName} value={floorName}>
                  {floorName}
                </option>
              ))}
            </select>
            
            <select
              value={line}
              onChange={(e) => setLine(e.target.value)}
              className="bg-gray-700 text-gray-200 border-none rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
              required
              disabled={!floor}
            >
              <option value="">লাইন নির্বাচন করুন</option>
              {filteredLines.map((lineNumber) => (
                <option key={lineNumber} value={lineNumber}>
                  {lineNumber}
                </option>
              ))}
            </select>
            
            <button
              type="submit"
              className="md:col-span-3 bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-300 transform hover:scale-105 disabled:bg-gray-500"
              disabled={loading || !date || !floor || !line}
            >
              {loading ? 'খোঁজা হচ্ছে...' : 'দৈনিক রিপোর্ট খুঁজুন'}
            </button>
          </form>

          {error && <div className="bg-red-500 text-white p-4 rounded-lg text-center mb-6">{error}</div>}
          {success && <div className="bg-green-500 text-white p-4 rounded-lg text-center mb-6">{success}</div>}
        </div>

        {searchResults.length > 0 && timeSlots.length > 0 && (
          <div className="bg-gray-800 rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-semibold text-blue-400 mb-6">খোঁজার ফলাফল</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-gray-700 rounded-lg overflow-hidden">
                <thead className="bg-gray-600 text-gray-200">
                  <tr>
                    <th className="py-3 px-4 text-left">অপারেটর আইডি</th>
                    <th className="py-3 px-4 text-left">অপারেটরের নাম</th>
                    <th className="py-3 px-4 text-left">ইউনিক মেশিন</th>
                    <th className="py-3 px-4 text-left">টার্গেট</th>
                    <th className="py-3 px-4 text-left">মোট প্রোডাকশন</th>
                    <th className="py-3 px-4 text-left">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-600">
                  {searchResults.map((report) => (
                    <React.Fragment key={report._id}>
                      <tr className="hover:bg-gray-600 transition-colors">
                        <td className="py-3 px-4">{report.operator.operatorId}</td>
                        <td className="py-3 px-4">{report.operator.name}</td>
                        <td className="py-3 px-4">{report.uniqueMachine}</td>
                        <td className="py-3 px-4">{report.target}</td>
                        <td className="py-3 px-4">{
                          (report.hourlyProduction || []).reduce((sum, h) => sum + (parseInt(h.productionCount, 10) || 0), 0)
                        }</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => toggleOperatorForm(report._id)}
                            className="bg-green-600 text-white font-bold py-1 px-3 rounded-lg hover:bg-green-700 transition duration-300 text-sm"
                          >
                            {expandedOperator === report._id ? 'ফর্ম লুকান' : 'Hourly প্রোডাকশন যোগ করুন'}
                          </button>
                        </td>
                      </tr>
                      {expandedOperator === report._id && (
                        <tr>
                          <td colSpan="6" className="p-4 bg-gray-700">
                            <div className="mt-4">
                              <h3 className="text-xl font-bold text-blue-400 mb-4 text-center">{report.operator.name} এর Hourly প্রোডাকশন রিপোর্ট</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="bg-gray-600 rounded-lg p-6 shadow-md">
                                  <div className="space-y-4">
                                    {timeSlots.map(hour => (
                                      <div key={hour} className="flex items-center space-x-2">
                                        <label className="text-gray-300 w-24 flex-shrink-0">{hour}</label>
                                        <input
                                          type="number"
                                          value={hourlyData[report._id]?.[hour] || ''}
                                          onChange={(e) => handleHourlyChange(report._id, hour, e.target.value)}
                                          className="bg-gray-800 text-gray-100 border border-gray-600 rounded-md p-2 w-full focus:ring-2 focus:ring-blue-500 outline-none"
                                          placeholder="0"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                  <button
                                    onClick={() => handleHourlySubmit(report._id)}
                                    className="mt-6 w-full bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition duration-300 disabled:bg-gray-500"
                                    disabled={loading}
                                  >
                                    {loading ? 'সেভ করা হচ্ছে...' : 'Hourly রিপোর্ট সেভ করুন'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;