'use client';
import { useEffect, useState } from 'react';

export default function OperatorDetails({ params }) {
  const [operator, setOperator] = useState(null);

  useEffect(() => {
    fetch('/api/operators')
      .then(res => res.json())
      .then(data => {
        const found = data.find(op => op.operatorId === params.id);
        setOperator(found);
      });
  }, [params.id]);

  if (!operator)
    return (
      <div className="p-8 text-center text-gray-500">
        Operator not found for ID: {params.id}
      </div>
    );

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">{operator.name}</h1>
      <p className="text-gray-600">{operator.operatorId}</p>

      <img
        src={operator.picture}
        alt={operator.name}
        className="w-40 h-40 rounded-lg border my-4 object-cover"
      />

      <p><b>Designation:</b> {operator.designation}</p>
      <p><b>Grade:</b> {operator.grade}</p>
      <p><b>Joining Date:</b> {new Date(operator.joiningDate).toLocaleDateString()}</p>

      <h2 className="text-xl font-semibold mt-6">Allowed Processes</h2>
      <ul className="list-disc list-inside">
        {Object.entries(operator.allowedProcesses || {}).map(([process, score]) => (
          <li key={process}>
            {process} — <span className="text-blue-600">{score}</span>
          </li>
        ))}
      </ul>

      {operator.videos.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mt-6 mb-2">Videos</h2>
          <div className="space-y-3">
            {operator.videos.map(v => (
              <video
                key={v.name}
                src={v.url}
                controls
                className="w-80 rounded-lg border"
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
