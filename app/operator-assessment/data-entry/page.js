// app/operator-assessment/data-entry/page.js
'use client'
import { useState, useEffect } from 'react'

export default function DataEntry({ onSave, onCancel, initialData }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    operatorName: 'Most .Rahima Khatun',
    fatherHusbandName: 'Md.Afser Khan',
    educationalStatus: 'Five Above',
    sewingFloor: 'Sewing Floor',
    processes: [
      {
        machineType: 'SNLS/DNLS',
        processName: 'Main Lavel Attach',
        dop: 'Basic',
        smv: 0.3,
        cycleTimes: [22, 23, 25, 22, 23],
        qualityStatus: 'No Defect',
        remarks: ''
      },
      {
        machineType: 'Flat Lock',
        processName: 'Body Hem',
        dop: 'Critical',
        smv: 0.33,
        cycleTimes: [28, 27, 26, 25, 24],
        qualityStatus: '',
        remarks: ''
      }
    ]
  })

  // initialData থাকলে সেট করা
  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    }
  }, [initialData])

  const updateProcess = (index, field, value) => {
    const updatedProcesses = [...formData.processes]
    if (field.startsWith('cycleTime')) {
      const cycleIndex = parseInt(field.split('-')[1])
      updatedProcesses[index].cycleTimes[cycleIndex] = parseFloat(value) || 0
    } else {
      updatedProcesses[index][field] = value
    }
    setFormData({ ...formData, processes: updatedProcesses })
  }

  const addProcess = () => {
    setFormData({
      ...formData,
      processes: [
        ...formData.processes,
        {
          machineType: '',
          processName: '',
          dop: '',
          smv: 0,
          cycleTimes: [0, 0, 0, 0, 0],
          qualityStatus: '',
          remarks: ''
        }
      ]
    })
  }

  const removeProcess = (index) => {
    const updatedProcesses = formData.processes.filter((_, i) => i !== index)
    setFormData({ ...formData, processes: updatedProcesses })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
      {/* Operator Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sewing Floor</label>
          <input
            type="text"
            value={formData.sewingFloor}
            onChange={(e) => setFormData({ ...formData, sewingFloor: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Operator Name</label>
          <input
            type="text"
            value={formData.operatorName}
            onChange={(e) => setFormData({ ...formData, operatorName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Father's/Husband's Name</label>
          <input
            type="text"
            value={formData.fatherHusbandName}
            onChange={(e) => setFormData({ ...formData, fatherHusbandName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Educational Status</label>
          <select
            value={formData.educationalStatus}
            onChange={(e) => setFormData({ ...formData, educationalStatus: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Five Above">Five Above</option>
            <option value="Below Five">Below Five</option>
          </select>
        </div>
      </div>

      {/* Process Table */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Process Measurements</h3>
          <button
            type="button"
            onClick={addProcess}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Process
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 border">SL</th>
                <th className="px-4 py-2 border">Machine Types</th>
                <th className="px-4 py-2 border">Process Name</th>
                <th className="px-4 py-2 border">DOP</th>
                <th className="px-4 py-2 border">SMV</th>
                {[1, 2, 3, 4, 5].map(num => (
                  <th key={num} className="px-4 py-2 border">{num}st Cycle Time</th>
                ))}
                <th className="px-4 py-2 border">Quality Status</th>
                <th className="px-4 py-2 border">Remarks</th>
                <th className="px-4 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {formData.processes.map((process, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border text-center">{index + 1}</td>
                  <td className="px-4 py-2 border">
                    <select
                      value={process.machineType}
                      onChange={(e) => updateProcess(index, 'machineType', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select</option>
                      <option value="SNLS/DNLS">SNLS/DNLS</option>
                      <option value="Flat Lock">Flat Lock</option>
                      <option value="Over Lock">Over Lock</option>
                      <option value="Kansai">Kansai</option>
                    </select>
                  </td>
                  <td className="px-4 py-2 border">
                    <input
                      type="text"
                      value={process.processName}
                      onChange={(e) => updateProcess(index, 'processName', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-2 border">
                    <select
                      value={process.dop}
                      onChange={(e) => updateProcess(index, 'dop', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select</option>
                      <option value="Basic">Basic</option>
                      <option value="Semi Critical">Semi Critical</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </td>
                  <td className="px-4 py-2 border">
                    <input
                      type="number"
                      step="0.01"
                      value={process.smv}
                      onChange={(e) => updateProcess(index, 'smv', parseFloat(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  {process.cycleTimes.map((time, cycleIndex) => (
                    <td key={cycleIndex} className="px-4 py-2 border">
                      <input
                        type="number"
                        value={time}
                        onChange={(e) => updateProcess(index, `cycleTime-${cycleIndex}`, e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                  ))}
                  <td className="px-4 py-2 border">
                    <select
                      value={process.qualityStatus}
                      onChange={(e) => updateProcess(index, 'qualityStatus', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select</option>
                      <option value="No Defect">No Defect</option>
                      <option value="1 Operation Defect">1 Operation Defect</option>
                      <option value="2 Operation Defect">2 Operation Defect</option>
                      <option value="3 Operation Defect">3 Operation Defect</option>
                      <option value="4 Operation Defect">4 Operation Defect</option>
                      <option value="5 Operation Defect">5 Operation Defect</option>
                    </select>
                  </td>
                  <td className="px-4 py-2 border">
                    <input
                      type="text"
                      value={process.remarks}
                      onChange={(e) => updateProcess(index, 'remarks', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-2 border text-center">
                    <button
                      type="button"
                      onClick={() => removeProcess(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Calculate Results
        </button>
      </div>
    </form>
  )
}