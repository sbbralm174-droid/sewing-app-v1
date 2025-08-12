'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DailyProductionForm() {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        operator: null, // এখন operator একটি object
        supervisor: null, // এখন supervisor একটি object
        floor: '', // এখন floorName স্ট্রিং হিসেবে থাকবে
        line: '',
        process: '',
        status: 'present',
        machineType: '',
        uniqueMachine: '',
        target: '',
        workAs: 'operator'
    });

    const [operators, setOperators] = useState([]);
    const [supervisors, setSupervisors] = useState([]);
    const [floors, setFloors] = useState([]);
    const [lines, setLines] = useState([]);
    const [processes, setProcesses] = useState([]);
    const [machineTypes, setMachineTypes] = useState([]);
    const [machines, setMachines] = useState([]);
    const [filteredMachines, setFilteredMachines] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [duplicateError, setDuplicateError] = useState('');
    const router = useRouter();

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [
                    operatorsRes,
                    supervisorsRes,
                    floorLinesRes,
                    processesRes,
                    machineTypesRes,
                    machinesRes
                ] = await Promise.all([
                    fetch('/api/operators'),
                    fetch('/api/supervisors'),
                    fetch('/api/floor-lines'),
                    fetch('/api/processes'),
                    fetch('/api/machine-types'),
                    fetch('/api/machines')
                ]);

                if (!operatorsRes.ok || !supervisorsRes.ok || !floorLinesRes.ok || !processesRes.ok || !machineTypesRes.ok || !machinesRes.ok) {
                    throw new Error('কিছু প্রাথমিক ডেটা লোড করতে ব্যর্থ হয়েছে।');
                }

                setOperators(await operatorsRes.json());
                setSupervisors(await supervisorsRes.json());

                const floorLinesData = await floorLinesRes.json();

                const uniqueFloors = [...new Map(
                    floorLinesData.map(item => [item.floor._id, { _id: item.floor._id, floorName: item.floor.floorName }])
                ).values()];
                setFloors(uniqueFloors);

                setLines([...new Set(floorLinesData.map(item => item.lineNumber))]);

                setProcesses(await processesRes.json());
                setMachineTypes(await machineTypesRes.json());
                setMachines(await machinesRes.json());

                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setDuplicateError('Failed to load initial data.');
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    useEffect(() => {
        if (formData.machineType) {
            const filtered = machines.filter(machine => {
                return machine.machineType && machine.machineType.name === formData.machineType;
            });
            setFilteredMachines(filtered);
            if (!filtered.some(m => m.uniqueId === formData.uniqueMachine)) {
                setFormData(prev => ({ ...prev, uniqueMachine: '' }));
            }
        } else {
            setFilteredMachines([]);
            setFormData(prev => ({ ...prev, uniqueMachine: '' }));
        }
    }, [formData.machineType, machines]);

    const checkDuplicateEntry = async (operatorId, machineId, date) => {
        try {
            // Check for operator duplicate
            const operatorRes = await fetch(`/api/daily-production?date=${date}&operatorId=${operatorId}`);
            if (!operatorRes.ok) {
                throw new Error('Failed to check for operator duplicate.');
            }
            const operatorEntries = await operatorRes.json();
            if (operatorEntries.length > 0) {
                return 'This operator already has a production entry for the selected date.';
            }

            // Check for machine duplicate
            const machineRes = await fetch(`/api/daily-production?date=${date}&machine=${machineId}`);
            if (!machineRes.ok) {
                throw new Error('Failed to check for machine duplicate.');
            }
            const machineEntries = await machineRes.json();
            if (machineEntries.length > 0) {
                return 'This machine already has a production entry for the selected date.';
            }

            return null; // No duplicate found
        } catch (error) {
            console.error('Error checking duplicate:', error);
            setDuplicateError(error.message || 'Failed to check for duplicate entries.');
            return 'Failed to check for duplicates.';
        }
    };


    const handleChange = (e) => {
        const { name, value } = e.target;
        setDuplicateError('');

        if (name === 'operator') {
            const selectedOperator = operators.find(op => op.operatorId === value);
            setFormData(prev => ({ ...prev, operator: selectedOperator || null }));
        } else if (name === 'supervisor') {
            // সুপারভাইজারের ID থেকে সম্পূর্ণ অবজেক্ট খুঁজে state-এ সংরক্ষণ করা হচ্ছে।
            // এই লজিকটি আপনার কোডে ইতিমধ্যে সঠিক ছিল।
            const selectedSupervisor = supervisors.find(sup => sup.supervisorId === value);
            setFormData(prev => ({ ...prev, supervisor: selectedSupervisor || null }));
        } else if (name === 'floor') {
            // floorName স্ট্রিং হিসেবে state-এ সংরক্ষণ করা হচ্ছে
            setFormData(prev => ({ ...prev, floor: value }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setDuplicateError('');

        if (!formData.operator || !formData.uniqueMachine || !formData.supervisor) {
            setDuplicateError('Please select an operator, supervisor, and a machine.');
            return;
        }

        const duplicateMessage = await checkDuplicateEntry(
            formData.operator.operatorId,
            formData.uniqueMachine,
            formData.date
        );

        if (duplicateMessage) {
            setDuplicateError(duplicateMessage);
            return;
        }

        // এখানে আমরা একটি নতুন পেলোড তৈরি করছি যেখানে সুপারভাইজার শুধুমাত্র একটি স্ট্রিং (নাম)।
        const payload = {
            ...formData,
            // supervisor অবজেক্টের পরিবর্তে শুধুমাত্র তার নাম পাঠানো হচ্ছে।
            supervisor: formData.supervisor.name,
        };

        try {
            const response = await fetch('/api/daily-production', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (response.ok) {
                router.push('/');
            } else {
                const errData = await response.json();
                setDuplicateError(errData.error || 'Failed to submit form.');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            setDuplicateError('Something went wrong while submitting.');
        }
    };

    if (isLoading) {
        return <div className="container mx-auto p-4 text-center text-gray-400 bg-gray-900 min-h-screen flex items-center justify-center">Loading data... Please wait.</div>;
    }

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="bg-gray-800 shadow-md rounded-lg p-8 max-w-4xl w-full">
                <h1 className="text-3xl font-extrabold mb-8 text-center text-blue-400">Daily Production Entry 📊</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Date */}
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-1">Date:</label>
                        <input
                            type="date"
                            id="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    {/* Operator */}
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-300">Operator:</label>
                        <select
                            name="operator"
                            value={formData.operator?.operatorId || ''}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white"
                            required
                        >
                            <option value="">Select Operator</option>
                            {operators.map(operator => (
                                <option key={operator._id} value={operator.operatorId}>
                                    {operator.name} - {operator.operatorId} ({operator.designation})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Supervisor */}
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-300">Supervisor:</label>
                        <select
                            name="supervisor"
                            value={formData.supervisor?.supervisorId || ''}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white"
                            required
                        >
                            <option value="">Select Supervisor</option>
                            {supervisors.map(supervisor => (
                                <option key={supervisor._id} value={supervisor.supervisorId}>
                                    {supervisor.name} ({supervisor.supervisorId})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Floor */}
                    <div>
                        <label htmlFor="floor" className="block text-sm font-medium text-gray-300 mb-1">Floor:</label>
                        <select
                            id="floor"
                            name="floor"
                            value={formData.floor}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500"
                            required
                        >
                            <option value="">Select Floor</option>
                            {floors.map(floor => (
                                <option key={floor._id} value={floor.floorName}>
                                    {floor.floorName}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Line */}
                    <div>
                        <label htmlFor="line" className="block text-sm font-medium text-gray-300 mb-1">Line:</label>
                        <select
                            id="line"
                            name="line"
                            value={formData.line}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500"
                            required
                        >
                            <option value="">Select Line</option>
                            {lines.map(line => (
                                <option key={line} value={line}>
                                    {line}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Process */}
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-300">Process:</label>
                        <select
                            name="process"
                            value={formData.process}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white"
                            required
                        >
                            <option value="">Select Process</option>
                            {processes.map(process => (
                                <option key={process._id} value={process.name}>
                                    {process.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Present/Absent Status */}
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">Status:</label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500"
                            required
                        >
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                        </select>
                    </div>

                    {/* Machine Type */}
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-300">Machine Type:</label>
                        <select
                            name="machineType"
                            value={formData.machineType}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white"
                            required
                        >
                            <option value="">Select Machine Type</option>
                            {machineTypes.map(type => (
                                <option key={type._id} value={type.name}>
                                    {type.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Unique Machine */}
                    {formData.machineType && (
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-300">Unique Machine:</label>
                            <select
                                name="uniqueMachine"
                                value={formData.uniqueMachine}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white"
                                required
                            >
                                <option value="">Select Machine</option>
                                {filteredMachines.map(machine => (
                                    <option key={machine._id} value={machine.uniqueId}>
                                        {machine.uniqueId}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Target */}
                    <div>
                        <label htmlFor="target" className="block text-sm font-medium text-gray-300 mb-1">Target:</label>
                        <input
                            type="number"
                            id="target"
                            name="target"
                            value={formData.target}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500"
                            required
                            min="1"
                        />
                    </div>

                    {/* Work As */}
                    <div>
                        <label htmlFor="workAs" className="block text-sm font-medium text-gray-300 mb-1">Work As:</label>
                        <select
                            id="workAs"
                            name="workAs"
                            value={formData.workAs}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500"
                            required
                        >
                            <option value="operator">Operator</option>
                            <option value="helper">Helper</option>
                        </select>
                    </div>

                    {duplicateError && (
                        <div className="text-red-400 p-3 bg-red-900 border border-red-700 rounded-md text-sm">
                            🚨 {duplicateError}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition duration-300 ease-in-out font-semibold shadow-md"
                    >
                        Submit Daily Production
                    </button>
                </form>
            </div>
        </div>
    );
}

