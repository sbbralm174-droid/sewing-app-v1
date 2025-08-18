'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const BarChartComponent = ({ data, dataKey, barKey, title }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md h-96">
      <h3 className="text-xl font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height="80%">
        <BarChart data={data}>
          <XAxis dataKey={dataKey} />
          <YAxis />
          <Tooltip />
          <Bar dataKey={barKey.target} fill="#8884d8" name="Target" />
          <Bar dataKey={barKey.achievement} fill="#82ca9d" name="Achievement" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChartComponent;