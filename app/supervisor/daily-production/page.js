'use client'
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Select from 'react-select';

export default function DailyProductionForm() {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        operator: null,
        supervisor: null,
        floor: '',
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
    const [allLines, setAllLines] = useState([]); // সব floor-line data
    const [lines, setLines] = useState([]); // filtered lines
    const [machineTypes, setMachineTypes] = useState([]);
    const [machines, setMachines] = useState([]);
    const [filteredMachines, setFilteredMachines] = useState([]);
    const [operatorProcesses, setOperatorProcesses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [duplicateError, setDuplicateError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLineDone, setIsLineDone] = useState(false);
    const router = useRouter();
    const dateRef = useRef(null);

    // Custom styles for react-select (dark theme)
    const customSelectStyles = {
      control: (provided, state) => ({
        ...provided,
        backgroundColor: '#1f2937', // gray-800
        borderColor: state.isFocused ? '#3b82f6' : '#4b5563', // blue on focus
        color: 'white',
        minHeight: '48px',
      }),
      menu: (provided) => ({
        ...provided,
        backgroundColor: '#1f2937',
        color: 'white',
      }),
      option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isFocused ? '#374151' : '#1f2937', // gray-700 hover
        color: 'white',
        cursor: 'pointer',
      }),
      singleValue: (provided) => ({
        ...provided,
        color: 'white',
      }),
      input: (provided) => ({
        ...provided,
        color: 'white',
      }),
      placeholder: (provided) => ({
        ...provided,
        color: '#9ca3af',
      }),
      dropdownIndicator: (provided) => ({
        ...provided,
        color: 'white',
      }),
      indicatorSeparator: () => ({
        display: 'none',
      }),
    };

    // Initial Data Load
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [
                    operatorsRes,
                    supervisorsRes,
                    floorLinesRes,
                    machineTypesRes,
                    machinesRes
                ] = await Promise.all([
                    fetch('/api/operators'),
                    fetch('/api/supervisors'),
                    fetch('/api/floor-lines'),
                    fetch('/api/machine-types'),
                    fetch('/api/machines')
                ]);

                if (!operatorsRes.ok || !supervisorsRes.ok || !floorLinesRes.ok || !machineTypesRes.ok || !machinesRes.ok) {
                    throw new Error('কিছু প্রাথমিক ডেটা লোড করতে ব্যর্থ হয়েছে।');
                }

                setOperators(await operatorsRes.json());
                setSupervisors(await supervisorsRes.json());

                const floorLinesData = await floorLinesRes.json();
                const uniqueFloors = [...new Map(
                    floorLinesData.map(item => [item.floor._id, { _id: item.floor._id, floorName: item.floor.floorName }])
                ).values()];
                setFloors(uniqueFloors);
                setAllLines(floorLinesData);

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

    // Filter lines by selected floor
    useEffect(() => {
        if (formData.floor) {
            const filteredLines = allLines
                .filter(item => item.floor.floorName === formData.floor)
                .map(item => item.lineNumber);
            const uniqueFilteredLines = [...new Set(filteredLines)];
            setLines(uniqueFilteredLines);

            if (!uniqueFilteredLines.includes(formData.line)) {
                setFormData(prev => ({ ...prev, line: '' }));
            }
        } else {
            setLines([]);
            setFormData(prev => ({ ...prev, line: '' }));
        }
    }, [formData.floor, allLines]);

    // Filter machines by type
    useEffect(() => {
        const filtered = machines.filter(machine => {
            return machine.machineType && machine.machineType.name === formData.machineType;
        });
        setFilteredMachines(filtered);
        if (formData.workAs === 'operator' && !filtered.some(m => m.uniqueId === formData.uniqueMachine)) {
            setFormData(prev => ({ ...prev, uniqueMachine: '' }));
        }
    }, [formData.machineType, formData.workAs, formData.uniqueMachine, machines]);

    // Duplicate check
    const checkDuplicateEntry = async (operatorId, uniqueMachine, date, workAs) => {
        try {
            const operatorRes = await fetch(`/api/daily-production?date=${date}&operatorId=${operatorId}`);
            if (!operatorRes.ok) throw new Error('Failed to check for operator duplicate.');
            const operatorEntries = await operatorRes.json();
            if (operatorEntries.length > 0) return 'This operator already has a production entry for the selected date.';

            if (workAs === 'operator' && uniqueMachine) {
                const machineRes = await fetch(`/api/daily-production?date=${date}&machine=${uniqueMachine}`);
                if (!machineRes.ok) throw new Error('Failed to check for machine duplicate.');
                const machineEntries = await machineRes.json();
                if (machineEntries.length > 0) return 'This machine already has a production entry for the selected date.';
            }
            return null;
        } catch (error) {
            console.error('Error checking duplicate:', error);
            setDuplicateError(error.message || 'Failed to check for duplicate entries.');
            return 'Failed to check for duplicates.';
        }
    };

    // Handle react-select changes
    const handleSelectChange = (selected, actionMeta) => {
        const { name } = actionMeta;
        setDuplicateError('');

        if (name === 'operator') {
            setFormData(prev => ({ ...prev, operator: selected }));
            setOperatorProcesses(selected?.allowedProcesses || []);
        } else if (name === 'supervisor') {
            setFormData(prev => ({ ...prev, supervisor: selected }));
        } else if (name === 'floor') {
            setFormData(prev => ({ ...prev, floor: selected?.value || '' }));
        } else if (name === 'line') {
            setFormData(prev => ({ ...prev, line: selected?.value || '' }));
        } else if (name === 'process') {
            setFormData(prev => ({ ...prev, process: selected?.value || '' }));
        } else if (name === 'status') {
            setFormData(prev => ({ ...prev, status: selected?.value || '' }));
        } else if (name === 'workAs') {
            setFormData(prev => ({ ...prev, workAs: selected?.value || 'operator' }));
        } else if (name === 'machineType') {
            setFormData(prev => ({ ...prev, machineType: selected?.value || '', uniqueMachine: '' }));
        } else if (name === 'uniqueMachine') {
            setFormData(prev => ({ ...prev, uniqueMachine: selected?.value || '' }));
        }
    };

    // Handle submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setDuplicateError('');
        setSuccessMessage('');

        if (!formData.operator || !formData.supervisor) {
            setDuplicateError('Please select an operator and a supervisor.');
            return;
        }

        if (formData.workAs === 'operator') {
            if (!formData.uniqueMachine || !formData.target) {
                setDuplicateError('As an operator, you must select a machine and set a target.');
                return;
            }
        }

        const duplicateMessage = await checkDuplicateEntry(
            formData.operator.operatorId,
            formData.uniqueMachine,
            formData.date,
            formData.workAs
        );

        if (duplicateMessage) {
            setDuplicateError(duplicateMessage);
            return;
        }

        const payload = {
            ...formData,
            supervisor: formData.supervisor.name,
        };

        try {
            const response = await fetch('/api/daily-production', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (response.ok) {
                setSuccessMessage('✅ Daily production entry submitted successfully!');
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                const errData = await response.json();
                setDuplicateError(errData.error || 'Failed to submit form.');
            }

            // Now, check if the line completion checkbox is marked
            if (isLineDone && formData.line) {
                const lineCompletionPayload = {
                    date: formData.date,
                    floor: formData.floor,
                    line: formData.line,
                    supervisor: formData.supervisor.name,
                };
        
                const completionRes = await fetch('/api/line-completion', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(lineCompletionPayload),
                });
        
                if (!completionRes.ok) {
                    // Check if the response body is not empty before parsing as JSON
                    const contentType = completionRes.headers.get("content-type");
                    if (contentType && contentType.indexOf("application/json") !== -1) {
                        const errData = await completionRes.json();
                        setDuplicateError(`Failed to mark line as complete: ${errData.error}`);
                    } else {
                        setDuplicateError('Failed to mark line as complete. Server returned a non-JSON response.');
                    }
                    return;
                }
            }




        } catch (error) {
            console.error('Error submitting form:', error);
            setDuplicateError('Something went wrong while submitting.');
        }
    };

    if (isLoading) {
        return <div className="container mx-auto p-4 text-center text-gray-400 bg-gray-900 min-h-screen flex items-center justify-center">Loading data... Please wait.</div>;
    }

    // Prepare options
    const operatorOptions = operators.map(op => ({ value: op.operatorId, label: `${op.name} - ${op.operatorId} (${op.designation})`, ...op }));
    const supervisorOptions = supervisors.map(sup => ({ value: sup.supervisorId, label: `${sup.name} (${sup.supervisorId})`, ...sup }));
    const floorOptions = floors.map(f => ({ value: f.floorName, label: f.floorName }));
    const lineOptions = lines.map(l => ({ value: l, label: l }));
    const processOptions = operatorProcesses.map(p => ({ value: p, label: p }));
    const statusOptions = [{ value: 'present', label: 'Present' }, { value: 'absent', label: 'Absent' }];
    const workAsOptions = [{ value: 'operator', label: 'Operator' }, { value: 'helper', label: 'Helper' }];
    const machineTypeOptions = machineTypes.map(mt => ({ value: mt.name, label: mt.name }));
    const uniqueMachineOptions = filteredMachines.map(m => ({ value: m.uniqueId, label: m.uniqueId }));

    return (
        <Layout>
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <div className="bg-gray-800 shadow-md rounded-lg p-8 max-w-4xl w-full">
                    <h1 className="text-3xl font-extrabold mb-8 text-center text-blue-400">Daily Production Entry 📊</h1>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Line Done Checkbox */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                <input
                                    type="checkbox"
                                    checked={isLineDone}
                                    onChange={(e) => setIsLineDone(e.target.checked)}
                                    className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                />
                                Mark this line as complete for the day
                            </label>
                        </div>
                        {/* Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Date:</label>
                            <div
                                className="w-full p-3 border border-gray-600 rounded-md bg-gray-700 text-white cursor-pointer"
                                onClick={() => dateRef.current?.showPicker()}
                            >
                                <input
                                    ref={dateRef}
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                    className="bg-transparent outline-none w-full cursor-pointer"
                                    required
                                />
                            </div>
                        </div>

                        {/* Operator */}
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-300">Operator:</label>
                            <Select
                                name="operator"
                                options={operatorOptions}
                                value={formData.operator}
                                onChange={handleSelectChange}
                                styles={customSelectStyles}
                                isSearchable
                            />
                        </div>

                        {/* Supervisor */}
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-300">Supervisor:</label>
                            <Select
                                name="supervisor"
                                options={supervisorOptions}
                                value={formData.supervisor}
                                onChange={handleSelectChange}
                                styles={customSelectStyles}
                                isSearchable
                            />
                        </div>

                        {/* Floor */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Floor:</label>
                            <Select
                                name="floor"
                                options={floorOptions}
                                value={formData.floor ? { value: formData.floor, label: formData.floor } : null}
                                onChange={handleSelectChange}
                                styles={customSelectStyles}
                                isSearchable
                            />
                        </div>

                        {/* Line */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Line:</label>
                            <Select
                                name="line"
                                options={lineOptions}
                                value={formData.line ? { value: formData.line, label: formData.line } : null}
                                onChange={handleSelectChange}
                                styles={customSelectStyles}
                                isSearchable
                            />
                        </div>

                        {/* Process */}
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-300">Process:</label>
                            <Select
                                name="process"
                                options={processOptions}
                                value={formData.process ? { value: formData.process, label: formData.process } : null}
                                onChange={handleSelectChange}
                                styles={customSelectStyles}
                                isSearchable
                                isDisabled={operatorProcesses.length === 0}
                            />
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Status:</label>
                            <Select
                                name="status"
                                options={statusOptions}
                                value={{ value: formData.status, label: formData.status.charAt(0).toUpperCase() + formData.status.slice(1) }}
                                onChange={handleSelectChange}
                                styles={customSelectStyles}
                            />
                        </div>

                        {/* Work As */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Work As:</label>
                            <Select
                                name="workAs"
                                options={workAsOptions}
                                value={{ value: formData.workAs, label: formData.workAs.charAt(0).toUpperCase() + formData.workAs.slice(1) }}
                                onChange={handleSelectChange}
                                styles={customSelectStyles}
                            />
                        </div>

                        {/* Machine Type */}
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-300">Machine Type:</label>
                            <Select
                                name="machineType"
                                options={machineTypeOptions}
                                value={formData.machineType ? { value: formData.machineType, label: formData.machineType } : null}
                                onChange={handleSelectChange}
                                styles={customSelectStyles}
                                isSearchable
                                isDisabled={formData.workAs !== 'operator'}
                            />
                        </div>

                        {/* Unique Machine */}
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-300">Unique Machine:</label>
                            <Select
                                name="uniqueMachine"
                                options={uniqueMachineOptions}
                                value={formData.uniqueMachine ? { value: formData.uniqueMachine, label: formData.uniqueMachine } : null}
                                onChange={handleSelectChange}
                                styles={customSelectStyles}
                                isSearchable
                                isDisabled={formData.workAs !== 'operator'}
                            />
                        </div>

                        {/* Target */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Target:</label>
                            <input
                                type="number"
                                name="target"
                                value={formData.target}
                                onChange={e => setFormData(prev => ({ ...prev, target: e.target.value }))}
                                className="w-full p-3 border border-gray-600 rounded-md bg-gray-700 text-white"
                                required={formData.workAs === 'operator'}
                                min="1"
                            />
                        </div>

                        {duplicateError && (
                            <div className="text-red-400 p-3 bg-red-900 border border-red-700 rounded-md text-sm">
                                🚨 {duplicateError}
                            </div>
                        )}
                        {successMessage && (
                            <div className="text-green-400 p-3 bg-green-900 border border-green-700 rounded-md text-sm">
                                {successMessage}
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
        </Layout>
    );
}
