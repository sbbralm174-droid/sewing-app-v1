'use client'
import { useState, useEffect } from 'react';
import SidebarNavLayout from '@/components/SidebarNavLayout';

export default function MachineForm() {
  const [formData, setFormData] = useState({
    uniqueId: '',
    machineType: '',
    brandName: '',
    companyUniqueNumber: '',
    installationDate: '',
    price: '',
    model: '',
    origin: '',
    warrantyYears: '',
    nextServiceDate: '',
    currentStatus: 'idle',
    lastLocation: {
      locationName: '',
      supervisor: '',
      date: ''
    }
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
        lastLocation: {
          ...prev.lastLocation,
          [locationField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/machines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setFormData({
          uniqueId: '',
          machineType: '',
          brandName: '',
          companyUniqueNumber: '',
          installationDate: '',
          price: '',
          model: '',
          origin: '',
          warrantyYears: '',
          nextServiceDate: '',
          currentStatus: 'idle',
          lastLocation: {
            locationName: '',
            supervisor: '',
            date: ''
          }
        });

        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (error) {
      console.error('Error:', error);
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
        
        // Populate form with search result
        if (data) {
          setFormData({
            uniqueId: data.uniqueId || '',
            machineType: data.machineType?._id || '',
            brandName: data.brandName || '',
            companyUniqueNumber: data.companyUniqueNumber || '',
            installationDate: data.installationDate ? 
              new Date(data.installationDate).toISOString().split('T')[0] : '',
            price: data.price || '',
            model: data.model || '',
            origin: data.origin || '',
            warrantyYears: data.warrantyYears || '',
            nextServiceDate: data.nextServiceDate ? 
              new Date(data.nextServiceDate).toISOString().split('T')[0] : '',
            currentStatus: data.currentStatus || 'idle',
            lastLocation: {
              locationName: data.lastLocation?.locationName || '',
              supervisor: data.lastLocation?.supervisor || '',
              date: data.lastLocation?.date ? 
                new Date(data.lastLocation.date).toISOString().split('T')[0] : ''
            }
          });
        }
      } else {
        setSearchResult(null);
        setError(data.error || 'Machine not found');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to search machine');
    }
  };

  const handleDelete = async () => {
    if (!searchUniqueId.trim()) {
      setError('Please enter a Unique ID to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete machine with ID: ${searchUniqueId}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/machines?uniqueId=${searchUniqueId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setDeleteSuccess(true);
        setSearchResult(null);
        setSearchUniqueId('');
        setFormData({
          uniqueId: '',
          machineType: '',
          brandName: '',
          companyUniqueNumber: '',
          installationDate: '',
          price: '',
          model: '',
          origin: '',
          warrantyYears: '',
          nextServiceDate: '',
          currentStatus: 'idle',
          lastLocation: {
            locationName: '',
            supervisor: '',
            date: ''
          }
        });
        
        setTimeout(() => setDeleteSuccess(false), 3000);
      } else {
        setError(data.error || 'Failed to delete machine');
      }
    } catch (error) {
      console.error('Delete error:', error);
      setError('Failed to delete machine');
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1B22] text-[#E5E9F0] font-sans flex">
      <SidebarNavLayout />
      
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Machine Management</h1>

          {/* Search and Delete Section */}
          <div className="bg-[#2D3039] p-4 rounded-lg mb-6">
            <h2 className="text-lg font-semibold mb-4">Search / Delete Machine</h2>
            <div className="flex gap-4 mb-4">
              <input
                type="text"
                placeholder="Enter Unique ID to search"
                value={searchUniqueId}
                onChange={(e) => setSearchUniqueId(e.target.value)}
                className="flex-1 p-2 rounded-md border-transparent bg-[#1A1B22] text-[#E5E9F0]"
              />
              <button
                onClick={handleSearch}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Search
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
              >
                Delete
              </button>
            </div>
            
            {searchResult && (
              <div className="p-3 bg-green-900/30 border border-green-700 rounded-md">
                <p className="text-green-400">✓ Machine found: {searchResult.uniqueId}</p>
              </div>
            )}
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-4 p-3 bg-green-600 text-white text-center rounded">
              Machine added successfully!
            </div>
          )}
          
          {deleteSuccess && (
            <div className="mb-4 p-3 bg-green-600 text-white text-center rounded">
              Machine deleted successfully!
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-3 bg-red-600 text-white text-center rounded">
              {error}
            </div>
          )}

          {/* Machine Form */}
          <div className="bg-[#2D3039] p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-6">Add / Edit Machine</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="font-medium text-blue-300">Basic Information</h3>
                  
                  <div>
                    <label className="block mb-1 text-sm font-medium">Unique ID *</label>
                    <input
                      type="text"
                      name="uniqueId"
                      value={formData.uniqueId}
                      onChange={handleChange}
                      className="w-full p-2 rounded-md border-transparent bg-[#1A1B22] text-[#E5E9F0]"
                      required
                      disabled={!!searchResult}
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-1 text-sm font-medium">Machine Type *</label>
                    <select
                      name="machineType"
                      value={formData.machineType}
                      onChange={handleChange}
                      className="w-full p-2 rounded-md border-transparent bg-[#1A1B22] text-[#E5E9F0]"
                      required
                    >
                      <option value="">Select Machine Type</option>
                      {machineTypes.map((type) => (
                        <option key={type._id} value={type._id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block mb-1 text-sm font-medium">Brand Name *</label>
                    <input
                      type="text"
                      name="brandName"
                      value={formData.brandName}
                      onChange={handleChange}
                      className="w-full p-2 rounded-md border-transparent bg-[#1A1B22] text-[#E5E9F0]"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-1 text-sm font-medium">Company Unique Number</label>
                    <input
                      type="text"
                      name="companyUniqueNumber"
                      value={formData.companyUniqueNumber}
                      onChange={handleChange}
                      className="w-full p-2 rounded-md border-transparent bg-[#1A1B22] text-[#E5E9F0]"
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-1 text-sm font-medium">Model</label>
                    <input
                      type="text"
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      className="w-full p-2 rounded-md border-transparent bg-[#1A1B22] text-[#E5E9F0]"
                    />
                  </div>
                </div>

                {/* Installation & Location */}
                <div className="space-y-4">
                  <h3 className="font-medium text-blue-300">Installation & Location</h3>
                  
                  <div>
                    <label className="block mb-1 text-sm font-medium">Installation Date</label>
                    <input
                      type="date"
                      name="installationDate"
                      value={formData.installationDate}
                      onChange={handleChange}
                      className="w-full p-2 rounded-md border-transparent bg-[#1A1B22] text-[#E5E9F0]"
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-1 text-sm font-medium">Price</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      className="w-full p-2 rounded-md border-transparent bg-[#1A1B22] text-[#E5E9F0]"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-1 text-sm font-medium">Origin</label>
                    <input
                      type="text"
                      name="origin"
                      value={formData.origin}
                      onChange={handleChange}
                      className="w-full p-2 rounded-md border-transparent bg-[#1A1B22] text-[#E5E9F0]"
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-1 text-sm font-medium">Warranty Years</label>
                    <input
                      type="number"
                      name="warrantyYears"
                      value={formData.warrantyYears}
                      onChange={handleChange}
                      className="w-full p-2 rounded-md border-transparent bg-[#1A1B22] text-[#E5E9F0]"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-1 text-sm font-medium">Next Service Date</label>
                    <input
                      type="date"
                      name="nextServiceDate"
                      value={formData.nextServiceDate}
                      onChange={handleChange}
                      className="w-full p-2 rounded-md border-transparent bg-[#1A1B22] text-[#E5E9F0]"
                    />
                  </div>
                </div>

                {/* Location Information */}
                <div className="md:col-span-2 space-y-4">
                  <h3 className="font-medium text-blue-300">Location Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block mb-1 text-sm font-medium">Location Name</label>
                      <input
                        type="text"
                        name="lastLocation.locationName"
                        value={formData.lastLocation.locationName}
                        onChange={handleChange}
                        className="w-full p-2 rounded-md border-transparent bg-[#1A1B22] text-[#E5E9F0]"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium">Supervisor</label>
                      <input
                        type="text"
                        name="lastLocation.supervisor"
                        value={formData.lastLocation.supervisor}
                        onChange={handleChange}
                        className="w-full p-2 rounded-md border-transparent bg-[#1A1B22] text-[#E5E9F0]"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium">Location Date</label>
                      <input
                        type="date"
                        name="lastLocation.date"
                        value={formData.lastLocation.date}
                        onChange={handleChange}
                        className="w-full p-2 rounded-md border-transparent bg-[#1A1B22] text-[#E5E9F0]"
                      />
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block mb-1 text-sm font-medium">Current Status</label>
                  <select
                    name="currentStatus"
                    value={formData.currentStatus}
                    onChange={handleChange}
                    className="w-full p-2 rounded-md border-transparent bg-[#1A1B22] text-[#E5E9F0]"
                  >
                    <option value="idle">Idle</option>
                    <option value="running">Running</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      uniqueId: '',
                      machineType: '',
                      brandName: '',
                      companyUniqueNumber: '',
                      installationDate: '',
                      price: '',
                      model: '',
                      origin: '',
                      warrantyYears: '',
                      nextServiceDate: '',
                      currentStatus: 'idle',
                      lastLocation: {
                        locationName: '',
                        supervisor: '',
                        date: ''
                      }
                    });
                    setSearchResult(null);
                    setSearchUniqueId('');
                  }}
                  className="px-4 py-2 border border-gray-600 rounded-md hover:bg-gray-800"
                >
                  Clear Form
                </button>
                
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
                >
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