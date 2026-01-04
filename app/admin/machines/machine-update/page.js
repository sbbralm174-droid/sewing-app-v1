"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function MachineUpdatePage() {
    const [machineData, setMachineData] = useState(null);
    const [machineTypes, setMachineTypes] = useState([]); 
    const [availableParts, setAvailableParts] = useState(["Full Machine", "Motor", "Belt", "Needle", "Oil Pump", "Display", "Sensor"]); // উদাহরণস্বরূপ
    const [manualId, setManualId] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });
    const scannerRef = useRef(null);

    useEffect(() => {
        const fetchTypes = async () => {
            try {
                const res = await fetch('/api/machine-types');
                const data = await res.json();
                setMachineTypes(data);
            } catch (err) { console.error("Error fetching types", err); }
        };
        fetchTypes();
    }, []);

    useEffect(() => {
        if (!machineData) {
            const scanner = new Html5QrcodeScanner("reader", {
                fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0
            });
            scanner.render((text) => processInput(text), (err) => {});
            scannerRef.current = scanner;
        }
        return () => { if (scannerRef.current) scannerRef.current.clear().catch(() => {}); };
    }, [machineData]);

    const processInput = (input) => {
        let id = "";
        try { const parsed = JSON.parse(input); id = parsed.uniqueId || input; } 
        catch (e) { id = input; }
        if (id) fetchMachine(id.trim());
    };

    const fetchMachine = async (id) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/machines/update-by-qr-code/${encodeURIComponent(id)}`);
            const data = await res.json();
            if (res.ok) {
                // তারিখগুলো ইনপুট ফিল্ডের ফরম্যাটে আনা
                if (data.nextServiceDate) data.nextServiceDate = new Date(data.nextServiceDate).toISOString().split('T')[0];
                if (data.installationDate) data.installationDate = new Date(data.installationDate).toISOString().split('T')[0];
                if (data.parts) {
                    data.parts = data.parts.map(p => ({
                        ...p,
                        nextServiceDate: p.nextServiceDate ? new Date(p.nextServiceDate).toISOString().split('T')[0] : ''
                    }));
                }
                setMachineData(data);
                if (scannerRef.current) scannerRef.current.clear().catch(() => {});
            } else { alert("Machine not found!"); }
        } catch (err) { alert("Error connecting to server"); }
        finally { setLoading(false); }
    };

    // --- নতুন পার্টস হ্যান্ডলিং ---
    const addNewPart = () => {
        const newPart = {
            partName: "",
            uniquePartId: `P-${Date.now()}`, // Auto generate unique ID
            nextServiceDate: ""
        };
        setMachineData(prev => ({
            ...prev,
            parts: [...(prev.parts || []), newPart]
        }));
    };

    const removePart = (index) => {
        const updatedParts = machineData.parts.filter((_, i) => i !== index);
        setMachineData(prev => ({ ...prev, parts: updatedParts }));
    };

    const handleFieldChange = (e, section = null, index = null) => {
        const { name, value } = e.target;
        if (section === 'lastLocation') {
            setMachineData(prev => ({ ...prev, lastLocation: { ...prev.lastLocation, [name]: value } }));
        } else if (section === 'parts') {
            const updatedParts = [...machineData.parts];
            updatedParts[index][name] = value;
            setMachineData(prev => ({ ...prev, parts: updatedParts }));
        } else {
            setMachineData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: "", type: "" });
        try {
            const res = await fetch(`/api/machines/update-by-qr-code/${encodeURIComponent(machineData.uniqueId)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(machineData),
            });
            if (res.ok) {
                setMessage({ text: "✅ ডাটা সফলভাবে আপডেট হয়েছে!", type: "success" });
                setTimeout(() => setMachineData(null), 2000);
            } else {
                const result = await res.json();
                setMessage({ text: `❌ ${result.error || "ব্যর্থ"}`, type: "error" });
            }
        } catch (err) { setMessage({ text: "❌ সার্ভার এরর", type: "error" }); }
        finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen mt-10 bg-gray-50 p-4">
            <div className="max-w-3xl mx-auto">
                {!machineData ? (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-md border border-blue-100">
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">🔌 Scan QR Code</label>
                            <div className="flex gap-2">
                                <input autoFocus type="text" value={manualId} onChange={(e) => setManualId(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && processInput(manualId)}
                                    placeholder="Click & Scan..." className="flex-1 border-2 border-gray-100 p-3 rounded-lg outline-none focus:border-blue-500" />
                                <button onClick={() => processInput(manualId)} className="bg-blue-600 text-white px-6 rounded-lg font-bold">GO</button>
                            </div>
                        </div>
                        <div id="reader" className="bg-white p-4 rounded-xl shadow-md"></div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-xl border-t-8 border-blue-600 space-y-6">
                        <div className="flex justify-between items-center border-b pb-3">
                            <h2 className="text-xl font-black text-gray-800 uppercase italic">Update: {machineData.uniqueId}</h2>
                            <button type="button" onClick={() => setMachineData(null)} className="text-gray-400 hover:text-red-500 font-bold">CANCEL ✕</button>
                        </div>

                        {/* মেইন ইনফরমেশন (সব ফিল্ড ঠিক রাখা হয়েছে) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Brand Name</label>
                                <input type="text" name="brandName" value={machineData.brandName || ''} onChange={handleFieldChange} className="w-full border p-2 rounded mt-1 bg-blue-50/30" required />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-blue-600 uppercase">Machine Type</label>
                                <select name="machineType" value={machineData.machineType || ''} onChange={handleFieldChange} className="w-full border-2 border-blue-100 p-2 rounded mt-1 bg-white font-bold" required>
                                    <option value="">Select Type</option>
                                    {machineTypes.map(type => (
                                        <option key={type._id} value={type._id}>{type.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Model</label>
                                <input type="text" name="model" value={machineData.model || ''} onChange={handleFieldChange} className="w-full border p-2 rounded mt-1 bg-blue-50/30" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-green-600 uppercase">Price (Amount)</label>
                                <input type="number" name="price" value={machineData.price || ''} onChange={handleFieldChange} className="w-full border-2 border-green-100 p-2 rounded mt-1 font-bold" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Installation Date</label>
                                <input type="date" name="installationDate" value={machineData.installationDate || ''} onChange={handleFieldChange} className="w-full border p-2 rounded mt-1" />
                            </div>
                            {/* <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Next Machine Service</label>
                                <input type="date" name="nextServiceDate" value={machineData.nextServiceDate || ''} onChange={handleFieldChange} className="w-full border p-2 rounded mt-1" />
                            </div> */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                                <select name="currentStatus" value={machineData.currentStatus} onChange={handleFieldChange} className="w-full border p-2 rounded mt-1 font-bold">
                                    <option value="idle">Idle</option>
                                    <option value="running">Running</option>
                                    <option value="maintenance">Maintenance</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>

                        {/* অতিরিক্ত ইনফরমেশন */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Company Unique No</label>
                                <input type="text" name="companyUniqueNumber" value={machineData.companyUniqueNumber || ''} onChange={handleFieldChange} className="w-full border p-2 rounded mt-1 shadow-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Origin</label>
                                <input type="text" name="origin" value={machineData.origin || ''} onChange={handleFieldChange} className="w-full border p-2 rounded mt-1 shadow-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Warranty (Years)</label>
                                <input type="number" name="warrantyYears" value={machineData.warrantyYears || ''} onChange={handleFieldChange} className="w-full border p-2 rounded mt-1 shadow-sm" />
                            </div>
                        </div>

                        {/* লোকেশন সেকশন */}
                        <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-200">
                            <p className="text-xs font-black text-blue-700 uppercase">📍 Location Info</p>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400">Floor</label>
                                    <input name="floor" value={machineData.lastLocation?.floor || ''} onChange={(e) => handleFieldChange(e, 'lastLocation')} className="w-full border p-2 rounded text-sm bg-white" />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400">Line</label>
                                    <input name="line" value={machineData.lastLocation?.line || ''} onChange={(e) => handleFieldChange(e, 'lastLocation')} className="w-full border p-2 rounded text-sm bg-white" />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400">Supervisor</label>
                                    <input name="supervisor" value={machineData.lastLocation?.supervisor || ''} onChange={(e) => handleFieldChange(e, 'lastLocation')} className="w-full border p-2 rounded text-sm bg-white" />
                                </div>
                            </div>
                        </div>

                        {/* পার্টস লিস্ট সেকশন - ড্রপডাউন এবং ডিলিট বাটন সহ */}
                        <div className="space-y-4 border-t pt-4">
                            <div className="flex justify-between items-center">
                                <p className="text-xs font-black text-gray-700 uppercase italic">⚙️ Machine Parts List</p>
                                <button type="button" onClick={addNewPart} className="bg-blue-100 text-blue-700 text-xs px-4 py-2 rounded-lg font-black hover:bg-blue-600 hover:text-white transition-all">
                                    + ADD NEW PART
                                </button>
                            </div>

                            {machineData.parts?.map((part, index) => (
                                <div key={index} className="relative grid grid-cols-1 md:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <button type="button" onClick={() => removePart(index)} className="absolute -top-2 -right-2 bg-red-600 text-white w-6 h-6 rounded-full text-xs shadow-lg flex items-center justify-center font-bold">✕</button>
                                    
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase">Part Name (Dropdown)</label>
                                        <select name="partName" value={part.partName} onChange={(e) => handleFieldChange(e, 'parts', index)} className="w-full border p-2 rounded text-sm bg-white font-semibold" required>
                                            <option value="">Select Part</option>
                                            {availableParts.map((pName, i) => (
                                                <option key={i} value={pName}>{pName}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase">Unique Part ID (Auto)</label>
                                        <input readOnly name="uniquePartId" value={part.uniquePartId} className="w-full border p-2 rounded text-sm bg-gray-100 text-gray-500 cursor-not-allowed" />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase">Next Service Date</label>
                                        <input type="date" name="nextServiceDate" value={part.nextServiceDate} onChange={(e) => handleFieldChange(e, 'parts', index)} className="w-full border p-2 rounded text-sm bg-white" required />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button type="submit" disabled={loading} className="w-full bg-blue-700 text-white py-4 rounded-2xl font-black text-xl shadow-xl hover:bg-blue-800 disabled:bg-gray-400 transition-all">
                            {loading ? "SYNCING..." : "SYNC & SAVE CHANGES"}
                        </button>

                        {message.text && (
                            <div className={`p-4 rounded-xl text-center font-bold ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {message.text}
                            </div>
                        )}
                    </form>
                )}
            </div>
        </div>
    );
}