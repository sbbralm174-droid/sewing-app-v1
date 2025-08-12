'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FloorLineForm() {
  const [formData, setFormData] = useState({
    floor: '',
    lineNumber: '',
    supervisor: '',
    operators: [],
    machines: [],
    currentProcess: ''
  });
  const [floors, setFloors] = useState([]); 
  const [supervisors, setSupervisors] = useState([]);
  const [operators, setOperators] = useState([]);
  const [machines, setMachines] = useState([]);
  const [floorName, setFloorName] = useState(''); // New state for selected floor name
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [floorsRes, supervisorsRes, operatorsRes, machinesRes] = await Promise.all([
          fetch('/api/floors'),
          fetch('/api/supervisors'),
          fetch('/api/operators'),
          fetch('/api/machines')
        ]);

        const floorsData = await floorsRes.json();
        const supervisorsData = await supervisorsRes.json();
        const operatorsData = await operatorsRes.json();
        const machinesData = await machinesRes.json();

        setFloors(floorsData.data);
        setSupervisors(supervisorsData);
        setOperators(operatorsData);
        setMachines(machinesData);
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'floor') {
      const selectedFloor = floors.find(f => f._id === value);
      setFloorName(selectedFloor ? selectedFloor.floorName : '');
      setFormData(prev => ({
        ...prev,
        floor: value,
      }));
    } else if (name === 'lineNumber') {
      // We only store the user-typed number, not the full string
      const sanitizedValue = value.replace(floorName + '-', '');
      setFormData(prev => ({
        ...prev,
        lineNumber: sanitizedValue,
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleArrayChange = (e) => {
    const { name, options } = e.target;
    const selectedValues = Array.from(options)
      .filter(option => option.selected)
      .map(option => option.value);
    setFormData(prev => ({ ...prev, [name]: selectedValues }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        lineNumber: `${floorName}-${formData.lineNumber}` // Combine before sending
      };
      
      const response = await fetch('/api/floor-lines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push('/');
      } else {
        console.error('Failed to submit form:', response.statusText);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Add New Floor Line</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Floor:</label>
          <select
            name="floor"
            value={formData.floor}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Select Floor</option>
            {floors.map((floor) => (
              <option key={floor._id} value={floor._id}>
                {floor.floorName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1">Line Number:</label>
          <input
            type="text"
            name="lineNumber"
            value={floorName ? `${floorName}-${formData.lineNumber}` : formData.lineNumber}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Supervisor:</label>
          <select
            name="supervisor"
            value={formData.supervisor}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="">Select Supervisor</option>
            {supervisors.map((supervisor) => (
              <option key={supervisor._id} value={supervisor._id}>
                {supervisor.name} ({supervisor.supervisorId})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1">Operators:</label>
          <select
            name="operators"
            multiple
            value={formData.operators}
            onChange={handleArrayChange}
            className="w-full p-2 border rounded h-auto"
            size="5"
          >
            {operators.map((operator) => (
              <option key={operator._id} value={operator._id}>
                {operator.name} ({operator.operatorId})
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500">Hold Ctrl/Cmd to select multiple</p>
        </div>
        <div>
          <label className="block mb-1">Machines:</label>
          <select
            name="machines"
            multiple
            value={formData.machines}
            onChange={handleArrayChange}
            className="w-full p-2 border rounded h-auto"
            size="5"
          >
            {machines.map((machine) => (
              <option key={machine._id} value={machine._id}>
                {machine.uniqueId} ({machine.machineType?.name})
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500">Hold Ctrl/Cmd to select multiple</p>
        </div>
        <div>
          <label className="block mb-1">Current Process:</label>
          <input
            type="text"
            name="currentProcess"
            value={formData.currentProcess}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Submit
        </button>
      </form>
    </div>
  );
}