'use client'; 

import React, { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * @typedef {object} Process
 * @property {string} _id
 * @property {string} name
 * @property {string} description
 * @typedef {object} OperatorScore
 * @property {string} _id
 * @property {string} name
 * @property {string} operatorId
 * @property {string} processName
 * @property {number} score
 */

export default function OperatorProcessSearchPage() {
    /** @type {[Process[], React.Dispatch<React.SetStateAction<Process[]>>]} */
    const [allProcesses, setAllProcesses] = useState([]);
    /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
    const [selectedProcess, setSelectedProcess] = useState('');
    /** @type {[OperatorScore[], React.Dispatch<React.SetStateAction<OperatorScore[]>>]} */
    const [results, setResults] = useState([]);
    /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
    const [loading, setLoading] = useState(false);
    /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
    const [message, setMessage] = useState('');
    
    // State for the search/filter feature
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Function to fetch all processes from the API
    const fetchProcesses = useCallback(async () => {
        try {
            const response = await fetch('/api/processes');
            if (!response.ok) {
                throw new Error('Process API error');
            }
            /** @type {Process[]} */
            const data = await response.json();
            setAllProcesses(data);
            if (data.length > 0) {
                setSelectedProcess(data[0].name); 
            }
        } catch (error) {
            console.error('Error fetching processes:', error);
            setMessage('Failed to load the list of processes.');
        }
    }, []);

    // Function to fetch operator scores based on the selected process
    const fetchOperatorScores = useCallback(async (processName) => {
        if (!processName) return;

        setLoading(true);
        setResults([]);
        setMessage('Loading operator data...');

        try {
            const encodedProcessName = encodeURIComponent(processName);
            const apiUrl = `/api/all-operator-process-score-list?process=${encodedProcessName}`;

            const response = await fetch(apiUrl);
            const data = await response.json();

            // NEW CODE (Replace the old if/else block)
            // If the status is 200, or it's a 404 (which carries the "No operator found" message)
            if (response.ok || response.status === 404) {
                
                if (data.data && data.data.length > 0) {
                    setResults(data.data);
                    setMessage(`Found a total of ${data.totalOperators} operators for process (${data.processSearched})`);
                } else if (response.status === 400) {
                     // This handles the 'Please provide "process"' error
                     throw new Error(data.message || 'Query parameter missing.');
                } else {
                    setResults([]);
                    // Use the message from the API, which will be the "No operator authorized..." message
                    setMessage(`No operators found for the process: "${data.processSearched}".`);
                }
            } else {
                // Only throw an error for unexpected issues (e.g., 500 server error)
                throw new Error(data.message || 'Failed to fetch scores due to server error.');
            }

        } catch (error) {
            console.error('Error fetching operator scores:', error);
            setMessage(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load processes on component mount
    useEffect(() => {
        fetchProcesses();
    }, [fetchProcesses]);

    // Fetch scores whenever selectedProcess changes
    useEffect(() => {
        if (selectedProcess) {
            fetchOperatorScores(selectedProcess);
        }
    }, [selectedProcess, fetchOperatorScores]);

    // Filtering logic for the searchable dropdown
    const filteredProcesses = useMemo(() => {
        if (!searchTerm) {
            return allProcesses;
        }
        return allProcesses.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [allProcesses, searchTerm]);
    
    // Handle process selection from the custom dropdown
    const handleProcessSelect = (processName) => {
        setSelectedProcess(processName);
        setSearchTerm(processName); // Set search term to the selected process name
        setIsDropdownOpen(false); // Close dropdown
    };

    return (
        <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">
                ⚙️ Search Operator Scores by Process
            </h1>
            
            {/* --- Dropdown and Search Section --- */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <label className="block text-lg font-medium text-gray-700 mb-2">
                    Select Process:
                </label>
                <div className="relative w-full max-w-sm">
                    {/* Search Input Field */}
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => setIsDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)} // Delay to allow click on item
                        placeholder={selectedProcess || "Start typing to search..."}
                        className="p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 w-full transition duration-150 ease-in-out"
                    />

                    {/* Custom Dropdown List */}
                    {isDropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                            {filteredProcesses.length > 0 ? (
                                filteredProcesses.map((p) => (
                                    <div
                                        key={p._id}
                                        onClick={() => handleProcessSelect(p.name)}
                                        className={`p-3 cursor-pointer hover:bg-indigo-100 ${p.name === selectedProcess ? 'bg-indigo-50 font-semibold' : ''}`}
                                    >
                                        {p.name}
                                    </div>
                                ))
                            ) : (
                                <div className="p-3 text-gray-500">No processes found.</div>
                            )}
                        </div>
                    )}
                </div>
                
                <div className="text-gray-500 mt-4">
                    {loading && (
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-500 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    )}
                    {!loading && selectedProcess && <span className="text-green-600">Selected Process: {selectedProcess}</span>}
                </div>
            </div>

            {/* --- Results and Message Section --- */}
            {message && (
                <p className={`mb-4 p-3 rounded-lg ${results.length > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message}
                </p>
            )}

            {/* --- Operator Table --- */}
            {results.length > 0 && (
                <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                    <h2 className="text-xl font-semibold p-4 border-b bg-indigo-50 text-indigo-800">
                        Operator Score List ({results[0].processName})
                    </h2>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Serial No.
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Operator Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Operator ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Score (Highest)
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {results.map((op, index) => (
                                <tr key={op._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{op.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{op.operatorId}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">{op.score}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
             {!loading && !selectedProcess && allProcesses.length > 0 && (
                <p className="text-center text-gray-500 mt-10">
                    Please select a process from the list.
                </p>
            )}
        </div>
    );
}