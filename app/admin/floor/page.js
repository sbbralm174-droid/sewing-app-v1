'use client';

import { useState } from 'react';
import Head from 'next/head';
import Layout from '@/components/Layout';

export default function FloorEntryPage() {
  const [floorName, setFloorName] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);
    setIsLoading(true);

    try {
      const res = await fetch('/api/floors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ floorName }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Floor entered successfully! 🎉');
        setFloorName('');
      } else {
        setMessage(`Error: ${data.error || 'Something went wrong.'}`);
        setIsError(true);
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Layout>
        <Head>
          <title>Floor Entry System</title>
        </Head>
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#1A1B22] p-4 font-sans">
          <main className="bg-[#2D3039] p-8 rounded-xl shadow-lg w-full max-w-md">
            <h1 className="text-3xl font-bold text-[#E5E9F0] text-center mb-6">Add New Floor</h1>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="floorName" className="block text-[#E5E9F0] font-semibold mb-2">
                  Floor Name:
                </label>
                <input
                  id="floorName"
                  type="text"
                  value={floorName}
                  onChange={(e) => setFloorName(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-transparent text-[#E5E9F0] border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 transition-colors duration-300 disabled:bg-gray-400 disabled:text-gray-200"
              >
                {isLoading ? 'Adding Floor...' : 'Add Floor'}
              </button>
            </form>
            {message && (
              <p className={`mt-4 text-center font-bold ${isError ? 'text-red-400' : 'text-green-400'}`}>
                {message}
              </p>
            )}
          </main>
        </div>
      </Layout>
    </>
  );
}