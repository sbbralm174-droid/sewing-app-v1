// components/viva-interview/VivaDetailsSection.js
'use client'

export default function VivaDetailsSection({ formData, setFormData }) {
  const handleVivaDetailChange = (index, field, value) => {
    const updatedVivaDetails = [...formData.vivaDetails];
    updatedVivaDetails[index][field] = value;
    setFormData(prev => ({ ...prev, vivaDetails: updatedVivaDetails }));
  };

  const addVivaDetail = () => {
    setFormData(prev => ({
      ...prev,
      vivaDetails: [...prev.vivaDetails, { question: '', answer: '', remark: '' }]
    }));
  };

  const removeVivaDetail = (index) => {
    if (formData.vivaDetails.length > 1) {
      const updatedVivaDetails = [...formData.vivaDetails];
      updatedVivaDetails.splice(index, 1);
      setFormData(prev => ({ ...prev, vivaDetails: updatedVivaDetails }));
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-3 text-indigo-600">Viva Details</h2>
      
      {formData.vivaDetails.map((detail, index) => (
        <div key={index} className="mb-4 p-3 border border-gray-200 rounded-md bg-white">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-gray-700">Question {index + 1}</h3>
            {formData.vivaDetails.length > 1 && (
              <button
                type="button"
                onClick={() => removeVivaDetail(index)}
                className="text-red-600 hover:text-red-500 text-sm transition-colors"
              >
                Remove
              </button>
            )}
          </div>
          
          <div className="space-y-2">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Question:</label>
              <input
                type="text"
                value={detail.question}
                onChange={(e) => handleVivaDetailChange(index, 'question', e.target.value)}
                className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
                required
              />
            </div>
            
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Answer:</label>
              <textarea
                value={detail.answer}
                onChange={(e) => handleVivaDetailChange(index, 'answer', e.target.value)}
                className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
                rows="2"
                required
              />
            </div>
            
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Remark:</label>
              <input
                type="text"
                value={detail.remark}
                onChange={(e) => handleVivaDetailChange(index, 'remark', e.target.value)}
                className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
              />
            </div>
          </div>
        </div>
      ))}
      
      <button
        type="button"
        onClick={addVivaDetail}
        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors"
      >
        + Add Another Question
      </button>
    </div>
  );
}