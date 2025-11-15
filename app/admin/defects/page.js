'use client';
import { useState, useEffect } from 'react';
import DefectForm from '@/components/DefectForm';
import DefectList from '@/components/DefectList';

export default function DefectsPage() {
  const [defects, setDefects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingDefect, setEditingDefect] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDefects = async () => {
    try {
      const response = await fetch('/api/defects');
      if (response.ok) {
        const data = await response.json();
        setDefects(data);
      }
    } catch (error) {
      console.error('Error fetching defects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDefects();
  }, []);

  const handleCreateDefect = () => {
    setEditingDefect(null);
    setShowForm(true);
  };

  const handleEditDefect = (defect) => {
    setEditingDefect(defect);
    setShowForm(true);
  };

  const handleFormSubmit = async (defectData) => {
    try {
      const url = editingDefect ? `/api/defects/${editingDefect._id}` : '/api/defects';
      const method = editingDefect ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(defectData),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingDefect(null);
        fetchDefects();
      } else {
        const error = await response.json();
        alert(error.message || 'Error saving defect');
      }
    } catch (error) {
      console.error('Error saving defect:', error);
      alert('Error saving defect');
    }
  };

  const handleDeleteDefect = async (defectId) => {
    if (confirm('Are you sure you want to delete this defect?')) {
      try {
        const response = await fetch(`/api/defects/${defectId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchDefects();
        } else {
          const error = await response.json();
          alert(error.message || 'Error deleting defect');
        }
      } catch (error) {
        console.error('Error deleting defect:', error);
        alert('Error deleting defect');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 mt-8 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Defect Management</h1>
            <button
              onClick={handleCreateDefect}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition duration-200"
            >
              Add New Defect
            </button>
          </div>

          {showForm && (
            <DefectForm
              defect={editingDefect}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingDefect(null);
              }}
            />
          )}

          <DefectList
            defects={defects}
            onEdit={handleEditDefect}
            onDelete={handleDeleteDefect}
          />
        </div>
      </div>
    </div>
  );
}



































