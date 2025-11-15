'use client';

import { useState } from 'react';

export default function Home() {
  const [operatorId, setOperatorId] = useState('');
  const [operatorData, setOperatorData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!operatorId.trim()) return;

    setLoading(true);
    setError('');
    setOperatorData(null);

    try {
      const response = await fetch(`/api/operators/${operatorId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch operator data');
      }

      setOperatorData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 mt-10 dark:bg-gray-900 py-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Operator Process Scores
          </h1>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-md mx-auto">
            <div className="flex gap-2">
              <input
                type="text"
                value={operatorId}
                onChange={(e) => setOperatorId(e.target.value.toUpperCase())}
                placeholder="Enter Operator ID"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors duration-200"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-4xl mx-auto mb-6">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg transition-colors duration-200">
              {error}
            </div>
          </div>
        )}

        {/* Operator Info and Table */}
        {operatorData && (
          <div className="max-w-6xl mx-auto">
            {/* Operator Basic Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 transition-colors duration-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
                  <p className="text-lg font-semibold dark:text-white">{operatorData.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Operator ID</label>
                  <p className="text-lg font-semibold dark:text-white">{operatorData.operatorId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Designation</label>
                  <p className="text-lg font-semibold dark:text-white">{operatorData.designation}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Grade</label>
                  <p className="text-lg font-semibold dark:text-white">{operatorData.grade}</p>
                </div>
              </div>
            </div>

            {/* Process Scores Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-colors duration-200">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  Process Performance History
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Process Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Highest Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Previous Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Improvement
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Line
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {getProcessScores(operatorData).map((process, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {process.processName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white font-semibold">
                            {process.highestScore}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {process.previousScore || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`text-sm font-medium ${
                              process.percentage > 0 
                                ? 'text-green-600 dark:text-green-400' 
                                : process.percentage < 0 
                                ? 'text-red-600 dark:text-red-400' 
                                : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              {process.percentage > 0 ? '+' : ''}{process.percentage}%
                            </span>
                            {process.percentage !== 0 && (
                              <span className={`ml-2 ${
                                process.percentage > 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                              }`}>
                                {process.percentage > 0 ? '↗' : '↘'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {process.date ? new Date(process.date).toLocaleDateString() : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {process.line || 'N/A'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to combine allowedProcesses and previousProcessScores
function getProcessScores(operatorData) {
  const processMap = new Map();

  // Add allowed processes (highest scores)
  if (operatorData.allowedProcesses) {
    Object.entries(operatorData.allowedProcesses).forEach(([processName, highestScore]) => {
      processMap.set(processName, {
        processName,
        highestScore,
        previousScore: null,
        percentage: 0,
        date: operatorData.updatedAt,
        line: null
      });
    });
  }

  // Update with previous scores and calculate percentages
  if (operatorData.previousProcessScores) {
    operatorData.previousProcessScores.forEach(prevScore => {
      const existingProcess = processMap.get(prevScore.processName);
      
      if (existingProcess) {
        const highestScore = existingProcess.highestScore;
        const previousScore = prevScore.previousScore;
        const percentage = previousScore > 0 
          ? Math.round(((highestScore - previousScore) / previousScore) * 100) 
          : 0;

        processMap.set(prevScore.processName, {
          ...existingProcess,
          previousScore,
          percentage,
          date: prevScore.date,
          line: prevScore.line
        });
      } else {
        // If process exists in previous scores but not in allowed processes
        processMap.set(prevScore.processName, {
          processName: prevScore.processName,
          highestScore: prevScore.previousScore, // Use previous as highest if no allowed process
          previousScore: prevScore.previousScore,
          percentage: 0,
          date: prevScore.date,
          line: prevScore.line
        });
      }
    });
  }

  return Array.from(processMap.values()).sort((a, b) => 
    a.processName.localeCompare(b.processName)
  );
}