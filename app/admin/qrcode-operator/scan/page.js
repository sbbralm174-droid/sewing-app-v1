"use client";
import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function Page() {
  const [scannedId, setScannedId] = useState("");
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!scannerRef.current) return;

    // QR Scanner তৈরি
    const scanner = new Html5QrcodeScanner("reader", {
      qrbox: { width: 250, height: 250 },
      fps: 10,
    });

    // সফলভাবে স্ক্যান হলে
    scanner.render(
      (decodedText) => {
        setScannedId(decodedText);
        scanner.clear(); // স্ক্যান বন্ধ করে দাও
      },
      (error) => {
        console.warn("Scan error:", error);
      }
    );

    // Cleanup
    return () => {
      scanner.clear().catch(() => {});
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-semibold mb-4">QR Code Scanner</h1>

      {/* QR Box */}
      <div id="reader" ref={scannerRef}></div>

      {/* Input */}
      <input
        type="text"
        value={scannedId}
        readOnly
        placeholder="Scanned ID will appear here"
        className="border border-gray-400 mt-4 p-2 rounded w-64 text-center"
      />

      {/* Optional: Show realtime text */}
      {scannedId && (
        <p className="mt-2 text-green-600 font-medium">
          ✅ ID পাওয়া গেছে: {scannedId}
        </p>
      )}
    </div>
  );
}
