'use client';

import { useState } from 'react';
import Head from 'next/head';
import Layout from '@/components/Layout';
import SidebarNavLayout from '@/components/SidebarNavLayout';

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

<style jsx>{`
  @keyframes slideUpFade {
    0% {
      transform: translateY(60px);
      opacity: 0;
    }
    100% {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .animate-card-entry {
    animation: slideUpFade 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  /* ===== Premium Purple Button ===== */
  .btn-purple-premium {
    position: relative;
    overflow: hidden;
    border-radius: 10px;
    color: #ffffff;
    font-weight: 700;
    background: linear-gradient(135deg, #7e22ce, #9333ea, #6b21a8);
    box-shadow: 0 10px 25px rgba(126, 34, 206, 0.35);
    transition: transform 0.4s ease, box-shadow 0.4s ease;
  }

  .btn-purple-premium::before {
    content: '';
    position: absolute;
    top: 0;
    left: -120%;
    width: 120%;
    height: 100%;
    background: linear-gradient(
      120deg,
      transparent,
      rgba(255, 255, 255, 0.35),
      transparent
    );
    transition: left 0.8s ease;
  }

  .btn-purple-premium:hover::before {
    left: 120%;
  }

  .btn-purple-premium:hover {
    transform: translateY(-3px);
    box-shadow: 0 18px 40px rgba(126, 34, 206, 0.55);
  }

  .btn-purple-premium:active {
    transform: scale(0.97);
  }

  .btn-purple-premium:disabled {
    background: #c4b5fd;
    box-shadow: none;
    cursor: not-allowed;
  }
`}</style>
      
        <Head>
          <title>Floor Entry System</title>
        </Head>
        <SidebarNavLayout />
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#a162e8] via-[#8a43d6] to-[#6b21a8] text-[#E5E9F0]  p-4 font-sans">
        <main className="bg-[#ffffff] p-8 rounded-xl shadow-lg w-full max-w-md animate-card-entry">
            <h1 className="text-3xl font-bold text-[#6b21a8] text-center mb-6">Add New Floor</h1>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="floorName" className="block text-[#9333ea] font-semibold mb-2">
                  Floor Name:
                </label>
                <input
                  id="floorName"
                  type="text"
                  value={floorName}
                  onChange={(e) => setFloorName(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-transparent text-[#E5E9F0] border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-800 placeholder:text-gray-900"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-purple-premium py-3 px-4"
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
      
    </>
  );
}