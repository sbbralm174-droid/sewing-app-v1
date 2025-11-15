"use client";

import React, { useState } from 'react';
import SidebarNavLayout from '@/components/SidebarNavLayout';



// Utility function to format date
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'UTC'
        });
    } catch (e) {
        return 'Invalid Date';
    }
};

const DeleteProductionEntry = () => {
    const [searchId, setSearchId] = useState('');
    const [searchDate, setSearchDate] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setResults([]);
        setMessage('');

        if (!searchId && !searchDate) {
            setMessage('Please enter an Operator ID or a Date to search.');
            setLoading(false);
            return;
        }

        const queryParams = new URLSearchParams();
        if (searchId) queryParams.append('operatorId', searchId);
        if (searchDate) queryParams.append('date', searchDate);

        try {
            const res = await fetch(`/api/daily-production/delete?${queryParams.toString()}`);
            if (!res.ok) {
                throw new Error('Failed to fetch data');
            }
            const data = await res.json();
            setResults(data);
            if (data.length === 0) {
                setMessage('No entries found matching the criteria.');
            }
        } catch (error) {
            setMessage('Error searching: ' + error.message);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to permanently delete this production entry?')) {
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            const res = await fetch('/api/daily-production/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ _id: id }),
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || 'Failed to delete entry.');
            }

            setMessage(`Success! Entry ID: ${id} deleted.`);
            // Refresh results after successful deletion
            setResults(prev => prev.filter(entry => entry._id !== id));
            if (results.length === 1) { // If it was the last result, clear the message
                setMessage('Success! Last entry deleted.');
            }

        } catch (error) {
            setMessage('Deletion Error: ' + error.message);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
            <SidebarNavLayout/>
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-extrabold text-indigo-700 mb-6 border-b-4 border-indigo-200 pb-2">
                    Production Entry Deletion
                </h1>
                <p className="text-gray-600 mb-8">
                    Search for daily production entries using Operator ID and Date, then select an entry to permanently delete it.
                </p>

                {/* Search Form Card */}
                <div className="bg-white p-6 rounded-xl shadow-2xl mb-8 border border-indigo-100">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="operatorId" className="block text-sm font-medium text-gray-700">
                                    Operator ID (Required for deletion)
                                </label>
                                <input
                                    type="text"
                                    id="operatorId"
                                    value={searchId}
                                    onChange={(e) => setSearchId(e.target.value)}
                                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                                    placeholder="e.g., OP-456"
                                />
                            </div>
                            <div>
                                <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                                    Date (Optional, for precise search)
                                </label>
                                <input
                                    type="date"
                                    id="date"
                                    value={searchDate}
                                    onChange={(e) => setSearchDate(e.target.value)}
                                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                                />
                            </div>
                        </div>
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition duration-150"
                            >
                                {loading ? (
                                    <svg className="animate-spin h-5 w-5 text-white mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : 'Search Entries'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Status Message */}
                {message && (
                    <div className={`p-4 mb-6 rounded-lg font-medium ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {message}
                    </div>
                )}

                {/* Results Table */}
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Search Results ({results.length})</h2>
                {results.length > 0 && (
                    <div className="bg-white rounded-xl shadow-2xl overflow-x-auto border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-indigo-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operator Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Machine</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {results.map((entry) => (
                                    <tr key={entry._id} className="hover:bg-yellow-50 transition duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(entry.date)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.operator?.operatorName || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.uniqueMachine || 'N/A (Helper)'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${entry.workAs === 'operator' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                                {entry.workAs}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => handleDelete(entry._id)}
                                                disabled={loading}
                                                className="text-red-600 hover:text-red-900 font-semibold disabled:opacity-50 transition duration-150 bg-red-50 p-2 rounded-lg shadow-sm hover:shadow-md"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeleteProductionEntry;
