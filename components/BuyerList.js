'use client';
import { useState, useEffect } from 'react';
import BuyerForm from './BuyerForm';

export default function BuyerList() {
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBuyer, setEditingBuyer] = useState(null);

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
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(`Are you sure you want to delete this buyer? `)) return;

    try {
      const response = await fetch(`/api/buyers/${id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        setBuyers(buyers.filter(buyer => buyer._id !== id));
        alert('Buyer deleted successfully!');
      } else {
        alert(result.error);
      }
    } catch (error) {
      alert('Error deleting buyer');
    }
  };

  const handleEdit = (buyer) => {
    setEditingBuyer(buyer);
  };

  const handleUpdateSuccess = () => {
    setEditingBuyer(null);
    fetchBuyers();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Buyers List</h2>
        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
          Total: {buyers.length}
        </span>
      </div>

      {editingBuyer && (
        <div className="mb-6">
          <BuyerForm 
            buyer={editingBuyer} 
            onSuccess={handleUpdateSuccess}
          />
          <button
            onClick={() => setEditingBuyer(null)}
            className="mt-2 text-gray-600 hover:text-gray-800"
          >
            Cancel Edit
          </button>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {buyers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No buyers found. Add your first buyer!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {buyers.map((buyer) => (
                  <tr key={buyer._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {buyer.name}

                      </div>
                    </td>
                    
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(buyer)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(buyer._id)}
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