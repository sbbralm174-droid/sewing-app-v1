'use client'

import React, { useState } from 'react';

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

  // নতুন ফাংশন যা ফ্লোর অনুযায়ী টাইম স্লট লোড করবে
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
      // API ব্যর্থ হলে একটি ডিফল্ট তালিকা ব্যবহার করা হচ্ছে
      setTimeSlots(['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM']);
    }
  };

  // দৈনিক রিপোর্ট খোঁজার জন্য ফাংশন
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
    setTimeSlots([]); // নতুন সার্চের সময় টাইম স্লটগুলো খালি করা হচ্ছে

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
          // ডেটাবেস থেকে productionCount মান ব্যবহার করা হচ্ছে
          const currentData = (report.hourlyProduction || []).reduce((acc, item) => {
            acc[item.hour] = parseInt(item.productionCount, 10) || 0; 
            return acc;
          }, {});
          initialHourlyData[report._id] = currentData;
        });
        setHourlyData(initialHourlyData);
        
        // দৈনিক রিপোর্ট সফলভাবে লোড হওয়ার পর নির্দিষ্ট ফ্লোরের জন্য টাইম স্লট লোড করা হচ্ছে
        fetchTimeSlotsByFloor(floor);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('খোঁজার সময় একটি ত্রুটি হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  // Hourly ডেটা পরিবর্তনের জন্য ফাংশন
  const handleHourlyChange = (reportId, hour, value) => {
    setHourlyData(prev => ({
      ...prev,
      [reportId]: {
        ...prev[reportId],
        [hour]: value,
      },
    }));
  };

  // Hourly রিপোর্ট জমা দেওয়ার জন্য ফাংশন
  const handleHourlySubmit = async (reportId) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const dataToSubmit = timeSlots.map(hour => ({
        hour: hour,
        // ইনপুট থেকে পাওয়া মানকে productionCount হিসেবে পাঠানো হচ্ছে
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
            <input
              type="text"
              placeholder="ফ্লোর (যেমন: A)"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              className="bg-gray-700 text-gray-200 border-none rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
              type="text"
              placeholder="লাইন (যেমন: Line-1)"
              value={line}
              onChange={(e) => setLine(e.target.value)}
              className="bg-gray-700 text-gray-200 border-none rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              type="submit"
              className="md:col-span-3 bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-300 transform hover:scale-105 disabled:bg-gray-500"
              disabled={loading}
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-600">
                  {searchResults.map((report) => (
                    <tr key={report._id} className="hover:bg-gray-600 transition-colors">
                      <td className="py-3 px-4">{report.operator.operatorId}</td>
                      <td className="py-3 px-4">{report.operator.name}</td>
                      <td className="py-3 px-4">{report.uniqueMachine}</td>
                      <td className="py-3 px-4">{report.target}</td>
                      <td className="py-3 px-4">{
                        (report.hourlyProduction || []).reduce((sum, h) => sum + (parseInt(h.productionCount, 10) || 0), 0)
                      }</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8">
              <h2 className="text-3xl font-semibold text-blue-400 mb-6 text-center">Hourly প্রোডাকশন রিপোর্ট</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((report) => (
                  <div key={report._id} className="bg-gray-700 rounded-lg p-6 shadow-md">
                    <h3 className="text-xl font-bold text-gray-200 mb-4">{report.operator.name} ({report.uniqueMachine})</h3>
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
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
