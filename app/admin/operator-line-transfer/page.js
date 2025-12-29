// app/operator-line-transfer/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OperatorLineTransfer() {
  const router = useRouter();
  const [searchData, setSearchData] = useState({
    date: new Date().toISOString().split('T')[0],
    operatorId: ''
  });
  
  const [operatorData, setOperatorData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transferData, setTransferData] = useState({
    newLine: '',
    workingHoursInPreviousLine: '00:00 AM',
    transferredBy: ''
  });
  const [availableLines, setAvailableLines] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isManualTime, setIsManualTime] = useState(false);
  const [floorType, setFloorType] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  // Floor-wise deduction rules (in minutes)
  const FLOOR_RULES = {
    'PODDO': { hour: 1, minute: 30, period: 'PM', deduction: 60 },
    'POODO': { hour: 1, minute: 30, period: 'PM', deduction: 60 },
    'SHAPLA': { hour: 12, minute: 30, period: 'PM', deduction: 60 },
    'KODOM': { hour: 1, minute: 0, period: 'PM', deduction: 60 },
    'BELLY': { hour: 1, minute: 30, period: 'PM', deduction: 60 }
  };

  // Update current time every minute
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      
      // Convert to 12-hour format
      hours = hours % 12 || 12;
      
      setCurrentTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  // Available lines fetch
  useEffect(() => {
    if (searchData.date) {
      fetchAvailableLines();
    }
  }, [searchData.date]);

  // Detect floor type from line name
  useEffect(() => {
    if (operatorData?.currentLine) {
      const line = operatorData.currentLine.toUpperCase();
      if (line.includes('PODDO')) setFloorType('PODDO');
      else if (line.includes('POODO')) setFloorType('POODO');
      else if (line.includes('SHAPLA')) setFloorType('SHAPLA');
      else if (line.includes('KODOM')) setFloorType('KODOM');
      else if (line.includes('BELLY')) setFloorType('BELLY');
      else setFloorType('');
    }
  }, [operatorData]);

  // Auto calculate working hours when operator data is loaded
  useEffect(() => {
    if (operatorData && !isManualTime) {
      calculateAutoWorkingHours();
    }
  }, [operatorData, floorType, isManualTime, currentTime]);

  const fetchAvailableLines = async () => {
    try {
      const response = await fetch(
        `/api/operator-line-transfer/lines?date=${searchData.date}`
      );
      const result = await response.json();
      
      if (result.success) {
        setAvailableLines(result.data);
      }
    } catch (error) {
      console.error('Error fetching lines:', error);
    }
  };

  // Function to convert minutes to HH:MM AM/PM format
  const minutesToTimeFormat = (minutes) => {
    // Calculate total hours and minutes from 8:00 AM
    const totalHours = 8 + Math.floor(minutes / 60);
    const totalMinutes = minutes % 60;
    
    // Convert to 12-hour format with AM/PM
    let displayHours = totalHours % 12 || 12;
    const period = totalHours >= 12 ? (totalHours >= 24 ? 'AM' : 'PM') : 'AM';
    
    // If totalHours is 24 or more, adjust period
    const adjustedPeriod = totalHours >= 24 ? 'AM' : period;
    
    return `${displayHours.toString().padStart(2, '0')}:${totalMinutes.toString().padStart(2, '0')} ${adjustedPeriod}`;
  };

  // Function to convert time string to minutes from 8:00 AM
  const timeToMinutesFrom8AM = (timeStr) => {
    if (!timeStr) return 0;
    
    try {
      const [time, period] = timeStr.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      
      // Convert to 24-hour format
      let hour24 = hours;
      if (period === 'PM' && hours !== 12) {
        hour24 += 12;
      } else if (period === 'AM' && hours === 12) {
        hour24 = 0;
      }
      
      // Calculate minutes from 8:00 AM
      const totalMinutes = (hour24 - 8) * 60 + minutes;
      return Math.max(0, totalMinutes);
    } catch (error) {
      return 0;
    }
  };

  // Function to convert minutes to HH:MM (for database)
  const minutesToHHMM = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // Function to validate and format time input with AM/PM
  const validateTimeInput = (value) => {
    // Remove non-numeric characters except colon and AM/PM
    let cleaned = value.replace(/[^\d:APMapm\s]/g, '');
    
    // Auto-insert colon after 2 digits if no colon present
    if (cleaned.length > 2 && !cleaned.includes(':')) {
      cleaned = cleaned.slice(0, 2) + ':' + cleaned.slice(2);
    }
    
    // Auto-detect AM/PM
    let hasPeriod = false;
    let period = '';
    
    if (cleaned.toUpperCase().includes('AM')) {
      period = 'AM';
      hasPeriod = true;
      cleaned = cleaned.replace(/am/gi, '').trim();
    } else if (cleaned.toUpperCase().includes('PM')) {
      period = 'PM';
      hasPeriod = true;
      cleaned = cleaned.replace(/pm/gi, '').trim();
    }
    
    // Limit to HH:MM format (without period)
    if (cleaned.length > 5) {
      cleaned = cleaned.slice(0, 5);
    }
    
    // Add period back if it was present
    if (hasPeriod) {
      return `${cleaned} ${period}`;
    }
    
    return cleaned;
  };

  // Function to format time with AM/PM
  const formatTimeWithPeriod = (timeStr) => {
    if (!timeStr || timeStr === '00:00') return '12:00 AM';
    
    const [time, period] = timeStr.includes(' ') ? timeStr.split(' ') : [timeStr, ''];
    const [hours, minutes] = time.split(':').map(Number);
    
    if (period) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period.toUpperCase()}`;
    }
    
    // If no period, determine based on hours
    let displayHours = hours;
    let periodType = 'AM';
    
    if (hours >= 12) {
      periodType = hours >= 24 ? 'AM' : 'PM';
      displayHours = hours % 12 || 12;
    }
    
    return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${periodType}`;
  };

  // Function to calculate automatic working hours based on current time
  const calculateAutoWorkingHours = () => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // ১. মোট মিনিট বের করা (৮টা থেকে বর্তমান সময় পর্যন্ত)
  let totalMinutes = (currentHour - 8) * 60 + currentMinute;

  // ২. ডিডাকশন চেক করা
  if (floorType && FLOOR_RULES[floorType]) {
    const rule = FLOOR_RULES[floorType];
    
    // রুল টাইমকে ২৪ ঘণ্টার ফরম্যাটে নেয়া
    let ruleHour24 = rule.hour;
    if (rule.period === 'PM' && rule.hour !== 12) ruleHour24 += 12;
    if (rule.period === 'AM' && rule.hour === 12) ruleHour24 = 0;

    const ruleStartTotalMinutes = ruleHour24 * 60 + rule.minute;
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    // যদি বর্তমান সময় রুল সময়ের চেয়ে বেশি হয়
    if (currentTotalMinutes > ruleStartTotalMinutes) {
      totalMinutes -= rule.deduction; // এখানে ৬০ মিনিট বিয়োগ হবে
    }
  }

  totalMinutes = Math.max(0, totalMinutes);
  
  // ৩. আপডেট করা
  const calculatedTime = minutesToTimeFormat(totalMinutes);
  setTransferData(prev => ({
    ...prev,
    workingHoursInPreviousLine: calculatedTime
  }));
};

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    setFloorType('');
    setIsManualTime(false);
    
    try {
      const response = await fetch(
        `/api/operator-line-transfer/search?date=${searchData.date}&operatorId=${searchData.operatorId}`
      );
      const result = await response.json();
      
      if (result.success) {
        setOperatorData(result.data);
        // Reset to auto calculation when new operator is searched
        setIsManualTime(false);
      } else {
        setMessage({ type: 'error', text: result.message });
        setOperatorData(null);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error searching operator data' });
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    
    if (!operatorData || !transferData.newLine) {
      setMessage({ type: 'error', text: 'Please fill all required fields' });
      return;
    }
    
    // ১. ইউজার স্ক্রিনে যে সময়টি দেখছে (Auto/Manual) তাকে প্রাথমিক মিনিটে রূপান্তর করা
    let workingHoursInMinutes = timeToMinutesFrom8AM(transferData.workingHoursInPreviousLine);
    
    /**
     * গুরুত্বপূর্ণ: যদি ইউজার ম্যানুয়ালি সময় ইনপুট দেয়, তবে আমাদের চেক করতে হবে 
     * সেই ইনপুট করা সময়টি কি ফ্লোর ডিডাকশন রুলসের (যেমন: ১:৩০ PM) পরে কি না।
     */
    if (isManualTime && floorType && FLOOR_RULES[floorType]) {
      const rule = FLOOR_RULES[floorType];
      
      try {
        // ম্যানুয়াল ইনপুট থেকে ঘণ্টা ও মিনিট বের করা
        const [timePart, period] = transferData.workingHoursInPreviousLine.split(' ');
        const [hours, minutes] = timePart.split(':').map(Number);
        
        // ২৪ ঘণ্টা ফরম্যাটে রূপান্তর (তুলনার সুবিধার জন্য)
        let manualHour24 = hours;
        if (period === 'PM' && hours !== 12) manualHour24 += 12;
        else if (period === 'AM' && hours === 12) manualHour24 = 0;
        
        const manualTotalMinutesFromMidnight = manualHour24 * 60 + minutes;

        // ডিডাকশন রুলের সময়কে ২৪ ঘণ্টা ফরম্যাটে রূপান্তর
        let ruleHour24 = rule.hour;
        if (rule.period === 'PM' && rule.hour !== 12) ruleHour24 += 12;
        else if (rule.period === 'AM' && rule.hour === 12) ruleHour24 = 0;
        
        const ruleStartTotalMinutesFromMidnight = ruleHour24 * 60 + rule.minute;

        // চেক: ম্যানুয়াল ইনপুট কি রুল টাইমের বেশি? 
        // যদি বেশি হয় এবং অলরেডি বিয়োগ করা না থাকে (নিরাপত্তার জন্য)
        if (manualTotalMinutesFromMidnight > ruleStartTotalMinutesFromMidnight) {
          // ৬০ মিনিট বিয়োগ করা হচ্ছে
          workingHoursInMinutes -= rule.deduction;
          console.log(`Manual deduction of ${rule.deduction} mins applied for ${floorType}`);
        }
      } catch (err) {
        console.error("Error parsing manual time for deduction:", err);
      }
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/operator-line-transfer/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operatorId: searchData.operatorId,
          date: searchData.date,
          newLine: transferData.newLine,
          // চূড়ান্ত মিনিট (বিয়োগফলসহ) পাঠানো হচ্ছে
          workingHoursInPreviousLine: Math.max(0, workingHoursInMinutes), 
          transferredBy: transferData.transferredBy
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Operator line transfer completed successfully!' });
        // রিসেট অল ডাটা
        setOperatorData(null);
        setSearchData(prev => ({ ...prev, operatorId: '' }));
        setTransferData({
          newLine: '',
          workingHoursInPreviousLine: '00:00 AM',
          transferredBy: ''
        });
        setFloorType('');
        setIsManualTime(false);
        fetchAvailableLines();
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error during transfer' });
    } finally {
      setLoading(false);
    }
  };

  // Function to handle manual time toggle
  const toggleManualTime = () => {
    if (isManualTime) {
      // Switching back to auto, recalculate
      setIsManualTime(false);
      calculateAutoWorkingHours();
    } else {
      // Switching to manual, keep current value
      setIsManualTime(true);
    }
  };

  // Function to handle time input change
  const handleTimeChange = (value) => {
    const formatted = validateTimeInput(value);
    setTransferData(prev => ({
      ...prev,
      workingHoursInPreviousLine: formatTimeWithPeriod(formatted)
    }));
  };

  // Function to handle blur - auto-format on blur
  const handleTimeBlur = () => {
    const formatted = formatTimeWithPeriod(transferData.workingHoursInPreviousLine);
    setTransferData(prev => ({
      ...prev,
      workingHoursInPreviousLine: formatted
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">
        Operator Line Transfer System
      </h1>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-blue-600">Current System Time</p>
            <p className="text-2xl font-bold text-blue-800">{currentTime}</p>
          </div>
          <div className="text-sm text-blue-700">
            Calculations start from 8:00 AM
          </div>
        </div>
      </div>
      
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}
      
      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          Search Operator
        </h2>
        
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={searchData.date}
                onChange={(e) => setSearchData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operator ID *
              </label>
              <input
                type="text"
                value={searchData.operatorId}
                onChange={(e) => setSearchData(prev => ({ ...prev, operatorId: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter operator ID"
                required
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching...' : 'Search Operator'}
          </button>
        </form>
      </div>
      
      {/* Operator Details Section */}
      {operatorData && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Operator Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Operator Name</p>
              <p className="text-lg font-medium">{operatorData.operator.name}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Current Line</p>
              <p className="text-lg font-medium">{operatorData.currentLine}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Operator ID</p>
              <p className="text-lg font-medium">{operatorData.operator.operatorId}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Detected Floor</p>
              <p className="text-lg font-medium">{floorType || 'N/A'}</p>
            </div>
          </div>
          
          {/* Transfer Form */}
          <form onSubmit={handleTransfer} className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-700">
              Transfer Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Line *
                </label>
                <select
                  value={transferData.newLine}
                  onChange={(e) => setTransferData(prev => ({ ...prev, newLine: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select new line</option>
                  {availableLines
                    .filter(line => line !== operatorData.currentLine)
                    .map((line, index) => (
                      <option key={index} value={line}>
                        {line}
                      </option>
                    ))
                  }
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Working Hours in Previous Line *
                  <span className="ml-2 text-xs text-gray-500">
                    (Time reached from 8:00 AM)
                  </span>
                </label>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={transferData.workingHoursInPreviousLine}
                      onChange={(e) => handleTimeChange(e.target.value)}
                      onBlur={handleTimeBlur}
                      placeholder="HH:MM AM/PM"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg font-mono"
                      disabled={!isManualTime}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={toggleManualTime}
                    className={`px-4 py-2 rounded-lg ${isManualTime ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'}`}
                  >
                    {isManualTime ? 'Manual' : 'Auto'}
                  </button>
                  <button
                    type="button"
                    onClick={calculateAutoWorkingHours}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    title="Recalculate based on current time"
                  >
                    ↻
                  </button>
                </div>
                <div className="mt-2 text-sm">
                  {isManualTime ? (
                    <span className="text-yellow-600">Manual mode: Enter time (e.g., 01:49 PM)</span>
                  ) : (
                    <span className="text-green-600">
                      Auto-calculated: From 8:00 AM to now {floorType && FLOOR_RULES[floorType] ? `(${floorType} floor rules applied)` : ''}
                    </span>
                  )}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Format: HH:MM AM/PM (e.g., 01:49 PM or 09:00 AM)
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  Database value: {timeToMinutesFrom8AM(transferData.workingHoursInPreviousLine)} minutes
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transferred By
                </label>
                <input
                  type="text"
                  value={transferData.transferredBy}
                  onChange={(e) => setTransferData(prev => ({ ...prev, transferredBy: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your name"
                />
              </div>
            </div>
            
            {/* Floor Rules Information */}
            {floorType && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Floor Rules Applied:</h4>
                <p className="text-sm text-blue-700">
                  {floorType} floor: After {FLOOR_RULES[floorType].hour.toString().padStart(2, '0')}:{FLOOR_RULES[floorType].minute.toString().padStart(2, '0')} {FLOOR_RULES[floorType].period}, {FLOOR_RULES[floorType].deduction} minutes are deducted
                </p>
              </div>
            )}
            
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setOperatorData(null);
                  setTransferData({
                    newLine: '',
                    workingHoursInPreviousLine: '00:00 AM',
                    transferredBy: ''
                  });
                  setFloorType('');
                  setIsManualTime(false);
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing Transfer...' : 'Confirm Line Transfer'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}