'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/daily-production/Header';
import ProductionForm from '@/components/daily-production/ProductionForm';
import ScanInput from '@/components/daily-production/ScanInput';
import ProductionTable from '@/components/daily-production/ProductionTable';
import { Html5QrcodeScanner } from 'html5-qrcode';

// Toast কম্পোনেন্ট
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  }[type] || 'bg-gray-500';

  return (
    <div className={`fixed top-20 right-4 z-50 ${bgColor} text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-slideIn`}>
      {type === 'success' && '✅'}
      {type === 'error' && '❌'}
      {type === 'warning' && '⚠️'}
      {type === 'info' && 'ℹ️'}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 text-white hover:text-gray-200">✕</button>
    </div>
  );
};

export default function Home() {
  const [productionInfo, setProductionInfo] = useState(null);
  const [rows, setRows] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [scanType, setScanType] = useState('operator');
  const [isMobileScannerOpen, setIsMobileScannerOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [isSaving, setIsSaving] = useState(false);
  
  // API states
  const [buyers, setBuyers] = useState([]);
  const [styles, setStyles] = useState([]);
  const [floors, setFloors] = useState([]);
  const [floorLines, setFloorLines] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [breakdownFiles, setBreakdownFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredStyles, setFilteredStyles] = useState([]);
  
  const [formData, setFormData] = useState({
    buyerId: '', buyerName: '', styleId: '', styleName: '', jobNo: '', 
    breakdownProcessTitle: '', breakdownProcess: '', supervisorId: '',
    supervisorName: '', date: new Date().toISOString().split('T')[0],
    floorId: '', floorName: '', lineId: '', lineNumber: ''
  });

  const showToast = (message, type = 'info') => setToast({ show: true, message, type });
  const hideToast = () => setToast({ show: false, message: '', type: 'info' });

  // মোবাইল স্ক্যানার কন্ট্রোল
  useEffect(() => {
    let scanner = null;
    if (isMobileScannerOpen) {
      scanner = new Html5QrcodeScanner('reader', {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      });
      scanner.render((decodedText) => {
        handleScan(decodedText);
        setIsMobileScannerOpen(false);
        scanner.clear();
      }, (error) => {});
    }
    return () => { if (scanner) scanner.clear(); };
  }, [isMobileScannerOpen]);

  // ডেটা ফেচিং
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [buyersRes, stylesRes, floorsRes, floorLinesRes, supervisorsRes, filesRes] = await Promise.all([
          fetch('/api/buyers'), fetch('/api/styles'), fetch('/api/floors'),
          fetch('/api/floor-lines'), fetch('/api/supervisors'), fetch('/api/excell-upload/files')
        ]);
        const buyersData = await buyersRes.json();
        const stylesData = await stylesRes.json();
        const floorsData = await floorsRes.json();
        const floorLinesData = await floorLinesRes.json();
        const supervisorsData = await supervisorsRes.json();
        const filesData = await filesRes.json();

        if (buyersData.success) setBuyers(buyersData.data);
        if (stylesData.success) setStyles(stylesData.data);
        if (floorsData.success) setFloors(floorsData.data);
        setFloorLines(floorLinesData);
        setSupervisors(supervisorsData);
        if (filesData.success) setBreakdownFiles(filesData.data);
      } catch (error) {
        showToast('Error fetching data', 'error');
      } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.buyerId) {
      setFilteredStyles(styles.filter(style => style.buyerId._id === formData.buyerId));
    } else { setFilteredStyles([]); }
  }, [formData.buyerId, styles]);

  const filteredLines = floorLines.filter(line => line.floor._id === formData.floorId);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name === 'buyerId') {
      const selectedBuyer = buyers.find(buyer => buyer._id === value);
      setFormData(prev => ({ ...prev, buyerId: value, buyerName: selectedBuyer?.name || '', styleId: '', styleName: '', jobNo: '' }));
    } else if (name === 'styleId') {
      const selectedStyle = styles.find(style => style._id === value);
      setFormData(prev => ({ ...prev, styleId: value, styleName: selectedStyle?.name || '', jobNo: selectedStyle?.jobNo || prev.jobNo }));
    } else if (name === 'floorId') {
      const selectedFloor = floors.find(floor => floor._id === value);
      setFormData(prev => ({ ...prev, floorId: value, floorName: selectedFloor?.floorName || '', lineId: '', lineNumber: '' }));
    } else if (name === 'lineId') {
      const selectedLine = floorLines.find(line => line._id === value);
      setFormData(prev => ({ ...prev, lineId: value, lineNumber: selectedLine?.lineNumber || '' }));
    } else if (name === 'supervisorId') {
      const selectedSupervisor = supervisors.find(sup => sup._id === value);
      setFormData(prev => ({ ...prev, supervisorId: value, supervisorName: selectedSupervisor?.name || '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFormSubmit = () => {
    const requiredFields = ['buyerId', 'styleId', 'floorId', 'lineId', 'supervisorId'];
    if (requiredFields.some(field => !formData[field])) {
      showToast("Please fill all required fields", 'warning');
      return;
    }
    setProductionInfo({ ...formData });
    setRows([]);
    showToast("Production info saved! Now scan operators", 'success');
  };

 const normalizeKeys = (obj) => {
  const out = {};
  Object.keys(obj).forEach(k => {
    out[k.toLowerCase()] = obj[k];
  });
  return out;
};

const handleScan = (data) => {
  if (!data || typeof data !== 'string') {
    showToast('❌ No data received', 'error');
    return;
  }

  const lines = data
    .replace(/\r/g, '')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  lines.forEach(line => {
    let raw;

    try {
      raw = JSON.parse(line);
    } catch {
      console.warn('Invalid JSON skipped:', line);
      return;
    }

    // 🔥 normalize key names
    const parsed = normalizeKeys(raw);

    /* ================= OPERATOR ================= */
    if (parsed.type === 'operator') {
      const operatorId = parsed.operatorid; // ✅ normalized
      if (!operatorId) {
        console.warn('Operator object:', parsed);
        showToast('❌ Operator ID missing', 'error');
        return;
      }

      setRows(prev => {
        const exists = prev.some(
          r => r.operator?.operatorId === operatorId
        );

        if (exists) {
          showToast(`❌ Operator ${operatorId} already exists`, 'error');
          return prev;
        }

        showToast(`✅ Operator ${operatorId} added`, 'success');

        return [
          ...prev,
          {
            operator: {
              id: parsed.id,
              operatorId,
              name: parsed.name,
              designation: 'Operator',
            },
            machine: null,
            process: '',
            breakdownProcess: '',
            smv: '',
            workAs: 'operator',
            target: '',
            isNew: true,
          },
        ];
      });
    }

    /* ================= MACHINE ================= */
    else if (parsed.type === 'machine') {
      const uniqueId = parsed.uniqueid; // ✅ normalized
      if (!uniqueId) {
        console.warn('Machine object:', parsed);
        showToast('❌ Machine ID missing', 'error');
        return;
      }

      setRows(prev => {
        const machineExists = prev.some(
          r => r.machine?.uniqueId === uniqueId
        );

        if (machineExists) {
          showToast('❌ Machine already assigned', 'error');
          return prev;
        }

        const idx = [...prev]
          .reverse()
          .findIndex(r => r.operator && !r.machine);

        if (idx === -1) {
          showToast('⚠️ Scan operator first', 'warning');
          return prev;
        }

        const realIndex = prev.length - 1 - idx;

        showToast(`✅ Machine ${uniqueId} assigned`, 'success');

        return prev.map((r, i) =>
          i === realIndex
            ? {
                ...r,
                machine: {
                  id: parsed.id,
                  uniqueId,
                },
              }
            : r
        );
      });
    }
  });
};



  // ==========================================
  // UPDATED SAVE FUNCTION (Bulk Support)
  // ==========================================
  const handleSaveToDatabase = async () => {
    if (!productionInfo || rows.length === 0) {
      showToast('Please add production info and scan operators first', 'warning');
      return;
    }

    setIsSaving(true);
    showToast('Saving to database...', 'info');

    const dataToSave = {
      productionInfo: {
        date: productionInfo.date,
        supervisor: productionInfo.supervisorName, 
        floor: productionInfo.floorName,
        line: productionInfo.lineNumber,
        jobNo: productionInfo.jobNo || '',
        totalManpower: rows.length,
        buyerId: productionInfo.buyerId,
        buyerName: productionInfo.buyerName,
        styleId: productionInfo.styleId,
        styleName: productionInfo.styleName,
        breakdownProcessTitle: productionInfo.breakdownProcessTitle || '',
        breakdownProcess: productionInfo.breakdownProcess || '',
        supervisorId: productionInfo.supervisorId,
        floorId: productionInfo.floorId,
        lineId: productionInfo.lineId
      },
      rows: rows.map(row => ({
        operatorId: row.operator?.operatorId || '',
        operatorMongoId: row.operator?.id || '',
        operatorName: row.operator?.name || '',
        operatorDesignation: row.operator?.designation || 'Operator',
        machineUniqueId: row.machine?.uniqueId || '',
        machineMongoId: row.machine?.id || '', // গুরুত্বপূর্ণ: এটি ব্যাকএন্ডে লাস্টস্ক্যান আপডেটে লাগে
        machineType: row.machine?.machineType || '',
        process: row.process || '',
        breakdownProcess: row.breakdownProcess || '',
        smv: row.smv ? parseFloat(row.smv) : 0,
        workAs: row.workAs || 'operator',
        target: row.target ? parseInt(row.target) : 0
      }))
    };

    try {
      const response = await fetch('/api/daily-production/new-scan-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
      });
      const result = await response.json();
      if (result.success) {
        showToast(`✅ Saved! ${result.savedCount || rows.length} operators processed.`, 'success');
        setRows([]);
        setProductionInfo(null);
      } else {
        showToast('Failed to save: ' + (result.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      showToast('Error saving data to database', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen mt-18 bg-gray-50">
      {toast.show && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <style jsx>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slideIn { animation: slideIn 0.3s ease-out; }
      `}</style>

      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <ProductionForm 
            formData={formData} onFormChange={handleFormChange} onFormSubmit={handleFormSubmit}
            buyers={buyers} filteredStyles={filteredStyles} floors={floors}
            filteredLines={filteredLines} supervisors={supervisors} breakdownFiles={breakdownFiles}
          />
          
          {productionInfo && (
            <>
              <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row items-center justify-between border-l-4 border-blue-500 gap-4">
                <div className="flex items-center space-x-4">
                  <label className="text-lg font-bold text-gray-700">Total Manpower:</label>
                  <input type="number" value={rows.length} readOnly className="w-24 p-2 text-center text-xl font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-md focus:outline-none" />
                </div>
                <button onClick={() => setIsMobileScannerOpen(!isMobileScannerOpen)} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700">
                  {isMobileScannerOpen ? "Close Camera" : "📸 Open Mobile Scanner"}
                </button>
              </div>

              {isMobileScannerOpen && (
                <div className="bg-white p-4 rounded-lg shadow border-2 border-indigo-200">
                  <div id="reader" className="w-full"></div>
                </div>
              )}

              <ScanInput onScan={handleScan} disabled={!productionInfo} scanType={scanType} onScanTypeChange={setScanType} />
              <ProductionTable 
                rows={rows} productionInfo={productionInfo} selectedRow={selectedRow}
                onRowSelect={setSelectedRow} onAddRow={() => setRows([...rows, { operator: null, machine: null, isNew: true }])}
                onUpdateRow={(idx, data) => setRows(rows.map((r, i) => i === idx ? { ...r, ...data } : r))}
                onDeleteRow={(idx) => setRows(rows.filter((_, i) => i !== idx))}
              />
              
              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSaveToDatabase}
                  disabled={rows.length === 0 || isSaving}
                  className={`px-8 py-3 text-white rounded-lg font-bold flex items-center gap-2 transition-all ${isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 shadow-lg'}`}
                >
                  {isSaving ? "Saving to Database..." : `Save to Database (${rows.length})`}
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}