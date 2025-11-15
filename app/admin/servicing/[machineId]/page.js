'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';


export default function ServicingPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  
  const machineId = params.machineId;
  const partNameFromUrl = searchParams.get('partName');

  const [machine, setMachine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [targetPart, setTargetPart] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    servicedBy: '',
    description: '',
    nextIntervalDays: '',
    nextServiceDate: '',
  });

  // Fetch machine data and find the specific part
  useEffect(() => {
    const fetchMachineAndFindPart = async () => {
      try {
        setLoading(true);

        // 1. Fetch machine data
        const machineResponse = await fetch(`/api/machines/${machineId}`);

        if (!machineResponse.ok) {
          throw new Error('Machine not found');
        }

        const machineData = await machineResponse.json();

        if (!machineData.success || !machineData.machine) {
          setMessage('Machine not found');
          return;
        }

        const machine = machineData.machine;
        setMachine(machine);

        // 2. Find the specific part from URL parameter
        if (partNameFromUrl) {
          const foundPart = machine.parts.find(
            (part) => part.partName === partNameFromUrl
          );

          if (foundPart) {
            setTargetPart(foundPart);

            // 3. Check if notification exists for this specific part
            const notificationResponse = await fetch(
              '/api/check-servicing-status',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  uniqueId: machine.uniqueId,
                  partName: partNameFromUrl,
                }),
              }
            );

            const notificationData = await notificationResponse.json();

            if (
              !notificationData.success ||
              !notificationData.hasNotification
            ) {
              setMessage(
                'This part has already been serviced or notification not found.'
              );
            }
          } else {
            setMessage(`Part "${partNameFromUrl}" not found in this machine.`);
          }
        } else {
          setMessage('No part specified for service.');
        }
      } catch (error) {
        console.error('Error:', error);
        setMessage('Error loading machine data');
      } finally {
        setLoading(false);
      }
    };

    if (machineId) {
      fetchMachineAndFindPart();
    }
  }, [machineId, partNameFromUrl]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const newState = {
        ...prev,
        [name]: value,
      };

      // যদি নেক্সট সার্ভিস ডেট পরিবর্তন হয়
      if (name === 'nextServiceDate') {
        // ডেট সিলেক্ট করা হলে ইন্টারভ্যাল ডেইজ বাতিল হবে
        if (value) {
          newState.nextIntervalDays = '';
        }
      }

      // যদি নেক্সট ইন্টারভ্যাল ডেইজ পরিবর্তন হয়
      if (name === 'nextIntervalDays') {
        // যদি ডেইজ ইনপুট দেওয়া হয়, তবে ডেট বাতিল হবে
        if (value) {
          newState.nextServiceDate = '';
        }
      }

      return newState;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!targetPart) {
      setMessage('No part selected for service');
      return;
    }

    if (!formData.servicedBy.trim()) {
      setMessage('Please enter serviced by information');
      return;
    }

    // ডেট ভ্যালিডেশন
    if (formData.nextServiceDate) {
      const selectedDate = new Date(formData.nextServiceDate);
      const lastServicedDate = targetPart.lastServicedDate
        ? new Date(targetPart.lastServicedDate)
        : null;

      // আজকের তারিখ থেকে পরের তারিখ হতে হবে
      const today = new Date();
      today.setHours(0, 0, 0, 0); // শুধু তারিখের অংশ তুলনা করার জন্য

      if (selectedDate <= today) {
        setMessage(
          'Next Service Date must be a future date (after today).'
        );
        return;
      }
      
      // lastServicedDate এর পরের তারিখ হতে হবে, যদি lastServicedDate থাকে
      if (lastServicedDate && selectedDate <= lastServicedDate) {
        setMessage(
          'Next Service Date must be after the Last Serviced Date.'
        );
        return;
      }
    }

    setSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/servicing/complete-part', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          machineId: machine._id,
          partUniqueId: targetPart.uniquePartId,
          partName: targetPart.partName,
          servicedBy: formData.servicedBy,
          description: formData.description,
          nextIntervalDays: formData.nextIntervalDays
            ? parseInt(formData.nextIntervalDays)
            : undefined,
          nextServiceDate: formData.nextServiceDate || undefined, 
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Service completed successfully! Redirecting...');
        
        
        // ফর্ম রিসেট
        setFormData({
          servicedBy: '',
          description: '',
          nextIntervalDays: '',
          nextServiceDate: '',
        });
        
        // কিছুক্ষণ পর হোম পেজে রিডাইরেক্ট
        setTimeout(() => {
          router.push('/admin');
        }, 2000);
      } else {
        setMessage(data.message || 'Error completing service');
      }
    } catch (error) {
      console.error('Error submitting service:', error);
      setMessage('Error completing service');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading machine data...</p>
        </div>
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Machine Not Found</h1>
          <p className="mt-2 text-gray-600">{message}</p>
          <button 
            onClick={() => router.push('/admin')}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Back to Admin
          </button>
        </div>
      </div>
    );
  }

  // যদি পার্ট না পাওয়া যায় বা ইতিমধ্যে সার্ভিস করা হয়ে থাকে
  if (!targetPart || message.includes('already been serviced')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-yellow-600">
            {!targetPart ? 'Part Not Found' : 'Already Serviced'}
          </h1>
          <p className="mt-2 text-gray-600">{message}</p>
          <div className="mt-4 bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-2">Machine Information:</h3>
            <p><strong>Name:</strong> {machine.machineName}</p>
            <p><strong>ID:</strong> {machine.uniqueId}</p>
            <p><strong>Model:</strong> {machine.model}</p>
          </div>
          <button 
            onClick={() => router.push('/admin')}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Back to Admin
          </button>
        </div>
      </div>
    );
  }

  // Helper function to get the minimum date for the next service date input
  const getMinDate = () => {
    // যদি lastServicedDate থাকে, তবে তার পরের দিন থেকে min date শুরু হবে
    if (targetPart?.lastServicedDate) {
      const lastDate = new Date(targetPart.lastServicedDate);
      lastDate.setDate(lastDate.getDate() + 1); // পরের দিন
      return lastDate.toISOString().split('T')[0];
    }
    
    // নাহলে আজকের তারিখ
    const today = new Date();
    today.setDate(today.getDate() + 1); // আজকের পরের দিন
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <button
            onClick={() => router.push('/admin')}
            className="text-blue-500 hover:text-blue-600 mb-4 flex items-center font-medium"
          >
            ← Back to Admin
          </button>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Complete Service - {machine.machineName}
          </h1>
          <p className="text-gray-600">Machine ID: {machine.uniqueId}</p>
          <p className="text-gray-600">Model: {machine.model}</p>

          {/* Target Part Info */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="font-semibold text-blue-800 mb-2">Service For:</h3>
            <p className="text-blue-700 font-medium text-lg">
              {targetPart.partName}
            </p>
          </div>
        </div>

        {/* Target Part Details */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Part Information
          </h2>
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 text-lg mb-3">
              {targetPart.partName}
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Last Serviced:</span>
                <p className="font-medium">
                  {targetPart.lastServicedDate
                    ? new Date(targetPart.lastServicedDate).toLocaleDateString()
                    : 'Never'}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Next Service:</span>
                <p className="font-medium">
                  {targetPart.nextServiceDate
                    ? new Date(targetPart.nextServiceDate).toLocaleDateString()
                    : 'Not scheduled'}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Default Interval:</span>
                <p className="font-medium">
                  {targetPart.defaultIntervalDays} days
                </p>
              </div>
              <div>
                <span className="text-gray-600">Current Interval:</span>
                <p className="font-medium">
                  {targetPart.customIntervalDays ||
                    targetPart.defaultIntervalDays}{' '}
                  days
                </p>
              </div>
            </div>
            <div className="mt-3">
              <span className="inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                Needs Service
              </span>
            </div>
          </div>
        </div>

        {/* Service Form - শুধুমাত্র target part এর জন্য */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Service Details
          </h2>

          <div className="space-y-4">
            {/* Serviced By */}
            <div>
              <label
                htmlFor="servicedBy"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Serviced By *
              </label>
              <input
                type="text"
                id="servicedBy"
                name="servicedBy"
                value={formData.servicedBy}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter technician name"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Service Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the service performed..."
              />
            </div>

            {/* Next Service Interval (days) & Next Service Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Next Service Schedule (Optional)
              </label>
              <div className="flex space-x-4">
                {/* Interval Days Input */}
                <div className="flex-1">
                  <label htmlFor="nextIntervalDays" className="block text-xs font-medium text-gray-500 mb-1">
                    Interval (days)
                  </label>
                  <input
                    type="number"
                    id="nextIntervalDays"
                    name="nextIntervalDays"
                    value={formData.nextIntervalDays}
                    onChange={handleInputChange}
                    min="1"
                    // যদি nextServiceDate সিলেক্ট করা থাকে তবে এটি disabled হবে
                    disabled={!!formData.nextServiceDate}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      formData.nextServiceDate
                        ? 'bg-gray-100 border-gray-200'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                    }`}
                    placeholder="E.g. 365"
                  />
                </div>

                <div className="flex items-center text-gray-500">
                  <span className="mt-5">OR</span>
                </div>

                {/* Next Service Date Input */}
                <div className="flex-1">
                  <label htmlFor="nextServiceDate" className="block text-xs font-medium text-gray-500 mb-1">
                    Specific Date
                  </label>
                  <input
                    type="date"
                    id="nextServiceDate"
                    name="nextServiceDate"
                    value={formData.nextServiceDate}
                    onChange={handleInputChange}
                    // min date সেট করা হয়েছে যাতে lastServicedDate এর পরের তারিখ সিলেক্ট করা যায়
                    min={getMinDate()}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-2">
                Specify either an <strong>Interval in Days</strong> or a <strong>Specific Date</strong> for the next service. Selecting a date will ignore the interval. The date must be a future date and after the last service date.
              </p>
            </div>

            {/* Message */}
            {message && (
              <div
                className={`p-3 rounded-md ${
                  message.includes('Successfully') ||
                  message.includes('successfully')
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : message.includes('already') || message.includes('Not found')
                    ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {message}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-3 px-4 rounded-md transition duration-150 ease-in-out"
            >
              {submitting
                ? 'Completing Service...'
                : `Complete Service for ${targetPart.partName}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}