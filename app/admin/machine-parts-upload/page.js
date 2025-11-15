"use client";

import React, { useState, useEffect } from 'react';
import { RefreshCw, Zap, Settings, Loader2, CheckCircle, XCircle } from 'lucide-react';

// Main component for adding a machine part
export default function App() {
  const [formData, setFormData] = useState({
    machineId: '',
    partName: '',
    uniquePartId: '',
    nextServiceDate: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Auto-generate uniquePartId when machineId or partName changes
  useEffect(() => {
    if (formData.machineId && formData.partName) {
      const generatedUniqueId = `${formData.machineId}-${formData.partName}`;
      setFormData(prev => ({
        ...prev,
        uniquePartId: generatedUniqueId
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        uniquePartId: ''
      }));
    }
  }, [formData.machineId, formData.partName]);

  // Helper function to handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Prevent manual changes to uniquePartId
    if (name === 'uniquePartId') {
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Helper function to reset the form state
  const resetForm = () => {
    setFormData({
      machineId: '',
      partName: '',
      uniquePartId: '',
      nextServiceDate: '',
    });
    setStatusMessage(null);
    setIsSuccess(false);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);
    setIsSuccess(false);

    const { machineId, ...partData } = formData;
    
    // Validate that uniquePartId is properly generated
    if (!partData.uniquePartId || partData.uniquePartId !== `${machineId}-${partData.partName}`) {
      setStatusMessage('Error: Unique Part ID validation failed. Please check Machine ID and Part Name.');
      setIsSuccess(false);
      setIsLoading(false);
      return;
    }

    // Prepare data for API
    const bodyPayload = {
      ...partData,
      nextServiceDate: partData.nextServiceDate || null, // Ensure empty string becomes null
    };

    // API URL dynamically built from the machineId input
    const apiUrl = `/api/machines/${machineId}/parts-upload`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
      });

      const result = await response.json();

      if (response.ok) {
        setStatusMessage(`Successfully added part "${partData.partName}" to Machine ID: ${machineId}.`);
        setIsSuccess(true);
        // Reset form on successful submission
        setTimeout(() => resetForm(), 2000);
      } else {
        setStatusMessage(result.error || `Error: Could not add part. Status: ${response.status}`);
        setIsSuccess(false);
      }
    } catch (error) {
      console.error('API Error:', error);
      setStatusMessage('Network error or server connection failed.');
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 flex items-center justify-center font-[Inter]">
      <div className="w-full max-w-2xl bg-white shadow-2xl rounded-xl p-6 sm:p-10 border border-indigo-100">
        
        {/* Header */}
        <div className="flex items-center space-x-3 mb-8 border-b pb-4">
          <Settings className="w-8 h-8 text-indigo-600" />
          <h1 className="text-3xl font-extrabold text-gray-800">
            Add New Machine Part
          </h1>
        </div>
        
        {/* Status Message */}
        {statusMessage && (
          <div className={`p-4 mb-6 rounded-lg flex items-center space-x-3 transition-all duration-300 ${isSuccess ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'}`}>
            {isSuccess ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            <p className="font-medium text-sm">{statusMessage}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Machine ID */}
          <div className="grid gap-2">
            <label htmlFor="machineId" className="text-sm font-semibold text-gray-700">
              Machine Unique ID <span className="text-red-500">*</span>
            </label>
            <input
              id="machineId"
              name="machineId"
              type="text"
              required
              value={formData.machineId}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
              placeholder="e.g., LOCK-STITCH-03"
            />
            <p className="text-xs text-gray-500">The unique ID of the machine where the part will be added.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            
            {/* Part Name */}
            <div className="grid gap-2">
              <label htmlFor="partName" className="text-sm font-semibold text-gray-700">
                Part Name <span className="text-red-500">*</span>
              </label>
              <input
                id="partName"
                name="partName"
                type="text"
                required
                value={formData.partName}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                placeholder="e.g., Oil Filter"
              />
            </div>

            {/* Unique Part ID (Read-only) */}
            <div className="grid gap-2">
              <label htmlFor="uniquePartId" className="text-sm font-semibold text-gray-700">
                Unique Part ID <span className="text-red-500">*</span>
              </label>
              <input
                id="uniquePartId"
                name="uniquePartId"
                type="text"
                required
                readOnly
                value={formData.uniquePartId}
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                placeholder="Auto-generated: (MachineID-PartName)"
              />
              <p className="text-xs text-gray-500">Auto-generated and cannot be modified</p>
            </div>
          </div>
          
          {/* Next Service Date */}
          <div className="grid gap-2">
            <label htmlFor="nextServiceDate" className="text-sm font-semibold text-gray-700">
              Next Service Date <span className="text-red-500">*</span>
            </label>
            <input
              id="nextServiceDate"
              name="nextServiceDate"
              type="date"
              required
              value={formData.nextServiceDate}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
            />
            <p className="text-xs text-gray-500">The date when this part should be serviced next.</p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center space-x-2 px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-150 disabled:opacity-50"
              disabled={isLoading}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset Form</span>
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 disabled:bg-indigo-400 disabled:cursor-not-allowed"
              disabled={isLoading || !formData.uniquePartId}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Adding Part...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span>Add Part Configuration</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}