'use client';

import { useState, useEffect, useRef } from 'react'; // useRef যোগ করা হয়েছে
import Header from '@/components/daily-production/Header';
import ProductionForm from '@/components/daily-production/ProductionForm';
import ScanInput from '@/components/daily-production/ScanInput';
import ProductionTable from '@/components/daily-production/ProductionTable';
import { Html5QrcodeScanner } from 'html5-qrcode'; // Scanner ইম্পোর্ট

export default function Home() {
  const [productionInfo, setProductionInfo] = useState(null);
  const [rows, setRows] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [scanType, setScanType] = useState('operator');
  const [isMobileScannerOpen, setIsMobileScannerOpen] = useState(false); // মোবাইল স্ক্যানার স্টেট
  
  // API থেকে fetch করা ডেটা state
  const [buyers, setBuyers] = useState([]);
  const [styles, setStyles] = useState([]);
  const [floors, setFloors] = useState([]);
  const [floorLines, setFloorLines] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [breakdownFiles, setBreakdownFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filteredStyles, setFilteredStyles] = useState([]);
  
  const [formData, setFormData] = useState({
    buyerId: '',
    buyerName: '',
    styleId: '',
    styleName: '',
    jobNo: '', 
    breakdownProcessTitle: '',
    breakdownProcess: '',
    supervisorId: '',
    supervisorName: '',
    date: new Date().toISOString().split('T')[0],
    floorId: '',
    floorName: '',
    lineId: '',
    lineNumber: ''
  });

  // মোবাইল স্ক্যানার কন্ট্রোল করার জন্য useEffect
  useEffect(() => {
    let scanner = null;
    if (isMobileScannerOpen) {
      scanner = new Html5QrcodeScanner('reader', {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      });

      scanner.render((decodedText) => {
        handleScan(decodedText);
        setIsMobileScannerOpen(false); // স্ক্যান সফল হলে ক্যামেরা বন্ধ হবে
        scanner.clear();
      }, (error) => {
        // console.warn(error);
      });
    }

    return () => {
      if (scanner) scanner.clear();
    };
  }, [isMobileScannerOpen]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [buyersRes, stylesRes, floorsRes, floorLinesRes, supervisorsRes, filesRes] = await Promise.all([
          fetch('/api/buyers'),
          fetch('/api/styles'),
          fetch('/api/floors'),
          fetch('/api/floor-lines'),
          fetch('/api/supervisors'),
          fetch('/api/excell-upload/files')
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
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.buyerId) {
      const buyerStyles = styles.filter(style => style.buyerId._id === formData.buyerId);
      setFilteredStyles(buyerStyles);
    } else {
      setFilteredStyles([]);
    }
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
      alert("Please fill all required fields");
      return;
    }
    setProductionInfo({ ...formData });
    setRows([]);
  };

  const handleScan = (data) => {
    try {
      const parsedData = JSON.parse(data);
      if (parsedData.type === 'operator') {
        const isDuplicate = rows.some(row => row.operator?.operatorId === parsedData.operatorId);
        if (isDuplicate) {
          alert(`❌ Operator "${parsedData.name}" already exists`);
          return;
        }
        const newRow = {
          operator: { id: parsedData.id, operatorId: parsedData.operatorId, name: parsedData.name, designation: parsedData.designation || 'Operator' },
          machine: null, process: '', breakdownProcess: '', smv: '', workAs: 'operator', target: '', isNew: true
        };
        setRows(prev => [...prev, newRow]);
        setTimeout(() => setRows(prev => prev.map(r => ({ ...r, isNew: false }))), 1500);
      }
      if (parsedData.type === 'machine') {
        const isMachineDuplicate = rows.some(row => row.machine?.uniqueId === parsedData.uniqueId);
        if (isMachineDuplicate) { alert('Machine already exists'); return; }
        let targetIndex = selectedRow !== null ? selectedRow : rows.findLastIndex(r => r.operator && !r.machine);
        if (targetIndex === -1) { alert('Scan operator first'); return; }
        setRows(prev => prev.map((row, i) => i === targetIndex ? { ...row, machine: { id: parsedData.id, uniqueId: parsedData.uniqueId, machineType: parsedData.machineType } } : row));
        setSelectedRow(null);
      }
    } catch (err) { alert('Invalid QR Data Format'); }
  };

  const handleSaveToDatabase = async () => {
    if (!productionInfo || rows.length === 0) {
      alert('Missing data to save');
      return;
    }

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
        alert(`✅ Saved! Total Manpower: ${rows.length}`);
        setRows([]);
        setProductionInfo(null);
      }
    } catch (error) {
      alert('Error saving data');
    }
  };

  return (
    <div className="min-h-screen mt-18 bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <ProductionForm 
            formData={formData} 
            onFormChange={handleFormChange} 
            onFormSubmit={handleFormSubmit}
            buyers={buyers} filteredStyles={filteredStyles} floors={floors}
            filteredLines={filteredLines} supervisors={supervisors} breakdownFiles={breakdownFiles}
          />
          
          {productionInfo && (
            <>
              <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row items-center justify-between border-l-4 border-blue-500 gap-4">
                <div className="flex items-center space-x-4">
                  <label className="text-lg font-bold text-gray-700">Total Manpower:</label>
                  <input 
                    type="number" 
                    value={rows.length} 
                    readOnly 
                    className="w-24 p-2 text-center text-xl font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-md focus:outline-none"
                  />
                </div>

                {/* মোবাইল স্ক্যানার বাটন */}
                <button 
                  onClick={() => setIsMobileScannerOpen(!isMobileScannerOpen)}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 flex items-center"
                >
                  {isMobileScannerOpen ? "Close Camera" : "📸 Open Mobile Scanner"}
                </button>

                <p className="text-sm text-gray-500 italic hidden md:block">* Updates automatically as you scan operators</p>
              </div>

              {/* মোবাইল ক্যামেরার জন্য রেন্ডারিং এরিয়া */}
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
                  disabled={rows.length === 0}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:bg-gray-400"
                >
                  Save to Database ({rows.length})
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}