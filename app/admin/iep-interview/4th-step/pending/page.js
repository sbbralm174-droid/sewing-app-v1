'use client'
import { useEffect, useState } from 'react';
import SidebarNavLayout from '@/components/SidebarNavLayout';
import { Search, ChevronDown, ChevronUp, User, Calendar, CheckCircle, XCircle, Loader2, Info } from 'lucide-react';

export default function PendingAdminInterviewPage() {
  const [pendingList, setPendingList] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null); // কোন ড্রপডাউনটা খোলা সেটা ট্র্যাক করবে

  const [operatorInputs, setOperatorInputs] = useState({});
  const [error, setError] = useState('');

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/adminInterview/pending');
      const data = await res.json();
      setPendingList(data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const toggleAccordion = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const filtered = pendingList.filter(item =>
    item.candidateId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    item.candidateId?.nid?.includes(search)
  );

  const handleInputChange = (id, field, value) => {
    setOperatorInputs(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const handlePass = async (item) => {
    setError('');
    const input = operatorInputs[item._id];
    if (!input?.operatorId) {
      setError('Operator ID is required!');
      return;
    }
    // ... API Calls (Same as your logic)
    fetchPending();
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <SidebarNavLayout />

      <div className="flex-1 p-4 md:p-8 max-w-5xl mx-auto">
        {/* Simple Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Admin Interview Panel</h1>
          <p className="text-slate-500 text-sm">Manage and promote candidates</p>
        </div>

        {/* Compact Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search by name or NID..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center gap-2">
            <XCircle className="h-4 w-4" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-500" /></div>
        ) : (
          <div className="space-y-3">
            {filtered.map(item => (
              <div key={item._id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-all">
                
                {/* Accordion Header (ক্লিক করলে খুলবে) */}
                <div 
                  onClick={() => toggleAccordion(item._id)}
                  className={`p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors ${expandedId === item._id ? 'bg-slate-50 border-b' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                      {item.candidateId?.name?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{item.candidateId?.name}</h3>
                      <p className="text-xs text-slate-500">NID: {item.candidateId?.nid} | Grade: {item.candidateId?.grade}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="hidden md:block text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded uppercase tracking-wider">Pending</span>
                    {expandedId === item._id ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                  </div>
                </div>

                {/* Accordion Content (ড্রপডাউন ডিটেইলস) */}
                {expandedId === item._id && (
                  <div className="p-5 bg-white animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Left Side: Candidate Details */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Info className="h-4 w-4 text-indigo-500" />
                          <span className="font-medium">Department:</span> {item.candidateId?.department} (Floor: {item.candidateId?.floor})
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {item.candidateId?.processAndScore && Object.entries(item.candidateId.processAndScore).map(([p, s]) => (
                            <span key={p} className="text-[11px] bg-slate-100 px-2 py-1 rounded border border-slate-200 text-slate-600">
                              {p}: <b>{s}</b>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Right Side: Action Inputs */}
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Operator ID"
                            className="p-2 text-sm border rounded bg-white outline-none focus:ring-2 focus:ring-indigo-400"
                            onChange={(e) => handleInputChange(item._id, 'operatorId', e.target.value)}
                          />
                          <input
                            type="date"
                            className="p-2 text-sm border rounded bg-white outline-none focus:ring-2 focus:ring-indigo-400"
                            onChange={(e) => handleInputChange(item._id, 'joiningDate', e.target.value)}
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Designation (optional)"
                          className="w-full p-2 text-sm border rounded bg-white outline-none focus:ring-2 focus:ring-indigo-400"
                          onChange={(e) => handleInputChange(item._id, 'designation', e.target.value)}
                        />
                        
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => handlePass(item)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                          >
                            <CheckCircle className="h-4 w-4" /> PASS & CREATE
                          </button>
                          <button
                            onClick={() => handleFail(item._id)}
                            className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-bold transition-all"
                          >
                            FAIL
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {!loading && filtered.length === 0 && (
              <div className="text-center py-10 text-slate-400 border-2 border-dashed rounded-xl">
                No candidates found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}