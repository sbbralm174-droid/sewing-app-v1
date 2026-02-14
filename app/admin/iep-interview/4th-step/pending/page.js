'use client'
import { useEffect, useState } from 'react';
import SidebarNavLayout from '@/components/SidebarNavLayout';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Info,
  Calendar,
  Filter,
  User,
  Building,
  Edit,
  Save,
  X
} from 'lucide-react';

export default function AdminInterviewPage() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(null); // কোন আইটেম এডিট মোডে আছে
  const [editForm, setEditForm] = useState({}); // এডিট ফর্ম ডাটা
  const [updating, setUpdating] = useState(false); // আপডেট লোডিং স্টেট

  // ফিল্টার স্টেট
  const [filters, setFilters] = useState({
    date: '',
    floor: 'ALL',
    result: 'ALL',
    search: ''
  });

  const floorOptions = [
    { value: 'ALL', label: 'All Floors' },
    { value: 'SHAPLA', label: 'Shapla' },
    { value: 'PODDO', label: 'Podddo' },
    { value: 'KODOM', label: 'Kodom' },
    { value: 'BELLY', label: 'Belly' }
  ];

  const resultOptions = [
    { value: 'ALL', label: 'All Results' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'PASSED', label: 'Passed' },
    { value: 'FAILED', label: 'Failed' }
  ];

  // API থেকে ডাটা ফেচ করা
  const fetchInterviews = async () => {
    setLoading(true);
    try {
      // ফিল্টার প্যারামিটার তৈরি
      const params = new URLSearchParams();
      if (filters.date) params.append('date', filters.date);
      if (filters.floor && filters.floor !== 'ALL') params.append('floor', filters.floor);
      if (filters.result && filters.result !== 'ALL') params.append('result', filters.result);

      const url = `/api/adminInterview/pending${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.success) {
        setInterviews(data.data || []);
      } else {
        setError('Failed to fetch data');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  // এডিট মোড চালু করা
  const handleEdit = (item) => {
    setEditMode(item._id);
    setEditForm({
      joiningDate: item.joiningDate ? new Date(item.joiningDate).toISOString().split('T')[0] : '',
      salary: item.salary || '',
      operatorId: '',
      designation: item.designation || '',
      floor: item.floor || 'SHAPLA',
      result: item.result || 'PENDING',
      promotedToOperator: item.promotedToOperator || false,
      remarks: item.remarks || ''
    });
  };

  // এডিট মোড বন্ধ করা
  const handleCancelEdit = () => {
    setEditMode(null);
    setEditForm({});
  };

  // ফর্ম ইনপুট হ্যান্ডেল
  const handleInputChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // আপডেট সাবমিট
  const handleUpdate = async (id) => {
    if (!editForm.salary || !editForm.designation) {
      alert('Salary and Designation are required');
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch(`/api/adminInterview/update/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();

      if (data.success) {
        // লোকাল স্টেট আপডেট করুন
        setInterviews(prev => prev.map(item => 
          item._id === id ? data.data : item
        ));
        setEditMode(null);
        alert('Updated successfully!');
      } else {
        alert(data.message || 'Update failed');
      }
    } catch (err) {
      console.error('Update error:', err);
      alert('An error occurred during update');
    } finally {
      setUpdating(false);
    }
  };

  // ফিল্টার পরিবর্তন হলে ডাটা রিফ্রেশ
  useEffect(() => {
    fetchInterviews();
  }, [filters.date, filters.floor, filters.result]);

  // সার্চ ফিল্টার (ক্লায়েন্ট সাইড)
  const filteredInterviews = interviews.filter(item => {
    if (!filters.search) return true;
    
    const searchTerm = filters.search.toLowerCase();
    return (
      item.candidateId?.name?.toLowerCase().includes(searchTerm) ||
      item.candidateId?.nid?.includes(searchTerm) ||
      item.designation?.toLowerCase().includes(searchTerm) ||
      item.remarks?.toLowerCase().includes(searchTerm)
    );
  });

  const toggleAccordion = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      date: '',
      floor: 'ALL',
      result: 'ALL',
      search: ''
    });
  };

  const getResultColor = (result) => {
    switch (result) {
      case 'PASSED': return 'bg-green-100 text-green-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      case 'PENDING': return 'bg-amber-100 text-amber-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getFloorColor = (floor) => {
    switch (floor) {
      case 'SHAPLA': return 'bg-blue-100 text-blue-800';
      case 'PODDO': return 'bg-purple-100 text-purple-800';
      case 'KODOM': return 'bg-emerald-100 text-emerald-800';
      case 'BELLY': return 'bg-pink-100 text-pink-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <SidebarNavLayout />

      <div className="flex-1 p-4 md:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Admin Interviews</h1>
          <p className="text-slate-500 text-sm">Filter, manage and update admin interviews</p>
        </div>

        {/* ফিল্টার সেকশন */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-indigo-500" />
            <h2 className="font-semibold text-slate-700">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* তারিখ ফিল্টার */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                <Calendar className="inline h-4 w-4 mr-1" />
                Date
              </label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => handleFilterChange('date', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            {/* ফ্লোর ফিল্টার */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                <Building className="inline h-4 w-4 mr-1" />
                Floor
              </label>
              <select
                value={filters.floor}
                onChange={(e) => handleFilterChange('floor', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              >
                {floorOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* ফলাফল ফিল্টার */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                <CheckCircle className="inline h-4 w-4 mr-1" />
                Result
              </label>
              <select
                value={filters.result}
                onChange={(e) => handleFilterChange('result', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              >
                {resultOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* সার্চ ফিল্টার */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                <Search className="inline h-4 w-4 mr-1" />
                Search
              </label>
              <input
                type="text"
                placeholder="Name, NID, Designation..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* ফিল্টার ক্লিয়ার বাটন */}
          <div className="flex justify-end mt-4">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        </div>

        {/* ফলাফল কাউন্ট */}
        <div className="mb-4 text-sm text-slate-600">
          Showing {filteredInterviews.length} of {interviews.length} interviews
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm flex items-center gap-2">
            <XCircle className="h-4 w-4" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="animate-spin text-indigo-500 h-8 w-8 mb-2" />
            <p className="text-slate-500">Loading interviews...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInterviews.map(item => (
              <div key={item._id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md">
                
                {/* একর্ডিয়ন হেডার */}
                <div 
                  onClick={() => toggleAccordion(item._id)}
                  className={`p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors ${expandedId === item._id ? 'bg-slate-50 border-b' : ''}`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    {/* প্রার্থীর প্রোফাইল */}
                    <div className="h-12 w-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg">
                      {item.candidateId?.name?.charAt(0) || 'U'}
                    </div>
                    
                    {/* প্রাথমিক তথ্য */}
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                        <h3 className="font-bold text-slate-800 text-lg">
                          {item.candidateId?.name || 'N/A'}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          <span className={`text-xs font-bold px-2 py-1 rounded ${getResultColor(item.result)}`}>
                            {item.result}
                          </span>
                          <span className={`text-xs font-bold px-2 py-1 rounded ${getFloorColor(item.floor)}`}>
                            {item.floor}
                          </span>
                          {item.designation && (
                            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                              {item.designation}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        NID: {item.candidateId?.nid || 'N/A'} | 
                        Salary: {item.salary ? `৳${item.salary}` : 'N/A'} |
                        Joining: {item.joiningDate ? new Date(item.joiningDate).toLocaleDateString() : 'Not set'}
                      </p>
                    </div>
                  </div>

                  {/* এক্সপ্যান্ড আইকন */}
                  <div className="ml-4">
                    {expandedId === item._id ? 
                      <ChevronUp className="h-5 w-5 text-slate-400" /> : 
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    }
                  </div>
                </div>

                {/* একর্ডিয়ন কন্টেন্ট */}
                {expandedId === item._id && (
                  <div className="p-5 bg-white animate-in slide-in-from-top-2 duration-200">
                    {/* এডিট বাটন */}
                    <div className="flex justify-end mb-4">
                      {editMode === item._id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdate(item._id)}
                            disabled={updating}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                          >
                            {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {updating ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                          >
                            <X className="h-4 w-4" />
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit(item)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Edit Details
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      
                      {/* বাম পাশ: প্রার্থীর বিস্তারিত */}
                      <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-slate-700 mb-3 pb-2 border-b border-slate-200">
                            Candidate Details
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-slate-400" />
                              <span className="font-medium">Department:</span> 
                              <span className="text-slate-600">{item.candidateId?.department || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-slate-400" />
                              <span className="font-medium">Original Floor:</span> 
                              <span className="text-slate-600">{item.candidateId?.floor || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Info className="h-4 w-4 text-slate-400" />
                              <span className="font-medium">Grade:</span> 
                              <span className="text-slate-600">{item.candidateId?.grade || 'N/A'}</span>
                            </div>
                            {item.candidateId?.processAndScore && (
                              <div className="mt-3">
                                <p className="font-medium text-slate-700 mb-2">Process Scores:</p>
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(item.candidateId.processAndScore).map(([process, score]) => (
                                    <span key={process} className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700">
                                      <span className="font-medium">{process}:</span> {score}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* মন্তব্য এবং কারণ */}
                        {(item.remarks || item.canceledReason) && (
                          <div className="bg-slate-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-slate-700 mb-2">Remarks & Notes</h4>
                            {item.remarks && (
                              <p className="text-sm text-slate-600 mb-2">
                                <span className="font-medium">Remarks:</span> {item.remarks}
                              </p>
                            )}
                            {item.canceledReason && (
                              <p className="text-sm text-red-600">
                                <span className="font-medium">Canceled Reason:</span> {item.canceledReason}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* ডান পাশ: এডমিন ইনপুট এবং কর্মচারী অবস্থা */}
                      <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-slate-700 mb-3 pb-2 border-b border-slate-200">
                            Admin Information
                          </h4>
                          <div className="space-y-3">
                            {/* Designation */}
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">
                                Designation *
                              </label>
                              {editMode === item._id ? (
                                <input
                                  type="text"
                                  value={editForm.designation}
                                  onChange={(e) => handleInputChange('designation', e.target.value)}
                                  className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                  placeholder="Enter designation"
                                  required
                                />
                              ) : (
                                <div className="p-2 bg-white border border-slate-200 rounded text-sm">
                                  {item.designation || 'Not specified'}
                                </div>
                              )}
                            </div>

                            {/* Floor */}
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">
                                Assigned Floor
                              </label>
                              {editMode === item._id ? (
                                <select
                                  value={editForm.floor}
                                  onChange={(e) => handleInputChange('floor', e.target.value)}
                                  className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                >
                                  {floorOptions.filter(opt => opt.value !== 'ALL').map(option => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <div className={`p-2 rounded text-sm font-medium text-center ${getFloorColor(item.floor)}`}>
                                  {item.floor}
                                </div>
                              )}
                            </div>

                            {/* Salary */}
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">
                                Salary *
                              </label>
                              {editMode === item._id ? (
                                <input
                                  type="number"
                                  value={editForm.salary}
                                  onChange={(e) => handleInputChange('salary', e.target.value)}
                                  className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                  placeholder="Enter salary"
                                  required
                                  min="0"
                                />
                              ) : (
                                <div className="p-2 bg-white border border-slate-200 rounded text-sm font-bold text-green-600">
                                  ৳{item.salary || '0'}
                                </div>
                              )}
                            </div>

                            {/* Joining Date */}
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">
                                Joining Date
                              </label>
                              {editMode === item._id ? (
                                <input
                                  type="date"
                                  value={editForm.joiningDate}
                                  onChange={(e) => handleInputChange('joiningDate', e.target.value)}
                                  className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                              ) : (
                                <div className="p-2 bg-white border border-slate-200 rounded text-sm">
                                  {item.joiningDate ? new Date(item.joiningDate).toLocaleDateString() : 'Not set'}
                                </div>
                              )}
                            </div>

                            {/* Operator ID (only when promoting) */}
                            {editMode === item._id && editForm.promotedToOperator && (
                              <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">
                                  Operator ID *
                                </label>
                                <input
                                  type="text"
                                  value={editForm.operatorId}
                                  onChange={(e) => handleInputChange('operatorId', e.target.value)}
                                  className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                  placeholder="Enter operator ID"
                                  required
                                />
                              </div>
                            )}

                            {/* Result */}
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">
                                Result
                              </label>
                              {editMode === item._id ? (
                                <select
                                  value={editForm.result}
                                  onChange={(e) => handleInputChange('result', e.target.value)}
                                  className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                >
                                  {resultOptions.filter(opt => opt.value !== 'ALL').map(option => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <div className={`p-2 rounded text-sm font-medium text-center ${getResultColor(item.result)}`}>
                                  {item.result}
                                </div>
                              )}
                            </div>

                            {/* Promote to Operator Checkbox */}
                            <div className="flex items-center gap-2 pt-2">
                              {editMode === item._id ? (
                                <>
                                  <input
                                    type="checkbox"
                                    id={`promote-${item._id}`}
                                    checked={editForm.promotedToOperator}
                                    onChange={(e) => handleInputChange('promotedToOperator', e.target.checked)}
                                    className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                  />
                                  <label htmlFor={`promote-${item._id}`} className="text-sm text-slate-700">
                                    Promote to Operator
                                  </label>
                                </>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div className={`h-3 w-3 rounded-full ${item.promotedToOperator ? 'bg-green-500' : 'bg-slate-300'}`} />
                                  <span className="text-sm text-slate-700">
                                    {item.promotedToOperator ? 'Promoted to Operator' : 'Not yet promoted'}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Remarks */}
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">
                                Remarks
                              </label>
                              {editMode === item._id ? (
                                <textarea
                                  value={editForm.remarks}
                                  onChange={(e) => handleInputChange('remarks', e.target.value)}
                                  className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                  rows="2"
                                  placeholder="Additional remarks..."
                                />
                              ) : (
                                <div className="p-2 bg-white border border-slate-200 rounded text-sm">
                                  {item.remarks || 'No remarks'}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons for PENDING status */}
                    {item.result === 'PENDING' && !editMode && (
                      <div className="mt-6 pt-4 border-t border-slate-200">
                        <p className="text-sm text-slate-500 mb-3">
                          This candidate is waiting for final decision.
                        </p>
                        <div className="flex gap-3">
                          <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
                            Approve & Promote
                          </button>
                          <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
                            Reject
                          </button>
                          <button className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors">
                            Save for Later
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {!loading && filteredInterviews.length === 0 && (
              <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl bg-white">
                <Filter className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">No interviews found</h3>
                <p className="text-slate-500 mb-4">
                  {Object.values(filters).some(val => val && val !== 'ALL') 
                    ? 'Try changing your filters or search term'
                    : 'No interviews available yet'}
                </p>
                {Object.values(filters).some(val => val && val !== 'ALL') && (
                  <button
                    onClick={handleClearFilters}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}