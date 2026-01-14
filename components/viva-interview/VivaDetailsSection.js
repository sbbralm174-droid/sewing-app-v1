'use client'

export default function VivaDetailsSection({ formData, setFormData }) {
  // ১ থেকে ২০ বছরের একটি অ্যারে তৈরি করা হয়েছে Answer ড্রপডাউনের জন্য
  const experienceYears = Array.from({ length: 20 }, (_, i) => i + 1);

  // কোয়েশ্চেন লিস্ট (আপনি চাইলে এখানে আরও অপশন যোগ করতে পারেন)
  const questionOptions = [
    "Experience",
    "Skills",
    "Current Salary",
    "Expected Salary",
    "Notice Period",
    "Reason for leaving"
  ];

  const handleVivaDetailChange = (index, field, value) => {
    const updatedVivaDetails = [...formData.vivaDetails];
    updatedVivaDetails[index][field] = value;
    setFormData(prev => ({ ...prev, vivaDetails: updatedVivaDetails }));
  };

  const addVivaDetail = () => {
    setFormData(prev => ({
      ...prev,
      vivaDetails: [...prev.vivaDetails, { question: 'Experience', answer: '1', remark: '' }]
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
        <div key={index} className="mb-4 p-3 border border-gray-200 rounded-md bg-white shadow-sm">
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
          
          <div className="space-y-3">
            {/* Question Dropdown */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Question:</label>
              <select
                value={detail.question || "Experience"}
                onChange={(e) => handleVivaDetailChange(index, 'question', e.target.value)}
                className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
                required
              >
                {questionOptions.map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </div>
            
            {/* Answer Dropdown (1 to 20 Years) */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Answer (Years):</label>
              <select
                value={detail.answer}
                onChange={(e) => handleVivaDetailChange(index, 'answer', e.target.value)}
                className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
                required
              >
                <option value="" disabled>Select Year</option>
                {experienceYears.map((year) => (
                  <option key={year} value={year}>
                    {year} {year === 1 ? 'Year' : 'Years'}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Remark Input */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Remark:</label>
              <input
                type="text"
                placeholder="Additional comments..."
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
        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors shadow-md"
      >
        + Add Another Question
      </button>
    </div>
  );
}