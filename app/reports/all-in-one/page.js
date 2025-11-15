'use client';

import { useState, useEffect, useRef } from 'react';

export default function ProductionReport() {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [columnFilters, setColumnFilters] = useState({
    date: '',
    operator: '',
    supervisor: '',
    line: '',
    process: '',
    buyer: '',
    style: '',
    machine: '',
    target: '',
    work: '',
    hourly: '',
    total: '',
    defects: ''
  });
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const tableContainerRef = useRef(null);

  const fetchReports = async (startDate, endDate) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/daily-production/date-range-get-all?startDate=${startDate}&endDate=${endDate}`
      );
      const result = await response.json();

      if (result.success) {
        setReports(result.data);
        setFilteredReports(result.data);
      } else {
        alert('Failed to fetch reports: ' + result.error);
      }
    } catch (error) {
      alert('Error fetching reports: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(filters.startDate, filters.endDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter reports based on column filters
  useEffect(() => {
    let filtered = reports;

    Object.keys(columnFilters).forEach(column => {
      if (columnFilters[column].trim()) {
        const searchTerm = columnFilters[column].toLowerCase();
        
        filtered = filtered.filter(report => {
          switch(column) {
            case 'date':
              return formatDate(report.date).toLowerCase().includes(searchTerm);
            
            case 'operator':
              return (
                (report.operator?.name || '').toLowerCase().includes(searchTerm) ||
                (report.operator?.operatorId || '').toLowerCase().includes(searchTerm)
              );
            
            case 'supervisor':
              return (report.supervisor || '').toLowerCase().includes(searchTerm);
            
            case 'line':
              return (report.line || '').toLowerCase().includes(searchTerm);
            
            case 'process':
              return (report.process || '').toLowerCase().includes(searchTerm);
            
            case 'buyer':
              return (report.buyer?.name || '').toLowerCase().includes(searchTerm);
            
            case 'style':
              return (report.style?.styleName || '').toLowerCase().includes(searchTerm);
            
            case 'machine':
              return (report.uniqueMachine || '').toLowerCase().includes(searchTerm);
            
            case 'target':
              return (report.target?.toString() || '').includes(searchTerm);
            
            case 'work':
              return (report.workAs || '').toLowerCase().includes(searchTerm);
            
            case 'hourly':
              return report.hourlyProduction?.some(h => 
                h.hour.includes(searchTerm) || h.productionCount.toString().includes(searchTerm)
              ) || false;
            
            case 'total':
              return (report.totalProduction?.toString() || '').includes(searchTerm);
            
            case 'defects':
              return (report.totalDefects?.toString() || '').includes(searchTerm);
            
            default:
              return true;
          }
        });
      }
    });

    setFilteredReports(filtered);
  }, [columnFilters, reports]);

  // Updated mouse event handlers that don't interfere with inputs
  const handleMouseDown = (e) => {
    // Only start dragging if not clicking on an input element
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') {
      return;
    }
    
    setIsDragging(true);
    setStartX(e.pageX - tableContainerRef.current.offsetLeft);
    setScrollLeft(tableContainerRef.current.scrollLeft);
    e.preventDefault();
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - tableContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    tableContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  // Updated touch event handlers
  const handleTouchStart = (e) => {
    // Only start dragging if not touching an input element
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') {
      return;
    }
    
    setIsDragging(true);
    setStartX(e.touches[0].pageX - tableContainerRef.current.offsetLeft);
    setScrollLeft(tableContainerRef.current.scrollLeft);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const x = e.touches[0].pageX - tableContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    tableContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleColumnFilterChange = (column, value) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const clearColumnFilter = (column) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: ''
    }));
  };

  const clearAllFilters = () => {
    setColumnFilters({
      date: '',
      operator: '',
      supervisor: '',
      line: '',
      process: '',
      buyer: '',
      style: '',
      machine: '',
      target: '',
      work: '',
      hourly: '',
      total: '',
      defects: ''
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchReports(filters.startDate, filters.endDate);
    clearAllFilters();
  };

  const handleReset = () => {
    const today = new Date().toISOString().split('T')[0];
    setFilters({
      startDate: today,
      endDate: today,
    });
    clearAllFilters();
    fetchReports(today, today);
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-BD');
    } catch {
      return dateString;
    }
  };

  const totalProductionSum = filteredReports.reduce((sum, r) => sum + (r.totalProduction || 0), 0);
  const totalTargetSum = filteredReports.reduce((sum, r) => sum + (r.target || 0), 0);
  const totalDefectsSum = filteredReports.reduce((sum, r) => sum + (r.totalDefects || 0), 0);
  const efficiency = totalTargetSum > 0 ? ((totalProductionSum / totalTargetSum) * 100).toFixed(1) : '0.0';

  const isAnyFilterActive = Object.values(columnFilters).some(filter => filter.trim() !== '');

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading reports...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 py-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Production Report</h1>

      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow p-4 mb-5">
        <form onSubmit={handleSearch}>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-blue-600 text-white py-1.5 px-4 rounded-md hover:bg-blue-700 text-sm"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="bg-gray-500 text-white py-1.5 px-4 rounded-md hover:bg-gray-600 text-sm"
            >
              Reset
            </button>
            {isAnyFilterActive && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="bg-orange-500 text-white py-1.5 px-4 rounded-md hover:bg-orange-600 text-sm"
              >
                Clear Filters
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-800">
        Showing <strong>{filteredReports.length}</strong> of <strong>{reports.length}</strong> records from <strong>{filters.startDate}</strong> to{' '}
        <strong>{filters.endDate}</strong>
        {isAnyFilterActive && (
          <span> • <strong>Column filters active</strong></span>
        )}
      </div>

      {/* Table Container with Fixed Draggable Scroll */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-2 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-700">Production Summary</h2>
          {filteredReports.length > 0 && (
            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              💡 Drag on empty areas to scroll
            </div>
          )}
        </div>

        {filteredReports.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            {reports.length === 0 
              ? "No production data found for the selected date range." 
              : "No records found matching your filter criteria."}
          </div>
        ) : (
          <div 
            ref={tableContainerRef}
            className={`overflow-x-auto ${isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ 
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin'
            }}
          >
            <table className="w-full text-[11px] md:text-sm leading-tight table-fixed min-w-max">
              <thead className="bg-gray-50 text-gray-600 uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  {/* Date Column with Search */}
                  <th className="px-1 py-1 text-left w-[90px] bg-gray-50">
                    <div className="font-semibold text-[10px] mb-1">DATE</div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search..."
                        value={columnFilters.date}
                        onChange={(e) => handleColumnFilterChange('date', e.target.value)}
                        className="w-full px-1 py-0.5 border border-gray-300 rounded text-[10px] focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                      {columnFilters.date && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearColumnFilter('date');
                          }}
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-[8px]"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </th>

                  {/* Operator Column with Search */}
                  <th className="px-1 py-1 text-left w-[140px] bg-gray-50">
                    <div className="font-semibold text-[10px] mb-1">OPERATOR</div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search..."
                        value={columnFilters.operator}
                        onChange={(e) => handleColumnFilterChange('operator', e.target.value)}
                        className="w-full px-1 py-0.5 border border-gray-300 rounded text-[10px] focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                      {columnFilters.operator && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearColumnFilter('operator');
                          }}
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-[8px]"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </th>

                  {/* Supervisor Column with Search */}
                  <th className="px-1 py-1 text-left w-[100px] hidden sm:table-cell bg-gray-50">
                    <div className="font-semibold text-[10px] mb-1">SUPERVISOR</div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search..."
                        value={columnFilters.supervisor}
                        onChange={(e) => handleColumnFilterChange('supervisor', e.target.value)}
                        className="w-full px-1 py-0.5 border border-gray-300 rounded text-[10px] focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                      {columnFilters.supervisor && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearColumnFilter('supervisor');
                          }}
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-[8px]"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </th>

                  {/* Line Column with Search */}
                  <th className="px-1 py-1 text-left w-[70px] bg-gray-50">
                    <div className="font-semibold text-[10px] mb-1">LINE</div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search..."
                        value={columnFilters.line}
                        onChange={(e) => handleColumnFilterChange('line', e.target.value)}
                        className="w-full px-1 py-0.5 border border-gray-300 rounded text-[10px] focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                      {columnFilters.line && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearColumnFilter('line');
                          }}
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-[8px]"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </th>

                  {/* Process Column with Search */}
                  <th className="px-1 py-1 text-left w-[120px] hidden md:table-cell bg-gray-50">
                    <div className="font-semibold text-[10px] mb-1">PROCESS</div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search..."
                        value={columnFilters.process}
                        onChange={(e) => handleColumnFilterChange('process', e.target.value)}
                        className="w-full px-1 py-0.5 border border-gray-300 rounded text-[10px] focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                      {columnFilters.process && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearColumnFilter('process');
                          }}
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-[8px]"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </th>

                  {/* Buyer Column with Search */}
                  <th className="px-1 py-1 text-left w-[140px] hidden md:table-cell bg-gray-50">
                    <div className="font-semibold text-[10px] mb-1">BUYER</div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search..."
                        value={columnFilters.buyer}
                        onChange={(e) => handleColumnFilterChange('buyer', e.target.value)}
                        className="w-full px-1 py-0.5 border border-gray-300 rounded text-[10px] focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                      {columnFilters.buyer && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearColumnFilter('buyer');
                          }}
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-[8px]"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </th>

                  {/* Style Column with Search */}
                  <th className="px-1 py-1 text-left w-[130px] hidden lg:table-cell bg-gray-50">
                    <div className="font-semibold text-[10px] mb-1">STYLE</div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search..."
                        value={columnFilters.style}
                        onChange={(e) => handleColumnFilterChange('style', e.target.value)}
                        className="w-full px-1 py-0.5 border border-gray-300 rounded text-[10px] focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                      {columnFilters.style && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearColumnFilter('style');
                          }}
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-[8px]"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </th>

                  {/* Machine Column with Search */}
                  <th className="px-1 py-1 text-left w-[110px] hidden lg:table-cell bg-gray-50">
                    <div className="font-semibold text-[10px] mb-1">MACHINE</div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search..."
                        value={columnFilters.machine}
                        onChange={(e) => handleColumnFilterChange('machine', e.target.value)}
                        className="w-full px-1 py-0.5 border border-gray-300 rounded text-[10px] focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                      {columnFilters.machine && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearColumnFilter('machine');
                          }}
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-[8px]"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </th>

                  {/* Target Column with Search */}
                  <th className="px-1 py-1 text-left w-[80px] bg-gray-50">
                    <div className="font-semibold text-[10px] mb-1">TARGET</div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search..."
                        value={columnFilters.target}
                        onChange={(e) => handleColumnFilterChange('target', e.target.value)}
                        className="w-full px-1 py-0.5 border border-gray-300 rounded text-[10px] focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                      {columnFilters.target && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearColumnFilter('target');
                          }}
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-[8px]"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </th>

                  {/* Work Column with Search */}
                  <th className="px-1 py-1 text-left w-[90px] hidden sm:table-cell bg-gray-50">
                    <div className="font-semibold text-[10px] mb-1">WORK</div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search..."
                        value={columnFilters.work}
                        onChange={(e) => handleColumnFilterChange('work', e.target.value)}
                        className="w-full px-1 py-0.5 border border-gray-300 rounded text-[10px] focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                      {columnFilters.work && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearColumnFilter('work');
                          }}
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-[8px]"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </th>

                  {/* Hourly Column with Search */}
                  <th className="px-1 py-1 text-left w-[160px] hidden xl:table-cell bg-gray-50">
                    <div className="font-semibold text-[10px] mb-1">HOURLY</div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search..."
                        value={columnFilters.hourly}
                        onChange={(e) => handleColumnFilterChange('hourly', e.target.value)}
                        className="w-full px-1 py-0.5 border border-gray-300 rounded text-[10px] focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                      {columnFilters.hourly && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearColumnFilter('hourly');
                          }}
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-[8px]"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </th>

                  {/* Total Column with Search */}
                  <th className="px-1 py-1 text-left w-[80px] bg-gray-50">
                    <div className="font-semibold text-[10px] mb-1">TOTAL</div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search..."
                        value={columnFilters.total}
                        onChange={(e) => handleColumnFilterChange('total', e.target.value)}
                        className="w-full px-1 py-0.5 border border-gray-300 rounded text-[10px] focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                      {columnFilters.total && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearColumnFilter('total');
                          }}
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-[8px]"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </th>

                  {/* Defects Column with Search */}
                  <th className="px-1 py-1 text-left w-[70px] bg-gray-50">
                    <div className="font-semibold text-[10px] mb-1">DEFECTS</div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search..."
                        value={columnFilters.defects}
                        onChange={(e) => handleColumnFilterChange('defects', e.target.value)}
                        className="w-full px-1 py-0.5 border border-gray-300 rounded text-[10px] focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                      {columnFilters.defects && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearColumnFilter('defects');
                          }}
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-[8px]"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {filteredReports.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 align-top">
                    <td className="px-2 py-2 whitespace-normal break-words">{formatDate(r.date)}</td>
                    <td className="px-2 py-2 whitespace-normal break-words">
                      <div className="font-medium">{r.operator?.name || 'N/A'}</div>
                      {r.operator?.operatorId && (
                        <div className="text-[11px] text-gray-500">{r.operator.operatorId}</div>
                      )}
                    </td>
                    <td className="px-2 py-2 whitespace-normal break-words hidden sm:table-cell">{r.supervisor || 'N/A'}</td>
                    <td className="px-2 py-2 whitespace-normal break-words">{r.line || 'N/A'}</td>
                    <td className="px-2 py-2 whitespace-normal break-words hidden md:table-cell">{r.process || 'N/A'}</td>
                    <td className="px-2 py-2 whitespace-normal break-words hidden md:table-cell">{r.buyer?.name || 'N/A'}</td>
                    <td className="px-2 py-2 whitespace-normal break-words hidden lg:table-cell">
                      {r.style?.styleName || 'N/A'}
                    </td>
                    <td className="px-2 py-2 whitespace-normal break-words hidden lg:table-cell">
                      {r.uniqueMachine || 'N/A'}
                    </td>
                    <td className="px-2 py-2 whitespace-normal break-words">{r.target ?? '-'}</td>
                    <td className="px-2 py-2 whitespace-normal break-words hidden sm:table-cell">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          r.workAs === 'operator' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {r.workAs || '-'}
                      </span>
                    </td>
                    <td className="px-2 py-2 whitespace-normal break-words hidden xl:table-cell">
                      {r.hourlyProduction?.length > 0
                        ? r.hourlyProduction.map((h) => `${h.hour}:${h.productionCount}`).join(', ')
                        : '-'}
                    </td>
                    <td className="px-2 py-2 whitespace-normal break-words font-semibold text-green-700">
                      {r.totalProduction ?? 0}
                    </td>
                    <td className={`px-2 py-2 whitespace-normal break-words font-semibold ${r.totalDefects > 0 ? 'text-red-700' : 'text-gray-600'}`}>
                      {r.totalDefects ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer Summary */}
      {filteredReports.length > 0 && (
        <div className="mt-4 bg-gray-50 rounded-lg p-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-xs md:text-sm">
          <div>
            <p className="text-gray-600">Records</p>
            <p className="font-bold text-gray-800">{filteredReports.length}/{reports.length}</p>
          </div>
          <div>
            <p className="text-gray-600">Total Prod.</p>
            <p className="font-bold text-green-700">{totalProductionSum}</p>
          </div>
          <div>
            <p className="text-gray-600">Total Defects</p>
            <p className="font-bold text-red-700">{totalDefectsSum}</p>
          </div>
          <div>
            <p className="text-gray-600">Efficiency</p>
            <p className="font-bold text-blue-700">{efficiency}%</p>
          </div>
        </div>
      )}
    </div>
  );
}