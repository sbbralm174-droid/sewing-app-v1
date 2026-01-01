"use client";
import { useState } from "react";
import * as XLSX from "xlsx";

export default function ExcelUpload() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setLoading(true);
  const reader = new FileReader();

  reader.onload = async (evt) => {
    try {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      
      // ডাটা অবজেক্টে কনভার্ট করা
      const rawData = XLSX.utils.sheet_to_json(ws);
      console.log("Excel Raw Data:", rawData); // ব্রাউজার কনসোলে চেক করুন ডাটা আসছে কি না

      if (rawData.length === 0) {
        alert("Excel file is empty!");
        return;
      }

      // সঠিক ম্যাপিং (বড় হাতের বা ছোট হাতের অক্ষরের সমস্যা এড়াতে)
      const processedData = rawData.map((item) => {
        return {
          machineType: item["NAME OF MACHINE"]?.toString().trim(),
          brandName: item["BRAND"]?.toString().trim(),
          model: item["MODEL"]?.toString().trim(),
          uniqueId: item["TEXTILESL-NO"]?.toString().trim(),
          installationDate: item["INSTALLATION YEAR"]?.toString().trim(),
        };
      });

      console.log("Processed Data for API:", processedData);

      const res = await fetch("/api/machines/bulk-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: processedData }),
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error("Frontend Error:", err);
      alert("Error processing file!");
    } finally {
      setLoading(false);
    }
  };

  reader.readAsBinaryString(file);
};

  return (
    <div className="p-10 flex mt-10 flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Bulk Machine Upload</h2>
      
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleUpload}
        disabled={loading}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />

      {loading && <p className="mt-4 text-orange-500 font-medium">Processing... Please wait.</p>}

      {result && (
        <div className="mt-6 p-4 bg-green-50 rounded-md border border-green-200">
          <p className="text-green-700 font-bold">Upload Successful!</p>
          <p>Saved: {result.successCount}</p>
          <p>Skipped (Duplicate): {result.skipCount}</p>
        </div>
      )}
    </div>
  );
}