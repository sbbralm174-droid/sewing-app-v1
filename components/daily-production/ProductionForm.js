'use client';

export default function ProductionForm({ 
  formData, 
  onFormChange, 
  onFormSubmit 
}) {
  const fields = [
    { id: 'buyer', label: 'Buyer', placeholder: 'Enter buyer name' },
    { id: 'style', label: 'Style', placeholder: 'Enter style number' },
    { id: 'breakdownProcesses', label: 'Breakdown Processes', placeholder: 'Enter processes (comma separated)' },
    { id: 'supervisor', label: 'Supervisor', placeholder: 'Enter supervisor name' },
    { id: 'date', label: 'Date', type: 'date' },
    { id: 'floor', label: 'Floor', placeholder: 'Enter floor number' },
    { id: 'line', label: 'Line', placeholder: 'Enter line number' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onFormSubmit();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Production Information
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {fields.map((field) => (
            <div key={field.id}>
              <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
              </label>
              <input
                type={field.type || 'text'}
                id={field.id}
                name={field.id}
                value={formData[field.id] || ''}
                onChange={onFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={field.placeholder}
                required
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Submit Production Info
          </button>
        </div>
      </form>
    </div>
  );
}