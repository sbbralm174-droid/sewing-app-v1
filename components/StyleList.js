'use client';
import { useState, useEffect } from 'react';
import StyleForm from './StyleForm';

export default function StyleList() {
  const [styles, setStyles] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [selectedBuyer, setSelectedBuyer] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingStyle, setEditingStyle] = useState(null);

  useEffect(() => {
    fetchBuyers();
    fetchStyles();
  }, []);

  useEffect(() => {
    fetchStyles();
  }, [selectedBuyer]);

  const fetchBuyers = async () => {
    try {
      const response = await fetch('/api/buyers');
      const result = await response.json();
      
      if (result.success) {
        setBuyers(result.data);
      }
    } catch (error) {
      console.error('Error fetching buyers:', error);
    }
  };

  const fetchStyles = async () => {
    try {
      setLoading(true);
      const url = selectedBuyer ? `/api/styles?buyerId=${selectedBuyer}` : '/api/styles';
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setStyles(result.data);
      }
    } catch (error) {
      console.error('Error fetching styles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this style?')) return;

    try {
      const response = await fetch(`/api/styles/${id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        setStyles(styles.filter(style => style._id !== id));
        alert('Style deleted successfully!');
      } else {
        alert(result.error);
      }
    } catch (error) {
      alert('Error deleting style');
    }
  };

  const handleEdit = (style) => {
    setEditingStyle(style);
  };

  const handleUpdateSuccess = () => {
    setEditingStyle(null);
    fetchStyles();
  };

  if (loading && styles.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Styles List</h2>
        <div className="flex items-center space-x-4">
          {/* Buyer Filter */}
          <select
            value={selectedBuyer}
            onChange={(e) => setSelectedBuyer(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Buyers</option>
            {buyers.map((buyer) => (
              <option key={buyer._id} value={buyer._id}>
                {buyer.name}
              </option>
            ))}
          </select>
          
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
            Total: {styles.length}
          </span>
        </div>
      </div>

      {editingStyle && (
        <div className="mb-6">
          <StyleForm 
            style={editingStyle} 
            onSuccess={handleUpdateSuccess}
          />
          <button
            onClick={() => setEditingStyle(null)}
            className="mt-2 text-gray-600 hover:text-gray-800"
          >
            Cancel Edit
          </button>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {styles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {selectedBuyer ? 'No styles found for selected buyer' : 'No styles found. Add your first style!'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Style Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Buyer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {styles.map((style) => (
                  <tr key={style._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {style.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {style.buyerName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {style.buyerId?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {style.description || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(style.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(style)}
                        className="text-green-600 hover:text-green-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(style._id)}
                        className="text-red-600 hover:text-red-900"
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
}