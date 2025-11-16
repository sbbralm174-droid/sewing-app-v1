// components/viva-interview/ProcessScoreSection.js
'use client'
import { useState } from 'react';

export default function ProcessScoreSection({ formData, setFormData, processes }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [timeInputs, setTimeInputs] = useState({});

  const calculateScore = (timeValue) => {
    if (!timeValue || timeValue <= 0) return 0;
    const score = Math.round(3600 / timeValue);
    return Math.min(score, 1000);
  };

  const handleTimeInputChange = (processName, timeValue) => {
    setTimeInputs(prev => ({
      ...prev,
      [processName]: timeValue
    }));

    const score = calculateScore(timeValue);
    setFormData(prev => ({
      ...prev,
      processAndScore: {
        ...prev.processAndScore,
        [processName]: score
      }
    }));
  };

  const handleProcessToggle = (processName) => {
    setFormData(prev => {
      const newProcesses = { ...prev.processAndScore };
      
      if (newProcesses[processName] !== undefined) {
        delete newProcesses[processName];
      } else {
        newProcesses[processName] = 0;
      }
      
      return { 
        ...prev, 
        processAndScore: newProcesses
      };
    });

    if (formData.processAndScore[processName] !== undefined) {
      setTimeInputs(prev => {
        const newTimeInputs = { ...prev };
        delete newTimeInputs[processName];
        return newTimeInputs;
      });
    }
  };

  const handleScoreChange = (processName, score) => {
    const finalScore = Math.min(Math.max(0, parseInt(score) || 0), 1000);
    setFormData(prev => ({
      ...prev,
      processAndScore: {
        ...prev.processAndScore,
        [processName]: finalScore
      }
    }));
    console.log(formData)
  };
  

  const filteredProcesses = processes.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-3 text-indigo-600">Process and Score</h2>
      
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">
          Search Process:
        </label>
        <input
          type="text"
          placeholder="Search process..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full mb-3 p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
        />

        <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md p-2 bg-white">
          {filteredProcesses.map((process) => {
            const isSelected = formData.processAndScore[process.name] !== undefined;
            const currentTime = timeInputs[process.name] || '';
            const currentScore = formData.processAndScore[process.name] || 0;

            return (
              <div key={process._id} className="mb-3 p-2 border border-gray-200 rounded-md bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleProcessToggle(process.name)}
                    className="rounded border-gray-300 bg-white text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="flex-1 font-medium text-gray-900">{process.name}</span>
                </div>

                {isSelected && (
                  <div className="ml-6 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block mb-1 text-xs font-medium text-gray-700">
                          Time (seconds):
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          placeholder="Enter time"
                          value={currentTime}
                          onChange={(e) => handleTimeInputChange(process.name, parseFloat(e.target.value))}
                          className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-1 focus:ring-indigo-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block mb-1 text-xs font-medium text-gray-700">
                          Score
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="1000"
                          value={currentScore}
                          onChange={(e) => handleScoreChange(process.name, e.target.value)}
                          className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-1 focus:ring-indigo-500 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}