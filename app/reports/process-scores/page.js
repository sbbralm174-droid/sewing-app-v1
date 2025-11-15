// app/process-scores/page.js
import { connectDB } from '@/lib/db';
import Operator from '@/models/Operator';

async function getProcessScores() {
  await connectDB();
  
  const operators = await Operator.find({})
    .select('allowedProcesses previousProcessScores')
    .lean();

  const processData = [];

  operators.forEach(operator => {
    const { allowedProcesses, previousProcessScores } = operator;

    // allowedProcesses Map থেকে process name এবং highest score নেওয়া
    if (allowedProcesses && allowedProcesses.size > 0) {
      allowedProcesses.forEach((highestScore, processName) => {
        // matching previous score খোঁজা
        const previousScoreData = previousProcessScores.find(
          score => score.processName === processName
        );

        if (previousScoreData) {
          const percentage = ((highestScore - previousScoreData.previousScore) / previousScoreData.previousScore * 100).toFixed(2);
          
          processData.push({
            processName,
            highestScore,
            previousScore: previousScoreData.previousScore,
            percentage: `${percentage}%`,
            date: previousScoreData.date,
            line: previousScoreData.line || 'N/A'
          });
        }
      });
    }
  });

  return processData;
}

export default async function ProcessScoresTable() {
  const processData = await getProcessScores();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Process Scores Comparison</h1>
      
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Process Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Highest Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Previous Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Percentage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Line
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {processData.map((process, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {process.processName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {process.highestScore}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {process.previousScore}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    parseFloat(process.percentage) > 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {process.percentage}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(process.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {process.line}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {processData.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No process score data available</p>
          </div>
        )}
      </div>
    </div>
  );
}