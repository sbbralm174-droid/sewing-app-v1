"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import QRCode from "qrcode";
import { useReactToPrint } from "react-to-print";
import Select from 'react-select';

export default function QRBulkGeneratorPage() {
  const [data, setData] = useState({ operators: [], machines: [] });
  const [selected, setSelected] = useState({ operators: [], machines: [] });
  const [generated, setGenerated] = useState({ operators: [], machines: [] });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  const printRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [opRes, macRes] = await Promise.all([
          fetch("/api/operators"), 
          fetch("/api/machines")
        ]);
        setData({ operators: await opRes.json(), machines: await macRes.json() });
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const options = useMemo(() => ({
    operators: data.operators.map(o => ({ value: o._id, label: `${o.operatorId} - ${o.name}`, item: o })),
    machines: data.machines.map(m => ({ value: m._id, label: `${m.uniqueId} - ${m.machineType?.name || 'N/A'}`, item: m }))
  }), [data]);

  const generateQRs = async (isAll = false) => {
    setGenerating(true);
    const targetOps = isAll ? options.operators : selected.operators;
    const targetMacs = isAll ? options.machines : selected.machines;

    const process = async (list, type) => await Promise.all(list.map(async ({ item }) => {
      const qrData = type === 'op' 
        ? { type: "operator", id: item._id, operatorId: item.operatorId }
        : { type: "machine", id: item._id, uniqueId: item.uniqueId };
      
      const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrData), { width: 300, margin: 1 });
      return { ...item, qrCode: qrCodeUrl };
    }));

    setGenerated({ operators: await process(targetOps, 'op'), machines: await process(targetMacs, 'mac') });
    setGenerating(false);
  };

  const handlePrint = useReactToPrint({ contentRef: printRef });

  const getStatusColor = (installDate) => {
    if (!installDate) return "#d1d5db"; // Gray
    const today = new Date();
    const installation = new Date(installDate.$date || installDate);
    const diffYears = (today - installation) / (1000 * 60 * 60 * 24 * 365.25);

    if (diffYears <= 1) return "#22c55e"; // Green
    if (diffYears <= 3) return "#eab308"; // Yellow
    return "#ef4444"; // Red
  };

  const Card = ({ item, type }) => {
    const rawDate = item.installationDate?.$date || item.installationDate;
    const installDateFormatted = rawDate ? new Date(rawDate).toLocaleDateString('en-GB') : "N/A";
    const colorCode = getStatusColor(item.installationDate);

    return (
      <div className="relative border border-black flex flex-col items-center justify-between p-2 bg-white overflow-hidden" 
           style={{ height: '70mm', width: '100%', boxSizing: 'border-box' }}>
        
        {/* Right Side Color Box */}
        <div style={{ backgroundColor: colorCode }} className="absolute right-0 top-0 bottom-0 w-6 border-l border-black"></div>
        
        {/* Top: Unique ID */}
        <div className="w-full pr-6 text-center">
           <h2 className="font-black text-xl uppercase break-words leading-tight">
             {type === 'op' ? item.name : item.uniqueId}
           </h2>
        </div>

        {/* Center: QR Code */}
        <div className="flex-grow flex items-center justify-center pr-6 py-1">
          <img src={item.qrCode} className="h-32 w-32 object-contain" alt="qr" />
        </div>
        
        {/* Bottom: Date & Info */}
        <div className="w-full pr-6 text-center border-t border-gray-300 pt-1">
          <p className="font-bold text-sm uppercase truncate">
            {type === 'op' ? item.designation : (item.machineType?.name || 'N/A')}
          </p>
          <p className="font-black text-lg mt-0.5">
            INST: {installDateFormatted}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 5mm; }
          body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
          .print-container {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            grid-template-rows: repeat(4, 1fr) !important;
            gap: 2mm !important;
            width: 200mm !important;
            height: 287mm !important;
          }
        }
      `}</style>

      <div className="no-print max-w-4xl mx-auto bg-white p-6 rounded shadow mb-6">
        <h1 className="text-xl font-bold mb-4">Bulk QR Printer (3x4 Grid)</h1>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Select isMulti options={options.operators} placeholder="Operators..." onChange={v => setSelected({...selected, operators: v})} />
          <Select isMulti options={options.machines} placeholder="Machines..." onChange={v => setSelected({...selected, machines: v})} />
        </div>
        <div className="flex gap-2">
          <button onClick={() => generateQRs()} className="bg-blue-600 text-white px-4 py-2 rounded">Generate</button>
          <button onClick={() => generateQRs(true)} className="bg-green-600 text-white px-4 py-2 rounded">Generate All</button>
          <button onClick={handlePrint} className="bg-purple-600 text-white px-4 py-2 rounded">Print A4</button>
        </div>
      </div>

      <div className="flex justify-center bg-gray-200 py-4 overflow-auto">
        <div ref={printRef} className="print-container bg-white p-2 border shadow-lg" style={{ width: '210mm', minHeight: '297mm' }}>
          {generated.operators.map((op, i) => <Card key={i} item={op} type="op" />)}
          {generated.machines.map((m, i) => <Card key={i} item={m} type="mac" />)}
        </div>
      </div>
    </div>
  );
}