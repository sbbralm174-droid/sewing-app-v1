// app/operator-line-transfer/page.js
'use client';

import { useState, useEffect } from 'react';

export default function OperatorLineTransfer() {
  const [searchData, setSearchData] = useState({
    date: new Date().toISOString().split('T')[0],
    operatorId: ''
  });
  
  const [operatorData, setOperatorData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transferData, setTransferData] = useState({
    newLine: '',
    workingHoursInPreviousLine: '08:00', // Default startup time
    transferredBy: ''
  });
  const [availableLines, setAvailableLines] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isManualTime, setIsManualTime] = useState(false);
  const [floorType, setFloorType] = useState('');
  const [currentTimeDisplay, setCurrentTimeDisplay] = useState('');

  // Floor-wise deduction rules (24-hour format)
  const FLOOR_RULES = {
    'PODDO': { h: 13, m: 30, deduction: 60 },
    'POODO': { h: 13, m: 30, deduction: 60 },
    'SHAPLA': { h: 12, m: 30, deduction: 60 },
    'KODOM': { h: 13, m: 0, deduction: 60 },
    'BELLY': { h: 13, m: 30, deduction: 60 }
  };

  // Clock Update Effect
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeDisplay(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }));
      
      // Auto-sync input time if not in manual mode
      if (!isManualTime && operatorData) {
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        setTransferData(prev => ({ ...prev, workingHoursInPreviousLine: `${hh}:${mm}` }));
      }
    };
    
    updateTime();
    const interval = setInterval(updateTime, 30000); // Sync every 30s
    return () => clearInterval(interval);
  }, [isManualTime, operatorData]);

  // Fetch Lines on Date change
  useEffect(() => {
    if (searchData.date) fetchAvailableLines();
  }, [searchData.date]);

  // Detect Floor
  useEffect(() => {
    if (operatorData?.currentLine) {
      const line = operatorData.currentLine.toUpperCase();
      const floor = Object.keys(FLOOR_RULES).find(f => line.includes(f));
      setFloorType(floor || '');
    }
  }, [operatorData]);

  const fetchAvailableLines = async () => {
    try {
      const res = await fetch(`/api/operator-line-transfer/lines?date=${searchData.date}`);
      const result = await res.json();
      if (result.success) setAvailableLines(result.data);
    } catch (error) { console.error('Error fetching lines:', error); }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch(`/api/operator-line-transfer/search?date=${searchData.date}&operatorId=${searchData.operatorId}`);
      const result = await res.json();
      if (result.success) {
        setOperatorData(result.data);
        setIsManualTime(false);
      } else {
        setMessage({ type: 'error', text: result.message });
        setOperatorData(null);
      }
    } catch (error) { setMessage({ type: 'error', text: 'Search failed' }); }
    finally { setLoading(false); }
  };

  // Helper: Calculate Final Minutes for Database
  const calculateFinalMinutes = (timeValue) => {
    const [h, m] = timeValue.split(':').map(Number);
    let totalMinsFrom8AM = (h - 8) * 60 + m;

    if (floorType && FLOOR_RULES[floorType]) {
      const rule = FLOOR_RULES[floorType];
      const currentTotalMins = h * 60 + m;
      const ruleStartMins = rule.h * 60 + rule.m;

      if (currentTotalMins > ruleStartMins) {
        totalMinsFrom8AM -= rule.deduction;
      }
    }
    return Math.max(0, totalMinsFrom8AM);
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    const finalMinutes = calculateFinalMinutes(transferData.workingHoursInPreviousLine);
    
    setLoading(true);
    try {
      const res = await fetch('/api/operator-line-transfer/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operatorId: searchData.operatorId,
          date: searchData.date,
          newLine: transferData.newLine,
          workingHoursInPreviousLine: finalMinutes, 
          transferredBy: transferData.transferredBy
        })
      });
      const result = await res.json();
      if (result.success) {
        setMessage({ type: 'success', text: 'Transfer completed successfully!' });
        setOperatorData(null);
        setSearchData(p => ({ ...p, operatorId: '' }));
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) { setMessage({ type: 'error', text: 'Transfer error' }); }
    finally { setLoading(false); }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">Operator Line Transfer</h1>

      {/* Modern System Time Badge */}
      <div className="mb-6 p-4 bg-blue-600 rounded-xl text-white flex justify-between items-center shadow-md">
        <div>
          <p className="text-xs opacity-75 uppercase font-bold tracking-wider">System Time</p>
          <p className="text-2xl font-mono font-bold">{currentTimeDisplay}</p>
        </div>
        <div className="text-right">
          <p className="text-xs opacity-75">Base Time</p>
          <p className="text-lg font-semibold">08:00 AM</p>
        </div>
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-lg font-medium shadow-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Search Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Date</label>
            <input type="date" value={searchData.date} onChange={e => setSearchData(p => ({ ...p, date: e.target.value }))} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Operator ID</label>
            <input type="text" value={searchData.operatorId} onChange={e => setSearchData(p => ({ ...p, operatorId: e.target.value }))} placeholder="Ex: 10234" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-2 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50">
            {loading ? 'Searching...' : 'Find Operator'}
          </button>
        </form>
      </div>

      {/* Transfer Details Form */}
      {operatorData && (
        <div className="bg-white p-6 rounded-xl shadow-xl border border-blue-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-start mb-6 border-b pb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">{operatorData.operator.name}</h2>
              <p className="text-sm text-blue-600 font-medium">Currently at: {operatorData.currentLine}</p>
            </div>
            {floorType && <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{floorType} FLOOR</span>}
          </div>

          <form onSubmit={handleTransfer} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* New Line Select */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Transfer to Line *</label>
                <select 
                  value={transferData.newLine} 
                  onChange={e => setTransferData(p => ({ ...p, newLine: e.target.value }))}
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500" required
                >
                  <option value="">Select Target Line</option>
                  {availableLines.filter(l => l !== operatorData.currentLine).map((l, i) => (
                    <option key={i} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              {/* User-Friendly Time Picker */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex justify-between">
                  Transfer Time *
                  <button 
                    type="button" 
                    onClick={() => setIsManualTime(!isManualTime)}
                    className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${isManualTime ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'}`}
                  >
                    {isManualTime ? 'Mode: Manual' : 'Mode: Auto'}
                  </button>
                </label>
                <input 
                  type="time" 
                  value={transferData.workingHoursInPreviousLine} 
                  onChange={e => setTransferData(p => ({ ...p, workingHoursInPreviousLine: e.target.value }))}
                  disabled={!isManualTime}
                  className={`w-full p-2 border rounded-lg text-lg font-mono text-center ${!isManualTime ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white border-blue-300 ring-4 ring-blue-50'}`}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Transferred By</label>
              <input type="text" value={transferData.transferredBy} onChange={e => setTransferData(p => ({ ...p, transferredBy: e.target.value }))} placeholder="Transferred By" className="w-full p-2 border rounded-lg" />
            </div>

            {/* Hint Box */}
            <div className="bg-gray-50 p-3 rounded-lg border border-dashed border-gray-300">
              <p className="text-[11px] text-gray-600 leading-relaxed">
                ℹ️ <strong>System Note:</strong> The duration will be calculated from 08:00 AM to selected time. 
                {floorType && ` On ${floorType} floor, 60 minutes lunch break will be auto-deducted if transfer happens after ${FLOOR_RULES[floorType].h}:${FLOOR_RULES[floorType].m}.`}
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => setOperatorData(null)} className="flex-1 py-3 text-gray-500 font-bold hover:text-gray-700">Cancel</button>
              <button type="submit" disabled={loading} className="flex-[2] py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-100 transition disabled:opacity-50">
                {loading ? 'Processing...' : 'Confirm Transfer'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}