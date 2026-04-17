'use client'
import { useState, useEffect } from 'react';
import SidebarNavLayout from '@/components/SidebarNavLayout';

export default function MachineForm() {
  const [formData, setFormData] = useState({
    uniqueId: '', machineType: '', brandName: '', companyUniqueNumber: '',
    installationDate: '', price: '', model: '', origin: '',
    warrantyYears: '', nextServiceDate: '', currentStatus: 'idle',
    lastLocation: { locationName: '', supervisor: '', date: '' }
  });
  
  const [machineTypes, setMachineTypes] = useState([]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [searchUniqueId, setSearchUniqueId] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  useEffect(() => {
    const fetchMachineTypes = async () => {
      try {
        const response = await fetch('/api/machine-types');
        const data = await response.json();
        setMachineTypes(data);
      } catch (error) {
        console.error('Error fetching machine types:', error);
      }
    };
    fetchMachineTypes();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('lastLocation.')) {
      const locationField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        lastLocation: { ...prev.lastLocation, [locationField]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(false);
    try {
      const response = await fetch('/api/machines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(true);
        setFormData({
          uniqueId: '', machineType: '', brandName: '', companyUniqueNumber: '',
          installationDate: '', price: '', model: '', origin: '',
          warrantyYears: '', nextServiceDate: '', currentStatus: 'idle',
          lastLocation: { locationName: '', supervisor: '', date: '' }
        });
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (error) {
      setError('Failed to submit form');
    }
  };

  const handleSearch = async () => {
    if (!searchUniqueId.trim()) {
      setError('Please enter a Unique ID to search');
      return;
    }
    try {
      const response = await fetch(`/api/machines?uniqueId=${searchUniqueId}`);
      const data = await response.json();
      if (response.ok) {
        setSearchResult(data);
        setError('');
        if (data) {
          setFormData({
            uniqueId: data.uniqueId || '',
            machineType: data.machineType?._id || '',
            brandName: data.brandName || '',
            companyUniqueNumber: data.companyUniqueNumber || '',
            installationDate: data.installationDate ? new Date(data.installationDate).toISOString().split('T')[0] : '',
            price: data.price || '',
            model: data.model || '',
            origin: data.origin || '',
            warrantyYears: data.warrantyYears || '',
            nextServiceDate: data.nextServiceDate ? new Date(data.nextServiceDate).toISOString().split('T')[0] : '',
            currentStatus: data.currentStatus || 'idle',
            lastLocation: {
              locationName: data.lastLocation?.locationName || '',
              supervisor: data.lastLocation?.supervisor || '',
              date: data.lastLocation?.date ? new Date(data.lastLocation.date).toISOString().split('T')[0] : ''
            }
          });
        }
      } else {
        setSearchResult(null);
        setError(data.error || 'Machine not found');
      }
    } catch (error) {
      setError('Failed to search machine');
    }
  };

  const handleDelete = async () => {
    if (!searchUniqueId.trim()) {
      setError('Please enter a Unique ID to delete');
      return;
    }
    if (!confirm(`Are you sure? ID: ${searchUniqueId}`)) return;
    try {
      const response = await fetch(`/api/machines?uniqueId=${searchUniqueId}`, { method: 'DELETE' });
      if (response.ok) {
        setDeleteSuccess(true); setSearchResult(null); setSearchUniqueId('');
        setTimeout(() => setDeleteSuccess(false), 3000);
      } else {
        setError('Failed to delete machine');
      }
    } catch (error) {
      setError('Failed to delete machine');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#a162e8] via-[#8a43d6] to-[#6b21a8] text-[#E5E9F0] font-sans flex">
      
      {/* 🚀 ULTRA SMOOTH INTERNAL CSS */}
      <style jsx>{`
        @keyframes softSlideUp {
          from {
            opacity: 0;
            transform: translateY(10px); /* ঝাড়া কম করে দেওয়া হয়েছে */
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .smooth-entry {
          animation: softSlideUp 1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          will-change: transform, opacity;
        }

.super-smooth-hover {
    transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
    background-size: 210% 210%;
    background-position: top right; /* Default state */
  }
  
  /* When hovering, the color shifts smoothly from one corner to the whole button */
  .super-smooth-hover:hover {
    background-position: bottom left; /* Hover state */
  }
    /* কাস্টম বটম শ্যাডো - যা ভাসা ভাসা ফিল দিবে */
  .floating-shadow {
    box-shadow: 0 10px 20px -10px rgba(0, 0, 0, 0.5);
  }
  
  .floating-shadow:hover {
    box-shadow: 0 20px 30px -12px rgba(0, 0, 0, 0.6); /* হোভারে শ্যাডো আরও গভীর হবে */
  }

  /* Define your special linear gradient for Option 1: Yellow/Amber */
  .yellow-amber-gradient {
    background-image: linear-gradient(135deg, #FFB300 0%, #FFB300 50%, #FFC107 50%, #FFC107 100%);
  }

  /* Define your special linear gradient for Option 3: Deep Violet */
  .deep-violet-gradient {
    background-image: linear-gradient(135deg, #5B21B6 0%, #5B21B6 50%, #6D28D9 50%, #6D28D9 100%);
  }


      `}</style>

      <SidebarNavLayout />
      
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Machine Management</h1>

          {/* Search Card */}
          <div className="bg-[#ffffff] p-4 rounded-lg mb-6 shadow-xl text-gray-800 smooth-entry">
            <h2 className="text-lg font-semibold mb-4 text-gray-700">Search / Delete Machine</h2>
            <div className="flex gap-4 mb-4">
              <input
                type="text"
                placeholder="Enter Unique ID"
                value={searchUniqueId}
                onChange={(e) => setSearchUniqueId(e.target.value)}
                className="flex-1 p-2 rounded-md border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
              />
           {/* Search Button */}
<button 
  onClick={handleSearch} 
  className="super-smooth-hover yellow-amber-gradient floating-shadow text-black font-bold px-6 py-2.5 rounded-lg active:scale-95"
>
  Search
</button>

{/* Delete Button */}
<button 
  onClick={handleDelete} 
  className="super-smooth-hover deep-violet-gradient floating-shadow text-white font-medium px-6 py-2.5 rounded-lg border border-purple-900 active:scale-95"
>
  Delete
</button>
            </div>
            {searchResult && (
              <div className="p-3 bg-green-100 border border-green-300 rounded-md">
                <p className="text-green-700 font-medium">✓ Machine found: {searchResult.uniqueId}</p>
              </div>
            )}
          </div>

          {(success || deleteSuccess) && <div className="mb-4 p-3 bg-green-600 text-white text-center rounded shadow-lg animate-bounce">Success!</div>}
          {error && <div className="mb-4 p-3 bg-red-600 text-white text-center rounded shadow-lg">{error}</div>}

          {/* Main Form Card */}
          <div className="bg-white p-6 rounded-lg shadow-xl text-gray-800 smooth-entry" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-lg font-semibold mb-6 text-gray-700">Add / Edit Machine</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Basic Section */}
                <div className="space-y-4">
                  <h3 className="font-medium text-purple-700 border-b border-[#d6bff3] pb-1">Basic Information</h3>
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-600">Unique ID *</label>
                    <input type="text" name="uniqueId" value={formData.uniqueId} onChange={handleChange} className="w-full p-2 rounded-md border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none" required disabled={!!searchResult} />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-600">Machine Type *</label>
                    <select name="machineType" value={formData.machineType} onChange={handleChange} className="w-full p-2 rounded-md border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none" required>
                      <option value="">Select Machine Type</option>
                      {machineTypes.map((type) => (
                        <option key={type._id} value={type._id}>{type.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-600">Brand Name *</label>
                    <input type="text" name="brandName" value={formData.brandName} onChange={handleChange} className="w-full p-2 rounded-md border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-600">Company Unique Number</label>
                    <input type="text" name="companyUniqueNumber" value={formData.companyUniqueNumber} onChange={handleChange} className="w-full p-2 rounded-md border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none" />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-600">Model</label>
                    <input type="text" name="model" value={formData.model} onChange={handleChange} className="w-full p-2 rounded-md border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none" />
                  </div>
                </div>

                {/* Logistics Section */}
                <div className="space-y-4">
                  <h3 className="font-medium text-purple-700 border-b border-[#d6bff3] pb-1">Installation & Financials</h3>
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-600">Installation Date</label>
                    <input type="date" name="installationDate" value={formData.installationDate} onChange={handleChange} className="w-full p-2 rounded-md border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none" />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-600">Price</label>
                    <input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full p-2 rounded-md border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none" min="0" />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-600">Origin</label>
                    <input type="text" name="origin" value={formData.origin} onChange={handleChange} className="w-full p-2 rounded-md border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none" />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-600">Warranty Years</label>
                    <input type="number" name="warrantyYears" value={formData.warrantyYears} onChange={handleChange} className="w-full p-2 rounded-md border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none" min="0" />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-600">Next Service Date</label>
                    <input type="date" name="nextServiceDate" value={formData.nextServiceDate} onChange={handleChange} className="w-full p-2 rounded-md border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none" />
                  </div>
                </div>

                {/* Location Section */}
                <div className="md:col-span-2 space-y-4">
                  <h3 className="font-medium text-purple-700 border-b border-[#d6bff3] pb-1">Current Location</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block mb-1 text-sm font-semibold text-gray-600">Location Name</label>
                      <input type="text" name="lastLocation.locationName" value={formData.lastLocation.locationName} onChange={handleChange} className="w-full p-2 rounded-md border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none" />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-semibold text-gray-600">Supervisor</label>
                      <input type="text" name="lastLocation.supervisor" value={formData.lastLocation.supervisor} onChange={handleChange} className="w-full p-2 rounded-md border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none" />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-semibold text-gray-600">Location Date</label>
                      <input type="date" name="lastLocation.date" value={formData.lastLocation.date} onChange={handleChange} className="w-full p-2 rounded-md border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-semibold text-gray-600">Current Status</label>
                  <select name="currentStatus" value={formData.currentStatus} onChange={handleChange} className="w-full p-2 rounded-md border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none">
                    <option value="idle">Idle</option>
                    <option value="running">Running</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-[#d6bff3]">


                <button type="button" onClick={() => { setFormData({ uniqueId: '', machineType: '', brandName: '', companyUniqueNumber: '', installationDate: '', price: '', model: '', origin: '', warrantyYears: '', nextServiceDate: '', currentStatus: 'idle', lastLocation: { locationName: '', supervisor: '', date: '' } }); setSearchResult(null); setSearchUniqueId(''); }} 
                className="super-smooth-hover yellow-amber-gradient floating-shadow text-black font-bold px-4 py-2 rounded-lg active:scale-95 ">Clear Form</button>
                <button type="submit" className="super-smooth-hover deep-violet-gradient floating-shadow text-white font-medium px-6 py-2 rounded-lg border border-purple-900 active:scale-95">
                 
                 
                  {searchResult ? 'Update Machine' : 'Add Machine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}