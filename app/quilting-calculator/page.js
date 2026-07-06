"use client";

import React, { useState, useMemo } from 'react';

export default function ProductionPlannerJS() {
  const [target, setTarget] = useState(200);
  const [totalMachines, setTotalMachines] = useState(5);
  const [lostTime, setLostTime] = useState(10); // 10 mins changeover time

  const [parts, setParts] = useState([
    { name: 'SLEEVE', hourlyCapacity: 35 },
    { name: 'HOOD', hourlyCapacity: 41 },
    { name: 'POCKET', hourlyCapacity: 45 },
    { name: 'MOON', hourlyCapacity: 50 },
    { name: 'BELT', hourlyCapacity: 35 },
    { name: 'BACK', hourlyCapacity: 41 },
    { name: 'HOOD 2', hourlyCapacity: 82 },
  ]);

  const shiftHours = [
    "12AM -> 01AM", "01AM -> 02AM", "02AM -> 03AM", "03AM -> 04AM",
    "04AM -> 05AM", "05AM -> 06AM", "06AM -> 07AM", "07AM -> 08AM"
  ];

  const reportGrid = useMemo(() => {
    const totalMinutes = shiftHours.length * 60;
    
    const partProgress = parts.map((p, idx) => ({
      ...p,
      id: idx + 1,
      perMinCap: p.hourlyCapacity / 60,
      produced: 0,
      completed: false,
    }));

    // Machine Tracker Allocation 
    const machineJob = Array.from({ length: totalMachines }, (_, i) => (i < parts.length ? i : -1));
    const machineCooldown = Array(totalMachines).fill(0);
    const machineNextJob = Array(totalMachines).fill(-1);
    const machineLastLoggedPart = Array.from({ length: totalMachines }, (_, i) => (i < parts.length ? i : -1));

    const logMatrix = Array.from({ length: shiftHours.length }, () =>
      parts.map(() => ({
        totalAccumulated: 0,
        thisHourOutput: 0,
        completedThisHour: false,
        compMinute: -1,
        shiftedToPart: -1,
        shiftStartMinute: -1,
        activeMachinesList: [],
        machineArrivals: [],
        isCompletedBefore: false
      }))
    );

    // Track historical system initialization
    const partsEverAssigned = new Set();
    for (let i = 0; i < totalMachines; i++) {
      if (i < parts.length) partsEverAssigned.add(i);
    }

    // High Precision Minute Simulation
    for (let m = 0; m < totalMinutes; m++) {
      const currentHourIdx = Math.floor(m / 60);
      const currentMinuteInHour = m % 60;

      const minuteActiveMcsPerPart = Array.from({ length: parts.length }, () => new Set());

      // Check if ALL parts in the factory have been initiated/touched at least once
      const areAllPartsInitiated = partsEverAssigned.size >= parts.length;

      for (let mc = 0; mc < totalMachines; mc++) {
        if (machineCooldown[mc] > 0) {
          machineCooldown[mc]--;
          if (machineCooldown[mc] === 0 && machineNextJob[mc] !== -1) {
            machineJob[mc] = machineNextJob[mc];
            machineNextJob[mc] = -1;
          }
          continue;
        }

        let pIdx = machineJob[mc];

        if (pIdx !== -1 && pIdx < parts.length && partProgress[pIdx].completed) {
          machineJob[mc] = -1;
          pIdx = -1;
        }

        if (machineJob[mc] === -1) {
          let selectedPartIdx = -1;

          // RULE 1: Direct sequential handover to parts that NEVER got any machine yet
          for (let p = 0; p < parts.length; p++) {
            if (!partsEverAssigned.has(p) && !partProgress[p].completed) {
              selectedPartIdx = p;
              partsEverAssigned.add(p); // Block it from other machines immediately
              break;
            }
          }

          // RULE 2: STRICT CRITERIA -> Only if ALL parts in the line are initiated, pooling is allowed
          if (selectedPartIdx === -1 && areAllPartsInitiated) {
            for (let p = 0; p < parts.length; p++) {
              if (!partProgress[p].completed) {
                selectedPartIdx = p;
                break;
              }
            }
          }

          if (selectedPartIdx !== -1) {
            machineCooldown[mc] = lostTime;
            machineNextJob[mc] = selectedPartIdx;

            const historicalJob = pIdx !== -1 ? pIdx : mc;
            if (historicalJob < parts.length && historicalJob >= 0) {
              logMatrix[currentHourIdx][historicalJob].shiftedToPart = selectedPartIdx + 1;
              logMatrix[currentHourIdx][historicalJob].shiftStartMinute = (m + lostTime) % 60;
            }
          }
        }

        const activePartIdx = machineJob[mc];
        if (activePartIdx !== -1 && activePartIdx < parts.length) {
          minuteActiveMcsPerPart[activePartIdx].add(mc + 1);

          if (machineLastLoggedPart[mc] !== activePartIdx) {
            logMatrix[currentHourIdx][activePartIdx].machineArrivals.push(
              `M/C ${mc + 1} started at ${currentMinuteInHour}m`
            );
            machineLastLoggedPart[mc] = activePartIdx;
          }
        }
      }

      // Compute actual matrix physics line production
      partProgress.forEach((part, pIdx) => {
        const activeMcs = minuteActiveMcsPerPart[pIdx];

        activeMcs.forEach(mcNum => {
          if (!logMatrix[currentHourIdx][pIdx].activeMachinesList.includes(mcNum)) {
            logMatrix[currentHourIdx][pIdx].activeMachinesList.push(mcNum);
          }
        });

        if (!part.completed && activeMcs.size > 0) {
          const yieldProduction = part.perMinCap * activeMcs.size;
          part.produced += yieldProduction;
          logMatrix[currentHourIdx][pIdx].thisHourOutput += yieldProduction;

          if (part.produced >= target) {
            part.completed = true;
            part.doneAtTotalMinutes = m;
            logMatrix[currentHourIdx][pIdx].completedThisHour = true;
            logMatrix[currentHourIdx][pIdx].compMinute = currentMinuteInHour;
          }
        }

        logMatrix[currentHourIdx][pIdx].totalAccumulated = Math.min(part.produced, target);

        if (part.completed && currentHourIdx > Math.floor(part.doneAtTotalMinutes / 60)) {
          logMatrix[currentHourIdx][pIdx].isCompletedBefore = true;
        }
      });
    }

    return logMatrix;
  }, [target, totalMachines, parts, lostTime]);

  const handlePartChange = (index, field, value) => {
    const updated = [...parts];
    updated[index] = { ...updated[index], [field]: value };
    setParts(updated);
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-100 font-sans">
      <div className="max-w-7xl mx-auto bg-slate-800 shadow-2xl rounded-2xl p-6 border border-slate-700">
        
        <div className="text-center mb-8 border-b border-slate-700 pb-4">
          <h1 className="text-3xl font-extrabold text-cyan-400 drop-shadow tracking-wide">
            
          </h1>
        </div>

        {/* Input parameters panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 bg-slate-900/50 p-5 rounded-xl border border-slate-700">
          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-cyan-400 mb-2">🎯 TARGET (PCS):</label>
            <input 
              type="number" 
              value={target} 
              onChange={(e) => setTarget(Number(e.target.value))}
              className="w-full p-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white font-mono focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-cyan-400 mb-2">💻 TOTAL M/C AVAILABLE:</label>
            <input 
              type="number" 
              value={totalMachines} 
              onChange={(e) => setTotalMachines(Number(e.target.value))}
              className="w-full p-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white font-mono focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-cyan-400 mb-2">⏱️ CHANGEOVER LOST TIME (MINS):</label>
            <input 
              type="number" 
              value={lostTime} 
              onChange={(e) => setLostTime(Number(e.target.value))}
              className="w-full p-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white font-mono focus:border-cyan-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Capacity Settings modification */}
        <div className="mb-8">
          <h3 className="font-semibold text-sm text-slate-300 mb-3">⚙️ Live Parts Name & Capacity Configurations:</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {parts.map((part, index) => (
              <div key={index} className="p-3 border border-slate-700 bg-slate-900 rounded-xl">
                <input 
                  type="text" 
                  value={part.name} 
                  onChange={(e) => handlePartChange(index, 'name', e.target.value)}
                  className="w-full text-xs font-bold bg-transparent text-center border-b border-slate-700 pb-1 text-cyan-300 uppercase focus:outline-none"
                />
                <div className="mt-2 text-[10px] text-slate-400 text-center">Cap/Hr</div>
                <input 
                  type="number" 
                  value={part.hourlyCapacity} 
                  onChange={(e) => handlePartChange(index, 'hourlyCapacity', Number(e.target.value))}
                  className="w-full text-sm text-center bg-slate-800 text-white font-mono border border-slate-600 rounded p-1 mt-0.5"
                />
              </div>
            ))}
          </div>
        </div>

        {/* RE-ENGINEERED DYNAMIC VISUAL REPORT GRID */}
        <div className="overflow-x-auto rounded-xl border border-slate-700 shadow-xl">
          <table className="w-full border-collapse text-center text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-300 uppercase tracking-wider text-[11px]">
                <th className="border border-slate-700 p-4 font-bold sticky left-0 bg-slate-950 z-10 w-48 border-r-2 border-r-slate-600">
                  ⏳ TIME WINDOW
                </th>
                {parts.map((p, idx) => (
                  <th key={idx} className="border border-slate-700 p-4 font-bold bg-slate-900 text-cyan-400 min-w-[200px]">
                    <div className="text-sm font-black">{idx + 1}st PART</div>
                    <div className="text-[10px] text-slate-400 font-normal normal-case mt-0.5">({p.name})</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="font-mono">
              {shiftHours.map((hourRow, hIdx) => (
                <tr key={hIdx} className="border-b border-slate-800 hover:bg-slate-750/30 transition-colors">
                  
                  <td className="border border-slate-700 p-4 font-bold bg-slate-950 text-slate-400 text-left pl-4 sticky left-0 z-10 whitespace-nowrap border-r-2 border-r-slate-600">
                    {hourRow}
                  </td>
                  
                  {parts.map((_, pIdx) => {
                    const cell = reportGrid[hIdx]?.[pIdx];
                    if (!cell) return <td key={pIdx} className="border border-slate-700 p-3">-</td>;

                    const sortedMachines = [...cell.activeMachinesList].sort((a, b) => a - b);
                    const machineDisplayString = sortedMachines.length > 0 ? sortedMachines.join(", ") : "None";

                    if (cell.isCompletedBefore) {
                      return (
                        <td key={pIdx} className="border border-slate-700 p-3 bg-emerald-950/10 text-emerald-500 font-bold align-middle opacity-50">
                          ✓ FULLY COMPLETED
                        </td>
                      );
                    }

                    return (
                      <td 
                        key={pIdx} 
                        className={`border border-slate-700 p-3 transition-all ${
                          cell.completedThisHour 
                            ? 'bg-yellow-500/10 border-2 border-yellow-500/50 text-yellow-400' 
                            : 'bg-slate-900/40 text-slate-100'
                        }`}
                      >
                        {/* Target Slash Notation Display */}
                        <div className="text-lg font-black tracking-tight text-white">
                          {Math.floor(cell.totalAccumulated)} <span className="text-slate-500 font-normal">/</span> <span className="text-cyan-400">{Math.floor(cell.thisHourOutput)}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Total Pcs <span className="text-slate-500">/</span> This Hour
                        </div>

                        {/* LIVE NEW ARRIVALS SPECIFIC TIMESTAMP LOGS */}
                        {cell.machineArrivals.length > 0 && (
                          <div className="mt-2.5 bg-slate-950/60 p-1.5 rounded border border-slate-700 text-left space-y-0.5">
                            <div className="text-[9px] text-cyan-400 font-extrabold uppercase tracking-wide">📥 Machine Entries:</div>
                            {cell.machineArrivals.map((logStr, lIdx) => (
                              <div key={lIdx} className="text-[10px] text-slate-300 font-medium">
                                • {logStr}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Current Running Machines Overview Row */}
                        <div className="mt-2">
                          {sortedMachines.length > 0 ? (
                            <span className={`inline-block text-[10px] px-2 py-0.5 rounded font-bold border ${
                              sortedMachines.length > 1 
                                ? 'bg-indigo-950/80 text-indigo-300 border-indigo-700' 
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}>
                              ⚙️ Running: M/C {machineDisplayString}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-600 italic">No Active M/C</span>
                          )}
                        </div>

                        {/* Target Hit Confirmation Box Metadata */}
                        {cell.completedThisHour && (
                          <div className="mt-3 text-[10px] border-t border-yellow-600/30 pt-2 space-y-1">
                            <div className="text-yellow-300 font-bold bg-yellow-500/20 rounded py-0.5 px-1">
                              🎯 DONE AT: {cell.compMinute}m
                            </div>
                            {cell.shiftedToPart !== -1 && (
                              <div className="text-left text-[9px] bg-cyan-950/50 p-1 rounded text-cyan-300 border border-cyan-800/40">
                                ➜ M/C Shifted to {cell.shiftedToPart}rd Part at {cell.shiftStartMinute}m
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}