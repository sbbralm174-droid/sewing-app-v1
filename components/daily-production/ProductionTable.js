'use client';

import { useState } from 'react';

export default function ProductionTable({ 
  rows, 
  productionInfo, 
  selectedRow,
  onRowSelect,
  onAddRow,
  onUpdateRow 
}) {
  const [editingRow, setEditingRow] = useState(null);
  const [editData, setEditData] = useState({});

  const handleEditClick = (row, index) => {
    setEditingRow(index);
    setEditData({ ...row });
  };

  const handleSaveClick = (index) => {
    onUpdateRow(index, editData);
    setEditingRow(null);
    setEditData({});
  };

  const handleCancelClick = () => {
    setEditingRow(null);
    setEditData({});
  };

  const handleEditChange = (e, field) => {
    const { value } = e.target;
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleMachineCellClick = (e, index) => {
    e.stopPropagation();
    onRowSelect(index);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Production Line Details</h2>
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <span className="text-gray-600">Selected: </span>
              <span className="font-medium text-blue-600">
                {selectedRow !== null ? `Row ${selectedRow + 1}` : 'None'}
              </span>
            </div>
            <button
              onClick={onAddRow}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm"
            >
              Add New Row
            </button>
          </div>
        </div>
        {productionInfo && (
          <div className="mt-2 text-sm text-gray-600">
            <span className="font-medium">Buyer:</span> {productionInfo.buyer} | 
            <span className="font-medium ml-4">Style:</span> {productionInfo.style} | 
            <span className="font-medium ml-4">Floor:</span> {productionInfo.floor} | 
            <span className="font-medium ml-4">Line:</span> {productionInfo.line}
          </div>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Row
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Operator
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Machine
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Process
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Breakdown Process
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SMV
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Work As
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Target
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((row, index) => (
              <tr 
                key={index} 
                className={`hover:bg-gray-50 ${selectedRow === index ? 'bg-blue-50' : ''} ${row.isNew ? 'bg-green-50 animate-pulse' : ''}`}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {index + 1}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {editingRow === index ? (
                    <input
                      type="text"
                      value={editData.operator?.name || ''}
                      onChange={(e) => handleEditChange(e, 'operator')}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="Operator name"
                    />
                  ) : (
                    <div>
                      <div className="font-medium">{row.operator?.name || '-'}</div>
                      <div className="text-xs text-gray-500">{row.operator?.operatorId || ''}</div>
                    </div>
                  )}
                </td>
                
                <td 
                  className="px-6 py-4 whitespace-nowrap text-sm"
                >
                  <div 
                    onClick={(e) => handleMachineCellClick(e, index)}
                    className={`p-2 rounded cursor-pointer transition-all ${selectedRow === index ? 'bg-yellow-100 border-2 border-yellow-400' : 'bg-gray-100 hover:bg-gray-200 border border-transparent'}`}
                    title="Click to select for machine assignment"
                  >
                    {editingRow === index ? (
                      <input
                        type="text"
                        value={editData.machine?.uniqueId || ''}
                        onChange={(e) => handleEditChange(e, 'machine')}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="Machine ID"
                      />
                    ) : (
                      <>
                        <div className="font-medium">{row.machine?.uniqueId || 'Click to assign machine'}</div>
                        <div className="text-xs text-gray-500">{row.machine?.machineType || ''}</div>
                        {selectedRow === index && (
                          <div className="text-xs text-yellow-600 font-medium mt-1">
                            ✓ Selected for machine assignment
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </td>
                
                {/* ... rest of the cells remain the same ... */}
                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {editingRow === index ? (
                    <input
                      type="text"
                      value={editData.process || ''}
                      onChange={(e) => handleEditChange(e, 'process')}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="Process"
                    />
                  ) : (
                    row.process || '-'
                  )}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {editingRow === index ? (
                    <input
                      type="text"
                      value={editData.breakdownProcess || ''}
                      onChange={(e) => handleEditChange(e, 'breakdownProcess')}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="Breakdown Process"
                    />
                  ) : (
                    row.breakdownProcess || '-'
                  )}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {editingRow === index ? (
                    <input
                      type="number"
                      value={editData.smv || ''}
                      onChange={(e) => handleEditChange(e, 'smv')}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="SMV"
                      step="0.01"
                    />
                  ) : (
                    row.smv || '-'
                  )}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {editingRow === index ? (
                    <select
                      value={editData.workAs || ''}
                      onChange={(e) => handleEditChange(e, 'workAs')}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="">Select...</option>
                      <option value="Regular">Regular</option>
                      <option value="Helper">Helper</option>
                      <option value="Supervisor">Supervisor</option>
                      <option value="Quality Checker">Quality Checker</option>
                    </select>
                  ) : (
                    row.workAs || '-'
                  )}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {editingRow === index ? (
                    <input
                      type="number"
                      value={editData.target || ''}
                      onChange={(e) => handleEditChange(e, 'target')}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="Target"
                    />
                  ) : (
                    row.target || '-'
                  )}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {editingRow === index ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSaveClick(index)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelClick}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEditClick(row, index)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
            
            {/* Empty state */}
            {rows.length === 0 && (
              <tr>
                <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                  No data available. Start by adding production information and scanning operators.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <div>
            Total Rows: <span className="font-medium">{rows.length}</span>
          </div>
          <div>
            Operators Assigned: <span className="font-medium">
              {rows.filter(row => row.operator).length}
            </span>
          </div>
          <div>
            Machines Assigned: <span className="font-medium">
              {rows.filter(row => row.machine).length}
            </span>
          </div>
          <div>
            Selected Row: <span className="font-medium text-blue-600">
              {selectedRow !== null ? `${selectedRow + 1}` : 'None'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}