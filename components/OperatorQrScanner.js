'use client';
import { Html5Qrcode } from 'html5-qrcode';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OperatorQrScanner() {
  const [scanning, setScanning] = useState(false);
  const router = useRouter();

  async function startScan() {
    if (scanning) return;
    setScanning(true);

    const html5QrCode = new Html5Qrcode('qr-reader');
    const cameras = await Html5Qrcode.getCameras();
    const cameraId = cameras[0].id;

    await html5QrCode.start(
      cameraId,
      { fps: 10, qrbox: 250 },
      decodedText => {
        html5QrCode.stop();
        setScanning(false);
        router.push(`/operators/${decodedText}`);
      },
      error => console.log('Scan error:', error)
    );
  }

  return (
    <div className="p-4 flex flex-col items-center">
      <div id="qr-reader" style={{ width: 300, height: 300 }} className="border" />
      <button
        onClick={startScan}
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
      >
        Start Scan
      </button>
    </div>
  );
}
