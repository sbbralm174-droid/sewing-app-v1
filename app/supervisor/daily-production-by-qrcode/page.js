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
  const [formData, setFormData] = useState({
    buyer: '',
    style: '',
    breakdownProcesses: '',
    supervisor: '',
    date: new Date().toISOString().split('T')[0],
    floor: '',
    line: ''
  });

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = () => {
    setProductionInfo({ ...formData });
    // Initialize with empty rows
    setRows([]);
    setSelectedRow(null);
  };

  const handleScan = (data) => {
    try {
      const parsedData = JSON.parse(data);
      
      if (parsedData.type === 'operator') {
        // Add new row with operator
        const newRow = {
          operator: {
            id: parsedData.id,
            operatorId: parsedData.operatorId,
            name: parsedData.name,
            designation: parsedData.designation
          },
          machine: null,
          process: '',
          breakdownProcess: '',
          smv: '',
          workAs: '',
          target: '',
          isNew: true
        };
        
        setRows(prev => [...prev, newRow]);
        
        // Remove new flag after 2 seconds
        setTimeout(() => {
          setRows(prev => prev.map(row => ({ ...row, isNew: false })));
        }, 2000);
        
      } else if (parsedData.type === 'machine') {
        // Assign machine to selected row or last row
        const targetRow = selectedRow !== null ? selectedRow : rows.length - 1;
        
        if (targetRow >= 0 && targetRow < rows.length) {
          setRows(prev => prev.map((row, index) => 
            index === targetRow 
              ? { ...row, machine: {
                  id: parsedData.id,
                  uniqueId: parsedData.uniqueId,
                  machineType: parsedData.machineType
                }}
              : row
          ));
          
          // Reset selected row
          setSelectedRow(null);
        } else {
          // Add new row with machine if no rows exist
          const newRow = {
            operator: null,
            machine: {
              id: parsedData.id,
              uniqueId: parsedData.uniqueId,
              machineType: parsedData.machineType
            },
            process: '',
            breakdownProcess: '',
            smv: '',
            workAs: '',
            target: '',
            isNew: true
          };
          
          setRows(prev => [...prev, newRow]);
          
          setTimeout(() => {
            setRows(prev => prev.map(row => ({ ...row, isNew: false })));
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Invalid scan data:', error);
      alert('Invalid scan data. Please check the format.');
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
      workAs: '',
      target: '',
      isNew: true
    };
    
    setRows(prev => [...prev, newRow]);
    
    setTimeout(() => {
      setRows(prev => prev.map(row => ({ ...row, isNew: false })));
    }, 2000);
  };

  const handleUpdateRow = (index, updatedData) => {
    setRows(prev => prev.map((row, i) => 
      i === index ? { ...row, ...updatedData } : row
    ));
  };

  // Load sample data for demonstration
  useEffect(() => {
    // You can remove this in production
    const loadSampleData = () => {
      setFormData({
        buyer: 'H&M',
        style: 'SS24-001',
        breakdownProcesses: 'Cutting, Sewing, Finishing',
        supervisor: 'John Smith',
        date: new Date().toISOString().split('T')[0],
        floor: '3',
        line: 'Line 5'
      });
      
      setProductionInfo({
        buyer: 'H&M',
        style: 'SS24-001',
        breakdownProcesses: 'Cutting, Sewing, Finishing',
        supervisor: 'John Smith',
        date: new Date().toISOString().split('T')[0],
        floor: '3',
        line: 'Line 5'
      });
      
      setRows([
        {
          operator: {
            id: '6947bef508ac0c7b97ac99d8',
            operatorId: 'TGS-005754',
            name: 'MST. ASMA AKTER',
            designation: 'OPERATOR'
          },
          machine: {
            id: '6947cd7108ac0c7b97ac9a2c',
            uniqueId: 'GT-BTK-40',
            machineType: 'Unknown'
          },
          process: 'Sewing',
          breakdownProcess: 'Sleeve Attachment',
          smv: '2.5',
          workAs: 'Regular',
          target: '120'
        }
      ]);
    };
    
    // Uncomment to load sample data automatically
    // loadSampleData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <ProductionForm 
            formData={formData}
            onFormChange={handleFormChange}
            onFormSubmit={handleFormSubmit}
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
              />
            </>
          )}
          
          {!productionInfo && (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Start Production Monitoring
              </h3>
              <p className="text-gray-600">
                Fill in the production information above to begin scanning operators and machines.
              </p>
            </div>
          )}
          
          {/* Instructions Panel */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-3">
              How to Use:
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start">
                <span className="inline-block w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-center mr-2 flex-shrink-0">1</span>
                Fill in all production information fields and click "Submit Production Info"
              </li>
              <li className="flex items-start">
                <span className="inline-block w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-center mr-2 flex-shrink-0">2</span>
                Select scan type (Operator/Machine) and paste QR code data or use manual entry
              </li>
              <li className="flex items-start">
                <span className="inline-block w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-center mr-2 flex-shrink-0">3</span>
                Operator scan: Adds a new row with operator details
              </li>
              <li className="flex items-start">
                <span className="inline-block w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-center mr-2 flex-shrink-0">4</span>
                Machine scan: Assigns to selected row (click machine column to select) or last row
              </li>
              <li className="flex items-start">
                <span className="inline-block w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-center mr-2 flex-shrink-0">5</span>
                Use "Edit" button to modify other fields like Process, SMV, Target, etc.
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}