// components/NidOrBirthCertificate.js - আপডেটেড ভার্সন
'use client'
import { useState, useEffect } from 'react';

export default function NidOrBirthCertificateSearch({ 
  nidOrBirthCertificateValue, 
  autoSearch = false 
}) {
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // স্ক্যানিং ডেটা পার্স করার ফাংশন
  const parseScannedData = (data) => {
    try {
      // Method 1: XML-like format parse
      if (data.includes('<pin>') && data.includes('<name>')) {
        const pinMatch = data.match(/<pin>([^<]+)<\/pin>/);
        const nameMatch = data.match(/<name>([^<]+)<\/name>/);
        const dobMatch = data.match(/<DOB>([^<]+)<\/DOB>/);
        
        if (pinMatch && nameMatch) {
          return {
            nid: pinMatch[1],
            name: nameMatch[1],
            dateOfBirth: dobMatch ? dobMatch[1] : null,
            source: 'scanner_xml'
          };
        }
      }
      
      // Method 2: Second format parse
      // Format: <]?NM[NAME]NW[NID]...
      if (data.includes('NW') && data.includes('NM')) {
        const parts = data.split(/NM|NW|OL/);
        if (parts.length >= 3) {
          const name = parts[1]?.trim();
          const nid = parts[2]?.substring(0, 17); // NID usually 13-17 digits
          
          if (name && nid) {
            return {
              nid: nid.replace(/[^0-9]/g, ''), // শুধু সংখ্যা রাখো
              name: name.trim(),
              source: 'scanner_compact'
            };
          }
        }
      }
      
      // Method 3: Try to extract NID (13-17 digits)
      const nidMatch = data.match(/\b(\d{13,17})\b/);
      if (nidMatch) {
        // Try to find name (assuming it's before or after NID)
        const beforeNid = data.substring(0, data.indexOf(nidMatch[1])).trim();
        const afterNid = data.substring(data.indexOf(nidMatch[1]) + nidMatch[1].length).trim();
        
        let name = '';
        if (beforeNid.length > 3 && beforeNid.length < 50) {
          name = beforeNid.replace(/[^a-zA-Z\s]/g, '').trim();
        } else if (afterNid.length > 3 && afterNid.length < 50) {
          name = afterNid.replace(/[^a-zA-Z\s]/g, '').trim();
        }
        
        return {
          nid: nidMatch[1],
          name: name || 'Unknown',
          source: 'auto_extract'
        };
      }
      
      return null;
    } catch (err) {
      console.error('Parse error:', err);
      return null;
    }
  };

  const searchData = async () => {
    if (!nidOrBirthCertificateValue) return;
    
    setLoading(true);
    setError('');
    
    try {
      // প্রথমে স্ক্যানিং ডেটা পার্স করার চেষ্টা করুন
      const parsedData = parseScannedData(nidOrBirthCertificateValue);
      
      if (parsedData) {
        // স্ক্যানিং ডেটা থেকে পাওয়া গেছে
        setSearchResult({
          success: true,
          data: parsedData,
          message: 'Data extracted from scanned information'
        });
      } else {
        // স্ক্যানিং ডেটা না পেলে ডেটাবেস থেকে খুঁজুন
        const response = await fetch(`/api/search-operator?query=${encodeURIComponent(nidOrBirthCertificateValue)}`);
        const result = await response.json();
        
        if (response.ok && result.success) {
          setSearchResult(result);
        } else {
          setError(result.error || 'No data found');
          setSearchResult(null);
        }
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to process data');
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoSearch && nidOrBirthCertificateValue) {
      searchData();
    }
  }, [nidOrBirthCertificateValue, autoSearch]);

  const handleClose = () => {
    setSearchResult(null);
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">Operator Search Results</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Processing scanned data...</p>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-red-400">⚠️</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {searchResult && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-green-400">✅</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Data Found!</h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>{searchResult.message}</p>
                      <p className="text-xs mt-1">
                        Source: {searchResult.data.source}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-3">Operator Details:</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500">Full Name:</div>
                    <div className="col-span-2 text-gray-900 font-semibold">
                      {searchResult.data.name}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-500">NID Number:</div>
                    <div className="col-span-2 text-gray-900 font-mono">
                      {searchResult.data.nid}
                    </div>
                  </div>
                  
                  {searchResult.data.dateOfBirth && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-sm font-medium text-gray-500">Date of Birth:</div>
                      <div className="col-span-2 text-gray-900">
                        {searchResult.data.dateOfBirth}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <button
                  onClick={() => {
                    // ফর্মে ডেটা অটো-ফিল করার ফাংশকল
                    if (window.fillFormWithScannedData) {
                      window.fillFormWithScannedData(searchResult.data);
                    }
                    handleClose();
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md font-medium transition-colors"
                >
                  Use This Data in Form
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}