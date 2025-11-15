'use client';
import { useState, useEffect } from 'react';

export default function StyleForm({ style = null, onSuccess }) {
  const [formData, setFormData] = useState({
    name: style?.name || '',
    buyerId: style?.buyerId?._id || style?.buyerId || '',
    description: style?.description || ''
  });
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [buyersLoading, setBuyersLoading] = useState(true);

  useEffect(() => {
    fetchBuyers();
  }, []);

  const fetchBuyers = async () => {
    try {
      const response = await fetch('/api/buyers');
      const result = await response.json();
      
      if (result.success) {
        setBuyers(result.data);
      }
    } catch (error) {
      console.error('Error fetching buyers:', error);
    } finally {
      setBuyersLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.buyerId) {
      setMessage('Please select a buyer');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const url = style ? `/api/styles/${style._id}` : '/api/styles';
      const method = style ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setMessage(style ? 'Style updated successfully!' : 'Style created successfully!');
        setFormData({
          name: '',
          buyerId: '',
          description: ''
        });
        if (onSuccess) onSuccess();
      } else {
        setMessage(result.error || 'Something went wrong!');
      }
    } catch (error) {
      setMessage('Network error!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {style ? 'Edit Style' : 'Add New Style'}
      </h2>
      
      {message && (
        <div className={`p-3 rounded mb-4 ${
          message.includes('successfully') 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Buyer Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Buyer *
          </label>
          {buyersLoading ? (
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100">
              Loading buyers...
            </div>
          ) : (
            <select
              name="buyerId"
              value={formData.buyerId}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a buyer</option>
              {buyers.map((buyer) => (
                <option key={buyer._id} value={buyer._id}>
                  {buyer.name} - {buyer.email}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Style Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Style Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter style name"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter style description"
          />
        </div>

        <button
          type="submit"
          disabled={loading || buyersLoading}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : (style ? 'Update Style' : 'Add Style')}
        </button>
      </form>
    </div>
  );
}