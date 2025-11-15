'use client'
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Select from 'react-select';
import SidebarNavLayout from '@/components/SidebarNavLayout';
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
        workAs: 'operator',
        buyerId: '', // নতুন ফিল্ড
        styleId: ''  // নতুন ফিল্ড
    });

    const [operators, setOperators] = useState([]);
    const [supervisors, setSupervisors] = useState([]);
    const [floors, setFloors] = useState([]);
    const [allLines, setAllLines] = useState([]);
    const [lines, setLines] = useState([]);
    const [machineTypes, setMachineTypes] = useState([]);
    const [machines, setMachines] = useState([]);
    const [filteredMachines, setFilteredMachines] = useState([]);
    const [operatorProcesses, setOperatorProcesses] = useState([]);
    const [buyers, setBuyers] = useState([]);
    const [styles, setStyles] = useState([]);
    const [filteredStyles, setFilteredStyles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [duplicateError, setDuplicateError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLineDone, setIsLineDone] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const router = useRouter();
    const dateRef = useRef(null);

    // Custom styles for react-select (dark theme)
    const customSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            backgroundColor: '#1f2937',
            borderColor: state.isFocused ? '#3b82f6' : '#4b5563',
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
            backgroundColor: state.isFocused ? '#374151' : '#1f2937',
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

    // Fetch process data only
    const fetchProcessData = async () => {
        try {
            setIsRefreshing(true);
            
            const [
                operatorsRes,
                supervisorsRes,
                machineTypesRes,
                machinesRes,
                buyersRes
            ] = await Promise.all([
                fetch('/api/operators'),
                fetch('/api/supervisors'),
                fetch('/api/machine-types'),
                fetch('/api/machines'),
                fetch('/api/buyers')
            ]);

            if (!operatorsRes.ok || !supervisorsRes.ok || !machineTypesRes.ok || !machinesRes.ok || !buyersRes.ok) {
                throw new Error('Process data reload করতে ব্যর্থ হয়েছে।');
            }

            setOperators(await operatorsRes.json());
            setSupervisors(await supervisorsRes.json());
            setMachineTypes(await machineTypesRes.json());
            setMachines(await machinesRes.json());
            setBuyers(await buyersRes.json());

            setIsRefreshing(false);
        } catch (error) {
            console.error('Error refreshing process data:', error);
            setDuplicateError('Process data reload করতে ব্যর্থ হয়েছে।');
            setIsRefreshing(false);
        }
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
                    machinesRes,
                    buyersRes
                ] = await Promise.all([
                    fetch('/api/operators'),
                    fetch('/api/supervisors'),
                    fetch('/api/floor-lines'),
                    fetch('/api/machine-types'),
                    fetch('/api/machines'),
                    fetch('/api/buyers')
                ]);

                if (!operatorsRes.ok || !supervisorsRes.ok || !floorLinesRes.ok || !machineTypesRes.ok || !machinesRes.ok || !buyersRes.ok) {
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
                setBuyers(await buyersRes.json());

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

    // Filter styles by selected buyer
    useEffect(() => {
        const fetchStylesByBuyer = async () => {
            if (formData.buyerId) {
                try {
                    const response = await fetch(`/api/styles?buyerId=${formData.buyerId}`);
                    if (response.ok) {
                        const stylesData = await response.json();
                        setFilteredStyles(stylesData);
                    } else {
                        setFilteredStyles([]);
                    }
                } catch (error) {
                    console.error('Error fetching styles:', error);
                    setFilteredStyles([]);
                }
            } else {
                setFilteredStyles([]);
                setFormData(prev => ({ ...prev, styleId: '' }));
            }
        };

        fetchStylesByBuyer();
    }, [formData.buyerId]);

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
                setFormData(prev => ({ ...prev, operator: selected, process: '' }));
                const allowed = selected?.allowedProcesses || {};
                setOperatorProcesses(Object.keys(allowed));
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
        } else if (name === 'buyerId') {
            setFormData(prev => ({ ...prev, buyerId: selected?.value || '', styleId: '' }));
        } else if (name === 'styleId') {
            setFormData(prev => ({ ...prev, styleId: selected?.value || '' }));
        }
    };

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handle submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setDuplicateError('');
        setSuccessMessage('');

        // Validation
        if (!formData.operator || !formData.supervisor) {
            setDuplicateError('Please select an operator and a supervisor.');
            return;
        }

        if (!formData.buyerId || !formData.styleId) {
            setDuplicateError('Please select both Buyer and Style.');
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
                
                // Reset form
                setFormData(prev => ({
                    ...prev,
                    operator: null,
                    process: '',
                    uniqueMachine: '',
                    target: '',
                }));
                setOperatorProcesses([]);
                setFilteredStyles([]);
            } else {
                const errData = await response.json();
                setDuplicateError(errData.error || 'Failed to submit form.');
            }

            // Line completion logic
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

    // Handle reload process data
    const handleReloadProcessData = () => {
        fetchProcessData();
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
    const statusOptions = [{ value: 'present', label: 'Present' }];
    const workAsOptions = [{ value: 'operator', label: 'Operator' },  { value: 'helper', label: 'Helper' }];
    const machineTypeOptions = machineTypes.map(mt => ({ value: mt.name, label: mt.name }));
    const uniqueMachineOptions = filteredMachines.map(m => ({ value: m.uniqueId, label: m.uniqueId }));
    const buyerOptions = buyers.data.map(buyer => ({ value: buyer._id, label: buyer.name }));
    const styleOptions = (filteredStyles?.data?.map(style => ({ 
    value: style._id, 
    label: `${style.name} ` 
})) || []);
console.log('filteredStyles:', styleOptions);
    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <SidebarNavLayout/>
            <div className="bg-gray-800 shadow-md rounded-lg pt-20 p-8 max-w-4xl w-full">
                {/* Header with Reload Icon */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-extrabold text-blue-400">Daily Production Entry 📊</h1>
                    <button
                        type="button"
                        onClick={handleReloadProcessData}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md transition duration-300 ease-in-out font-semibold shadow-md"
                        title="Reload Process Data"
                    >
                        {isRefreshing ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Reloading...</span>
                            </>
                        ) : (
                            <>
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span>Reload Process</span>
                            </>
                        )}
                    </button>
                </div>

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
                                onChange={handleInputChange}
                                className="bg-transparent outline-none w-full cursor-pointer"
                                required
                            />
                        </div>
                    </div>

                    {/* Buyer */}
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-300">Buyer:</label>
                        <Select
                            name="buyerId"
                            options={buyerOptions}
                            value={buyerOptions.find(option => option.value === formData.buyerId)}
                            onChange={handleSelectChange}
                            styles={customSelectStyles}
                            isSearchable
                            required
                        />
                    </div>

                    {/* Style */}
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-300">Style:</label>
                        <Select
                            name="styleId"
                            options={styleOptions}
                            value={styleOptions.find(option => option.value === formData.styleId)}
                            onChange={handleSelectChange}
                            styles={customSelectStyles}
                            isSearchable
                            required
                            isDisabled={!formData.buyerId}
                        />
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
                            onChange={handleInputChange}
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
    );
}