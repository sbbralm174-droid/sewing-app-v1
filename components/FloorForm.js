import { useState } from 'react';
import { useRouter } from 'next/router';

export default function FloorForm({ floorData }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    floorNumber: floorData?.floorNumber || '',
    description: floorData?.description || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = floorData?._id 
      ? `/api/floors/${floorData._id}` 
      : '/api/floors';
    const method = floorData?._id ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      router.push('/floors');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-8">
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="floorNumber">
          Floor Number*
        </label>
        <input
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          id="floorNumber"
          name="floorNumber"
          type="text"
          placeholder="Floor Number"
          value={formData.floorNumber}
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
          Description
        </label>
        <textarea
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          id="description"
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
        />
      </div>
      <div className="flex items-center justify-between">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          type="submit"
        >
          {floorData?._id ? 'Update' : 'Create'} Floor
        </button>
      </div>
    </form>
  );
}