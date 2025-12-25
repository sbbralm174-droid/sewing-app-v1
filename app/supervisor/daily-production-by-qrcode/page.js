'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/daily-production/Header';
import ProductionForm from '@/components/daily-production/ProductionForm';
import ScanInput from '@/components/daily-production/ScanInput';
import ProductionTable from '@/components/daily-production/ProductionTable';

export default function Home() {
  const [productionInfo, setProductionInfo] = useState(null);
  const [rows, setRows] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [scanType, setScanType] = useState('operator');
  
  // API থেকে fetch করা ডেটা state
  const [buyers, setBuyers] = useState([]);
  const [styles, setStyles] = useState([]);
  const [floors, setFloors] = useState([]);
  const [floorLines, setFloorLines] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [breakdownFiles, setBreakdownFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtered styles based on selected buyer
  const [filteredStyles, setFilteredStyles] = useState([]);
  
  // Form data with IDs
  const [formData, setFormData] = useState({
    buyerId: '',
    buyerName: '',
    styleId: '',
    styleName: '',
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

  // Fetch all required data from APIs
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch buyers
        const buyersRes = await fetch('/api/buyers');
        const buyersData = await buyersRes.json();
        if (buyersData.success) {
          setBuyers(buyersData.data);
        }

        // Fetch styles
        const stylesRes = await fetch('/api/styles');
        const stylesData = await stylesRes.json();
        if (stylesData.success) {
          setStyles(stylesData.data);
        }

        // Fetch floors
        const floorsRes = await fetch('/api/floors');
        const floorsData = await floorsRes.json();
        if (floorsData.success) {
          setFloors(floorsData.data);
        }

        // Fetch floor lines
        const floorLinesRes = await fetch('/api/floor-lines');
        const floorLinesData = await floorLinesRes.json();
        setFloorLines(floorLinesData);

        // Fetch supervisors
        const supervisorsRes = await fetch('/api/supervisors');
        const supervisorsData = await supervisorsRes.json();
        setSupervisors(supervisorsData);

        // Fetch breakdown files
        const filesRes = await fetch('/api/excell-upload/files');
        const filesData = await filesRes.json();
        if (filesData.success) {
          setBreakdownFiles(filesData.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        alert('Failed to load data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter styles when buyer changes
  useEffect(() => {
    if (formData.buyerId) {
      const buyerStyles = styles.filter(style => 
        style.buyerId._id === formData.buyerId
      );
      setFilteredStyles(buyerStyles);
      
      // Reset style if current style doesn't belong to selected buyer
      if (formData.styleId && !buyerStyles.some(style => style._id === formData.styleId)) {
        setFormData(prev => ({
          ...prev,
          styleId: '',
          styleName: ''
        }));
      }
    } else {
      setFilteredStyles([]);
    }
  }, [formData.buyerId, styles]);

  // Filter lines when floor changes
  const filteredLines = floorLines.filter(line => 
    line.floor._id === formData.floorId
  );

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'buyerId') {
      const selectedBuyer = buyers.find(buyer => buyer._id === value);
      setFormData(prev => ({
        ...prev,
        buyerId: value,
        buyerName: selectedBuyer ? selectedBuyer.name : '',
        styleId: '',
        styleName: ''
      }));
    }
    else if (name === 'styleId') {
      const selectedStyle = styles.find(style => style._id === value);
      setFormData(prev => ({
        ...prev,
        styleId: value,
        styleName: selectedStyle ? selectedStyle.name : ''
      }));
    }
    else if (name === 'floorId') {
      const selectedFloor = floors.find(floor => floor._id === value);
      setFormData(prev => ({
        ...prev,
        floorId: value,
        floorName: selectedFloor ? selectedFloor.floorName : '',
        lineId: '',
        lineNumber: ''
      }));
    }
    else if (name === 'lineId') {
      const selectedLine = floorLines.find(line => line._id === value);
      setFormData(prev => ({
        ...prev,
        lineId: value,
        lineNumber: selectedLine ? selectedLine.lineNumber : ''
      }));
    }
    else if (name === 'supervisorId') {
      const selectedSupervisor = supervisors.find(sup => sup._id === value);
      setFormData(prev => ({
        ...prev,
        supervisorId: value,
        supervisorName: selectedSupervisor ? selectedSupervisor.name : ''
      }));
    }
    else if (name === 'breakdownProcess') {
      const selectedFile = breakdownFiles.find(file => file._id === value);
      setFormData(prev => ({
        ...prev,
        breakdownProcess: value,
        breakdownProcessTitle: selectedFile ? selectedFile.fileName : ''
      }));
    }
    else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFormSubmit = () => {
    // Validate required fields
    const requiredFields = ['buyerId', 'styleId', 'floorId', 'lineId', 'supervisorId'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      alert(`Please fill all required fields: ${missingFields.map(f => {
        if (f === 'buyerId') return 'Buyer';
        if (f === 'styleId') return 'Style';
        if (f === 'floorId') return 'Floor';
        if (f === 'lineId') return 'Line';
        if (f === 'supervisorId') return 'Supervisor';
        return f;
      }).join(', ')}`);
      return;
    }
    
    setProductionInfo({ ...formData });
    setRows([]);
    setSelectedRow(null);
  };

  const handleScan = (data) => {
  try {
    const parsedData = JSON.parse(data);

    // ===============================
    // OPERATOR SCAN
    // ===============================
    if (parsedData.type === 'operator') {

      // ❌ Duplicate operator check (whole table)
      const isDuplicate = rows.some(row =>
        row.operator &&
        (row.operator.id === parsedData.id ||
         row.operator.operatorId === parsedData.operatorId)
      );

      if (isDuplicate) {
        const index = rows.findIndex(row =>
          row.operator &&
          (row.operator.id === parsedData.id ||
           row.operator.operatorId === parsedData.operatorId)
        );

        alert(`❌ Operator "${parsedData.name}" already exists in Row ${index + 1}`);
        return;
      }

      // ✅ Create new row with operator
      const newRow = {
        operator: {
          id: parsedData.id,
          operatorId: parsedData.operatorId,
          name: parsedData.name,
          designation: parsedData.designation || 'Operator'
        },
        machine: null,
        process: '',
        breakdownProcess: '',
        smv: '',
        workAs: 'operator',
        target: '',
        isNew: true
      };

      setRows(prev => [...prev, newRow]);

      // auto highlight remove
      setTimeout(() => {
        setRows(prev => prev.map(r => ({ ...r, isNew: false })));
      }, 1500);

      return;
    }

    // ===============================
    // MACHINE SCAN
    // ===============================
    if (parsedData.type === 'machine') {

      // ❌ Duplicate machine check
      const isMachineDuplicate = rows.some(row =>
        row.machine &&
        (row.machine.id === parsedData.id ||
         row.machine.uniqueId === parsedData.uniqueId)
      );

      if (isMachineDuplicate) {
        const index = rows.findIndex(row =>
          row.machine &&
          (row.machine.id === parsedData.id ||
           row.machine.uniqueId === parsedData.uniqueId)
        );

        alert(`❌ Machine "${parsedData.uniqueId}" already exists in Row ${index + 1}`);
        return;
      }

      // ✅ Find target row
      let targetRowIndex = null;

      // 1️⃣ selected row priority
      if (selectedRow !== null && rows[selectedRow]?.operator) {
        targetRowIndex = selectedRow;
      }
      // 2️⃣ last row with operator but no machine
      else {
        for (let i = rows.length - 1; i >= 0; i--) {
          if (rows[i].operator && !rows[i].machine) {
            targetRowIndex = i;
            break;
          }
        }
      }

      // ❌ still no operator
      if (targetRowIndex === null) {
        alert('⚠️ No operator found. Please scan operator first.');
        return;
      }

      // ✅ Assign machine
      setRows(prev =>
        prev.map((row, index) =>
          index === targetRowIndex
            ? {
                ...row,
                machine: {
                  id: parsedData.id,
                  uniqueId: parsedData.uniqueId,
                  machineType: parsedData.machineType
                }
              }
            : row
        )
      );

      setSelectedRow(null);
      return;
    }

  } catch (err) {
    console.error(err);
    alert('Invalid scan data. Please check QR format.');
  }
};


  const handleRowSelect = (index) => {
    setSelectedRow(index);
  };

  const handleMachineAssign = (index, machineData) => {
    setRows(prev => prev.map((row, i) => 
      i === index ? { ...row, machine: machineData } : row
    ));
    setSelectedRow(null);
  };

  const handleAddRow = () => {
  const newRow = {
    operator: null,
    machine: null,
    process: '',
    breakdownProcess: '',
    smv: '',
    workAs: 'operator',
    target: '',
    isNew: true
  };
  
  setRows(prev => [...prev, newRow]);
  
  setTimeout(() => {
    setRows(prev => prev.map(row => ({ ...row, isNew: false })));
  }, 2000);
};

  const handleUpdateRow = (index, updatedData) => {
  // যদি অপারেটর আপডেট করা হয়, ডুপ্লিকেট চেক করুন
  if (updatedData.operator) {
    const isOperatorDuplicate = rows.some((row, i) => 
      i !== index && 
      row.operator && 
      (row.operator.id === updatedData.operator.id || 
       row.operator.operatorId === updatedData.operator.operatorId)
    );
    
    if (isOperatorDuplicate) {
      alert(`❌ Operator "${updatedData.operator.name}" already exists in another row.`);
      return;
    }
  }
  
  // যদি মেশিন আপডেট করা হয়, ডুপ্লিকেট চেক করুন
  if (updatedData.machine) {
    const isMachineDuplicate = rows.some((row, i) => 
      i !== index && 
      row.machine && 
      (row.machine.id === updatedData.machine.id || 
       row.machine.uniqueId === updatedData.machine.uniqueId)
    );
    
    if (isMachineDuplicate) {
      alert(`❌ Machine "${updatedData.machine.uniqueId}" already exists in another row.`);
      return;
    }
  }
  
  setRows(prev => prev.map((row, i) => 
    i === index ? { ...row, ...updatedData } : row
  ));
};

  const handleSaveToDatabase = async () => {
  if (!productionInfo) {
    alert('Please fill in production information first.');
    return;
  }

  if (rows.length === 0) {
    alert('No data to save. Please add at least one operator.');
    return;
  }

  // Validate each row has operator
  const rowsWithoutOperator = rows.filter(row => !row.operator);
  if (rowsWithoutOperator.length > 0) {
    alert(`${rowsWithoutOperator.length} row(s) are missing operator. Please assign operators to all rows.`);
    return;
  }

  // Validate productionInfo has required fields
  const requiredProdInfo = [
    'supervisorName', 'floorName', 'lineNumber', 
    'buyerId', 'styleId', 'supervisorId', 'floorId', 'lineId'
  ];
  
  const missingProdInfo = requiredProdInfo.filter(field => !productionInfo[field]);
  if (missingProdInfo.length > 0) {
    alert(`Missing production information: ${missingProdInfo.join(', ')}`);
    return;
  }

  // Debug: Show what we're sending
  console.log('=== DEBUG: Current Production Info ===');
  console.log('Buyer ID:', productionInfo.buyerId, 'Type:', typeof productionInfo.buyerId);
  console.log('Style ID:', productionInfo.styleId, 'Type:', typeof productionInfo.styleId);
  console.log('Operator IDs:', rows.map(r => r.operator?.id));

  // Prepare data with correct structure for backend
  const dataToSave = {
    productionInfo: {
      date: productionInfo.date,
      supervisor: productionInfo.supervisorName,
      floor: productionInfo.floorName,
      line: productionInfo.lineNumber,
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
    rows: rows.map(row => {
      // Make sure operator has required fields
      const operatorId = row.operator?.id || '';
      const operatorName = row.operator?.name || '';
      
      if (!operatorId || !operatorName) {
        console.error('Row missing operator data:', row);
      }

      return {
        operatorId: operatorId,
        operatorName: operatorName,
        operatorDesignation: row.operator?.designation || 'Operator',
        machineUniqueId: row.machine?.uniqueId || '',
        machineType: row.machine?.machineType || '',
        process: row.process || '',
        breakdownProcess: row.breakdownProcess || '',
        smv: row.smv ? parseFloat(row.smv) : 0,
        workAs: row.workAs || 'operator',
        target: row.target ? parseInt(row.target) : 0
      };
    })
  };

  console.log('=== FINAL DATA TO SEND ===');
  console.log('Production Info:', JSON.stringify(dataToSave.productionInfo, null, 2));
  console.log('First row:', dataToSave.rows[0]);
  console.log('=== END ===');

  try {
    const response = await fetch('/api/daily-production/new-scan-save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSave),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      alert(`✅ Successfully saved ${result.count} records!`);
      console.log('Save response:', result);
      
      // Reset form after successful save
      setProductionInfo(null);
      setRows([]);
      setSelectedRow(null);
      setFormData({
        buyerId: '',
        buyerName: '',
        styleId: '',
        styleName: '',
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
    } else {
      throw new Error(result.message || 'Failed to save data');
    }
  } catch (error) {
    console.error('Error saving data:', error);
    alert(`❌ Error saving data: ${error.message}`);
    
    // Show more detailed error
    if (error.message.includes('validation failed')) {
      alert('Validation failed. Please check:\n1. All required fields are filled\n2. Buyer and Style are selected\n3. All operators have valid IDs');
    }
  }
};

  const handleDeleteRow = (index) => {
    if (window.confirm('Are you sure you want to delete this row?')) {
      setRows(prev => prev.filter((_, i) => i !== index));
      if (selectedRow === index) {
        setSelectedRow(null);
      } else if (selectedRow > index) {
        setSelectedRow(selectedRow - 1);
      }
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all rows?')) {
      setRows([]);
      setSelectedRow(null);
    }
  };

  // Function to show data preview
  const showDataPreview = () => {
    if (!productionInfo) {
      alert('Please fill production information first.');
      return;
    }

    const previewData = {
      productionInfo: {
        ...productionInfo,
        date: new Date(productionInfo.date).toLocaleDateString()
      },
      rows: rows.map((row, index) => ({
        row: index + 1,
        operator: row.operator ? `${row.operator.name} (${row.operator.operatorId})` : 'Not assigned',
        machine: row.machine ? `${row.machine.uniqueId} (${row.machine.machineType})` : 'Not assigned',
        process: row.process,
        target: row.target
      }))
    };

    const previewWindow = window.open();
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head>
            <title>Data Preview</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #333; }
              h2 { color: #555; margin-top: 20px; }
              .summary { background: #f0f8ff; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
              .summary p { margin: 5px 0; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #4CAF50; color: white; }
              tr:nth-child(even) { background-color: #f2f2f2; }
              button { 
                background: #4CAF50; 
                color: white; 
                padding: 10px 20px; 
                border: none; 
                border-radius: 5px; 
                cursor: pointer;
                margin-top: 20px;
              }
              button:hover { background: #45a049; }
            </style>
          </head>
          <body>
            <h1>Production Data Preview</h1>
            
            <div class="summary">
              <h2>Summary</h2>
              <p><strong>Total Rows:</strong> ${rows.length}</p>
              <p><strong>Buyer:</strong> ${productionInfo.buyerName}</p>
              <p><strong>Style:</strong> ${productionInfo.styleName}</p>
              <p><strong>Floor:</strong> ${productionInfo.floorName}</p>
              <p><strong>Line:</strong> ${productionInfo.lineNumber}</p>
              <p><strong>Supervisor:</strong> ${productionInfo.supervisorName}</p>
              <p><strong>Date:</strong> ${new Date(productionInfo.date).toLocaleDateString()}</p>
            </div>
            
            <h2>Operators and Machines</h2>
            <table>
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Operator</th>
                  <th>Operator ID</th>
                  <th>Machine</th>
                  <th>Machine Type</th>
                  <th>Process</th>
                  <th>Target</th>
                </tr>
              </thead>
              <tbody>
                ${rows.map((row, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${row.operator?.name || 'Not assigned'}</td>
                    <td>${row.operator?.operatorId || '-'}</td>
                    <td>${row.machine?.uniqueId || 'Not assigned'}</td>
                    <td>${row.machine?.machineType || '-'}</td>
                    <td>${row.process || '-'}</td>
                    <td>${row.target || '0'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <button onclick="window.close()">Close Preview</button>
          </body>
        </html>
      `);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <ProductionForm 
            formData={formData}
            onFormChange={handleFormChange}
            onFormSubmit={handleFormSubmit}
            buyers={buyers}
            filteredStyles={filteredStyles}
            floors={floors}
            filteredLines={filteredLines}
            supervisors={supervisors}
            breakdownFiles={breakdownFiles}
          />
          
          {productionInfo && (
            <>
              <ScanInput 
                onScan={handleScan}
                disabled={!productionInfo}
                scanType={scanType}
                onScanTypeChange={setScanType}
              />
              
              <ProductionTable 
                rows={rows}
                productionInfo={productionInfo}
                selectedRow={selectedRow}
                onRowSelect={handleRowSelect}
                onMachineAssign={handleMachineAssign}
                onAddRow={handleAddRow}
                onUpdateRow={handleUpdateRow}
                onDeleteRow={handleDeleteRow}
              />
              
              {/* Action Buttons */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex justify-between items-center">
                    
                    <div className="flex space-x-3">
                      <button
                        onClick={showDataPreview}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Preview Data
                      </button>
                      <button
                        onClick={handleClearAll}
                        disabled={rows.length === 0}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center ${
                          rows.length === 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-red-500 text-white hover:bg-red-600 transition-colors'
                        }`}
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Clear All
                      </button>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        <p className="mb-1">
                          <span className="font-semibold">Note:</span> 
                          <span className={`ml-1 ${rows.some(row => !row.operator) ? 'text-red-600' : 'text-green-600'}`}>
                            {rows.some(row => !row.operator) 
                              ? 'Some rows are missing operators.' 
                              : 'All rows have operators assigned.'}
                          </span>
                        </p>
                        <p>
                          <span className="font-semibold">Rows without machine:</span> 
                          <span className="ml-1">
                            {rows.filter(row => !row.machine).length} out of {rows.length}
                          </span>
                        </p>
                      </div>
                      <button
                        onClick={handleSaveToDatabase}
                        disabled={rows.length === 0 || rows.some(row => !row.operator)}
                        className={`px-6 py-3 rounded-lg font-medium flex items-center ${
                          rows.length === 0 || rows.some(row => !row.operator)
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700 transition-colors'
                        }`}
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save to Database
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
          
          {!productionInfo && !loading && (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Start Production Monitoring
              </h3>
              <p className="text-gray-600 mb-4">
                Fill in the production information above to begin scanning operators and machines.
              </p>
              <div className="text-sm text-gray-500 inline-flex flex-wrap justify-center gap-4">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  {buyers.length} buyers available
                </span>
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  {styles.length} styles available
                </span>
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  {floors.length} floors available
                </span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}