"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function MachineUpdatePage() {
    const [machineData, setMachineData] = useState(null);
    const [machineTypes, setMachineTypes] = useState([]); // ড্রপডাউনের জন্য
    const [manualId, setManualId] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });
    const scannerRef = useRef(null);

    // ১. Machine Types লোড করা (API থেকে)
    useEffect(() => {
        const fetchTypes = async () => {
            try {
                const res = await fetch('/api/machine-types'); // আপনার সঠিক API পাথ দিন
                const data = await res.json();
                setMachineTypes(data);
            } catch (err) { console.error("Error fetching types", err); }
        };
        fetchTypes();
    }, []);

    // ২. কিউআর স্ক্যানার সেটআপ
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
                if (data.nextServiceDate) data.nextServiceDate = new Date(data.nextServiceDate).toISOString().split('T')[0];
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

                        {/* মেইন ইনফরমেশন */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Brand Name</label>
                                <input type="text" name="brandName" value={machineData.brandName || ''} onChange={handleFieldChange} className="w-full border p-2 rounded mt-1 bg-blue-50/30" required />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-blue-600 uppercase">Machine Type (Required)</label>
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
                                <input type="number" name="price" value={machineData.price || ''} onChange={handleFieldChange} className="w-full border-2 border-green-100 p-2 rounded mt-1" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Next Service Date</label>
                                <input type="date" name="nextServiceDate" value={machineData.nextServiceDate || ''} onChange={handleFieldChange} className="w-full border p-2 rounded mt-1" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                                <select name="currentStatus" value={machineData.currentStatus} onChange={handleFieldChange} className="w-full border p-2 rounded mt-1">
                                    <option value="idle">Idle</option>
                                    <option value="running">Running</option>
                                    <option value="maintenance">Maintenance</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>

                        {/* বাকি সব ফিল্ড (আগের মতো) */}
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
                        <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                            <p className="text-xs font-black text-blue-700 uppercase">📍 Location Info</p>
                            <div className="grid grid-cols-3 gap-3">
                                <input placeholder="Floor" name="floor" value={machineData.lastLocation?.floor || ''} onChange={(e) => handleFieldChange(e, 'lastLocation')} className="border p-2 rounded text-sm shadow-sm" />
                                <input placeholder="Line" name="line" value={machineData.lastLocation?.line || ''} onChange={(e) => handleFieldChange(e, 'lastLocation')} className="border p-2 rounded text-sm shadow-sm" />
                                <input placeholder="Supervisor" name="supervisor" value={machineData.lastLocation?.supervisor || ''} onChange={(e) => handleFieldChange(e, 'lastLocation')} className="border p-2 rounded text-sm shadow-sm" />
                            </div>
                        </div>

                        {/* পার্টস লিস্ট সেকশন */}
                        {machineData.parts?.length > 0 && (
                            <div className="space-y-3">
                                <p className="text-xs font-black text-gray-700 uppercase">⚙️ Machine Parts</p>
                                {machineData.parts.map((part, index) => (
                                    <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                        <input placeholder="Part Name" name="partName" value={part.partName} onChange={(e) => handleFieldChange(e, 'parts', index)} className="border p-2 rounded text-xs" />
                                        <input placeholder="Part ID" name="uniquePartId" value={part.uniquePartId} onChange={(e) => handleFieldChange(e, 'parts', index)} className="border p-2 rounded text-xs" />
                                        <input type="date" name="nextServiceDate" value={part.nextServiceDate} onChange={(e) => handleFieldChange(e, 'parts', index)} className="border p-2 rounded text-xs" />
                                    </div>
                                ))}
                            </div>
                        )}

                        <button type="submit" disabled={loading} className="w-full bg-blue-700 text-white py-4 rounded-2xl font-black text-xl shadow-xl hover:bg-blue-800 disabled:bg-gray-400">
                            {loading ? "SYNCING..." : "SYNC & SAVE CHANGES"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}