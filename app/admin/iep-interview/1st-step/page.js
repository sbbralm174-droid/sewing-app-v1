'use client'
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Webcam from 'react-webcam';
import { Html5QrcodeScanner } from 'html5-qrcode';
import NidOrBirthCertificateSearch from '@/components/NidOrBirthCertificate';



export default function VivaInterviewStep1() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    nid: '',
    birthCertificate: '',
    picture: '',
    failureReason: ''
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [showWebcam, setShowWebcam] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [showFailureReason, setShowFailureReason] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [searchKey, setSearchKey] = useState(0);
  const [showScanner, setShowScanner] = useState(false);
  const [scanningText, setScanningText] = useState('');
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [nidExists, setNidExists] = useState(false);
  const [nidExistsMessage, setNidExistsMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
const [editForm, setEditForm] = useState({
  name: '',
  nid: '',
});
  const [todayCount, setTodayCount] = useState(0);
const [candidates, setCandidates] = useState([]);
const [showAll, setShowAll] = useState(false);


  
  const photoFileRef = useRef(null);
  const webcamRef = useRef(null);
  const scannerRef = useRef(null);
  const textAreaRef = useRef(null);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (successMessage) setSuccessMessage('');
    if (errorMessage) setErrorMessage('');
    if (nidExistsMessage) setNidExistsMessage('');
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleEdit = (c) => {
  setEditingId(c.candidateId);
  setEditForm({
    name: c.name || '',
    nid: c.nid || c.birthCertificate || '',
  });
};

const handleUpdate = async (candidateId) => {
  try {
    const res = await fetch('/api/iep-interview/step-one/report', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidateId,
        name: editForm.name,
        nid: editForm.nid,
      }),
    });

    const data = await res.json();

    if (data.success) {
      // UI update instantly
      setCandidates((prev) =>
        prev.map((c) =>
          c.candidateId === candidateId
            ? { ...c, name: editForm.name, nid: editForm.nid }
            : c
        )
      );

      setEditingId(null);
    }

  } catch (err) {
    console.error(err);
  }
};



const fetchTodayCandidates = async () => {
  try {
    const res = await fetch('/api/iep-interview/step-one/report');
    const data = await res.json();

    if (data.success) {
      setTodayCount(data.totalCandidates);
      setCandidates(data.data);
    }
  } catch (err) {
    console.error(err);
  }
};



useEffect(() => {
  fetchTodayCandidates();

  // ⏱️ auto refresh every 3 sec (real-time feel)
  const interval = setInterval(fetchTodayCandidates, 3000);

  return () => clearInterval(interval);
}, []);

  // NID চেঞ্জ হলে চেক করুন
  useEffect(() => {
    const checkNidExists = async () => {
      if (formData.nid && formData.nid.trim().length >= 10) {
        try {
          // Debounce for 500ms
          const timer = setTimeout(async () => {
            const response = await fetch(`/api/iep-interview/check-nid?nid=${formData.nid.trim()}`);
            if (response.ok) {
              const data = await response.json();
              if (data.exists) {
                setNidExists(true);
                setNidExistsMessage(`⚠️ This NID (${formData.nid}) already exists in database. Candidate: ${data.name}`);
                
              } else {
                setNidExists(false);
                setNidExistsMessage('No data found in Database');
              }
            }
          }, 500);
          
          return () => clearTimeout(timer);
        } catch (error) {
          console.error('Error checking NID:', error);
        }
      } else {
        setNidExists(false);
        setNidExistsMessage('');
      }
    };
    
    checkNidExists();
  }, [formData.nid]);



  //failor reason

  const failureReasons = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F"
];

  // Extract from XML style
  function extractFromXML(input) {
    const nidMatch = input.match(/<pin>(.*?)<\/pin>/);
    const nameMatch = input.match(/<name>(.*?)<\/name>/);

    return {
      nid: nidMatch ? nidMatch[1].trim() : "",
      name: nameMatch ? nameMatch[1].trim() : ""
    };
  }

  // Extract from Barcode style
  function extractFromBarcode(input) {
    let name = "";
    let nid = "";

    // Name extraction: between NM and NW
    const nameRegex = /NM(.*?)NW/;
    const nameMatch = input.match(nameRegex);
    if (nameMatch) {
      name = nameMatch[1].trim();
    }

    // Clean unwanted suffix/prefix
    name = name.replace(/[^A-Za-z\s]/g, "");

    // NID extraction: between NW and OL
    const nidRegex = /NW(\d+)OL/;
    const nidMatch = input.match(nidRegex);
    if (nidMatch) {
      nid = nidMatch[1].trim();
    }

    return { name, nid };
  }

  // Master extractor
  function parseScannedData(text) {
    if (text.includes("<pin>") || text.includes("<name>")) {
      return extractFromXML(text);
    } else if (text.includes("NM") && text.includes("NW")) {
      return extractFromBarcode(text);
    } else if (text.includes("NID:") || text.includes("ID:")) {
      // For other formats like "NID: 123456789 Name: John Doe"
      const nidMatch = text.match(/NID:\s*(\d+)|ID:\s*(\d+)/);
      const nameMatch = text.match(/Name:\s*([A-Za-z\s]+)/);
      
      return {
        nid: nidMatch ? (nidMatch[1] || nidMatch[2] || "").trim() : "",
        name: nameMatch ? nameMatch[1].trim() : ""
      };
    }
    return { name: "", nid: "" };
  }

  // Get available cameras
  const getAvailableCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(videoDevices);
      
      // Default to rear camera if available, otherwise first available camera
      if (videoDevices.length > 0) {
        // Try to find rear camera
        const rearCamera = videoDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        );
        
        if (rearCamera) {
          setSelectedCamera(rearCamera.deviceId);
        } else {
          // Use first available camera
          setSelectedCamera(videoDevices[0].deviceId);
        }
      }
    } catch (error) {
      console.error('Error getting cameras:', error);
    }
  };

  // Initialize QR/Barcode Scanner
  const startScanner = () => {
    setShowScanner(true);
    setScanningText('Initializing scanner...');
    
    // Give a moment for the DOM to update
    setTimeout(() => {
      try {
        if (scannerRef.current) {
          scannerRef.current.clear();
        }
        
        // Get camera constraints
        let cameraConstraints = {};
        if (selectedCamera) {
          cameraConstraints.deviceId = { exact: selectedCamera };
        } else {
          // Default to environment-facing camera (rear camera)
          cameraConstraints.facingMode = { ideal: "environment" };
        }
        
        const scanner = new Html5QrcodeScanner(
          "qr-reader", 
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: false,
            aspectRatio: 1.7777778,
            videoConstraints: cameraConstraints
          },
          false
        );
        
        scannerRef.current = scanner;
        
        scanner.render(
          (decodedText) => {
            // Success callback
            setScanningText(`Scanned: ${decodedText.substring(0, 50)}...`);
            
            // Parse the scanned data
            const result = parseScannedData(decodedText);
            
            // Update form data
            if (result.name) {
              setFormData(prev => ({ ...prev, name: result.name }));
            }
            if (result.nid) {
              setFormData(prev => ({ ...prev, nid: result.nid }));
            }
            
            // Also update textarea
            if (textAreaRef.current) {
              textAreaRef.current.value = decodedText;
            }
            
            // Show success message
            setSuccessMessage(`✅ Successfully scanned! Name: ${result.name || 'Not found'}, NID: ${result.nid || 'Not found'}`);
            
            // Stop scanner after successful scan
            stopScanner();
            
            // Auto-hide scanner after 2 seconds
            setTimeout(() => setShowScanner(false), 2000);
          },
          (error) => {
            // Error callback
            console.error('Scan error:', error);
            setScanningText('Scanning... Point camera at QR/Barcode');
          }
        );
        
      } catch (error) {
        console.error('Scanner initialization error:', error);
        setErrorMessage('Failed to initialize scanner. Please check camera permissions or try another camera.');
        
        // Try alternative camera approach
        tryAlternativeCamera();
      }
    }, 100);
  };

  // Try alternative camera approach
  const tryAlternativeCamera = () => {
    if (!selectedCamera && availableCameras.length > 0) {
      // Try with first available camera
      const firstCameraId = availableCameras[0].deviceId;
      setSelectedCamera(firstCameraId);
      
      // Retry scanner after a short delay
      setTimeout(() => {
        if (showScanner) {
          stopScanner();
          setTimeout(startScanner, 500);
        }
      }, 500);
    }
  };

  // Stop scanner
  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
    }
  };

  // Clean up scanner on component unmount
  useEffect(() => {
    // Get available cameras on mount
    getAvailableCameras();
    
    return () => {
      stopScanner();
    };
  }, []);

  // Handle manual text area paste
  const handleTextAreaPaste = (e) => {
    const pastedText = e.clipboardData.getData('text');
    setTimeout(() => {
      if (textAreaRef.current) {
        const text = textAreaRef.current.value;
        const result = parseScannedData(text);
        
        if (result.name || result.nid) {
          setFormData(prev => ({
            ...prev,
            name: result.name || prev.name,
            nid: result.nid || prev.nid
          }));
          
          setSuccessMessage(`✅ Data extracted from pasted text! Name: ${result.name || 'Not found'}, NID: ${result.nid || 'Not found'}`);
        }
      }
    }, 100);
  };

  // Search button click handler
  const handleSearch = () => {
    const nidValue = formData.nid.trim();
    const birthCertValue = formData.birthCertificate.trim();
    
    if (!nidValue && !birthCertValue) {
      alert('Please enter either NID or Birth Certificate number');
      return;
    }
    
    const searchValueToUse = nidValue || birthCertValue;
    setSearchValue(searchValueToUse);
    setSearchKey(prev => prev + 1);
    setShowSearch(true);
  };

  // Close search popup
  const handleCloseSearch = () => {
    setShowSearch(false);
  };

  const validateForm = (result) => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Candidate name is required';
    }
    
    if (!formData.nid && !formData.birthCertificate) {
      errors.idValidation = 'Either NID or Birth Certificate must be provided';
    }
    
    if (result === 'FAILED' && !formData.failureReason.trim()) {
      errors.failureReason = 'Failure reason is required when candidate fails';
    }
    
    // Check if NID already exists (only for new submissions)
    if (formData.nid && nidExists) {
      errors.nid = 'This NID already exists in the database';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const capturePhoto = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
      setFormData(prev => ({ ...prev, picture: imageSrc }));
      setShowWebcam(false);
      setSuccessMessage('✅ Photo captured successfully!');
    }
  };

  const startCamera = () => {
    setShowWebcam(true);
    setCapturedImage(null);
    setFormData(prev => ({ ...prev, picture: '' }));
    photoFileRef.current = null;
    stopScanner();
  };

  const stopCamera = () => {
    setShowWebcam(false);
  };

  const discardCapturedPhoto = () => {
    setCapturedImage(null);
    setFormData(prev => ({ ...prev, picture: '' }));
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('❌ Please select a valid image file (JPEG, PNG, JPG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('❌ Image size should be less than 5MB');
      return;
    }

    photoFileRef.current = file;
    const localUrl = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, picture: localUrl }));
    setCapturedImage(null);
    setShowWebcam(false);
    setSuccessMessage('✅ Photo selected successfully!');
  };

  const removePhoto = () => {
    setFormData(prev => ({ ...prev, picture: '' }));
    photoFileRef.current = null;
    setCapturedImage(null);
  };

  const uploadPhoto = async () => {
    if (capturedImage) {
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
      photoFileRef.current = file;
    }

    if (!photoFileRef.current) return formData.picture;

    const formDataObj = new FormData();
    formDataObj.append('file', photoFileRef.current);
    formDataObj.append('type', 'photo');

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formDataObj,
    });

    if (!response.ok) {
      throw new Error('Failed to upload photo');
    }

    const result = await response.json();
    return result.url;
  };

  const handleSubmit = async (result) => {


    setErrorMessage('');
    setSuccessMessage('');

    // যদি FAILED হয় কিন্তু failure reason দেখানো না থাকে
    if (result === 'FAILED' && !showFailureReason) {
      setShowFailureReason(true);
      setSuccessMessage('⚠️ Please provide failure reason before submitting');
      return;
    }

    if (!validateForm(result)) return;

    try {
      setLoading(true);

      let pictureUrl = formData.picture;
      if (photoFileRef.current || capturedImage) {
        pictureUrl = await uploadPhoto();
      }

      const submissionData = {
        ...formData,
        picture: pictureUrl,
        nid: formData.nid || undefined,
        birthCertificate: formData.birthCertificate || undefined,
        result: result,
        failureReason: result === 'FAILED' ? formData.failureReason : undefined
      };

      const response = await fetch('/api/iep-interview/step-one', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      const responseData = await response.json();

      if (response.ok) {
        setSuccessMessage(`✅ Step 1 completed! Candidate ID: ${responseData.data.candidateId} - Result: ${result}`);
        setShowFailureReason(false);
        
        fetchTodayCandidates();
        // Form reset
        setFormData({
          name: '',
          nid: '',
          birthCertificate: '',
          picture: '',
          failureReason: ''
        });
        setCapturedImage(null);
        setNidExists(false);
        setNidExistsMessage('');
        if (photoFileRef.current) {
          photoFileRef.current = null;
        }

        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
          fileInput.value = '';
        }

        // Clear textarea
        if (textAreaRef.current) {
          textAreaRef.current.value = '';
        }
        
      } else {
        setErrorMessage(`❌ ${responseData.error || 'Failed to create candidate record'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('❌ ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelFailureReason = () => {
    setShowFailureReason(false);
    setFormData(prev => ({ ...prev, failureReason: '' }));
  };

  // Video constraints with deviceId support
  const videoConstraints = selectedCamera ? {
    width: 1280,
    height: 720,
    deviceId: { exact: selectedCamera }
  } : {
    width: 1280,
    height: 720,
    facingMode: { ideal: "environment" } // Default to rear camera
  };

  // Load CSS for scanner
  useEffect(() => {
    // Load HTML5 QR Code Scanner CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/html5-qrcode@2.3.8/minified/html5-qrcode.min.css';
    document.head.appendChild(link);
    
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <div className="min-h-screen mt-10 bg-gradient-to-br from-[#a162e8] via-[#8a43d6] to-[#6b21a8] text-[#E5E9F0] font-sans py-8">
   
 {/* 🚀 ULTRA SMOOTH INTERNAL CSS */}
<style jsx>{`

/* ===== CORNER COLOR LAYER + SWEEP ===== */

.btn-sweep{
  position:relative;
  overflow:hidden;
  border-radius:14px;
  font-weight:600;
  color:#ffffff;
  z-index:1;
  transition:transform .25s ease, box-shadow .25s ease;
}

.top-btn-sweep{
 position:relative;
  overflow:hidden;
  border-radius:14px;
  font-weight:600;
  color:#ffffff;
  z-index:1;
  transition:transform .25s ease, box-shadow .25s ease;

}



/* BASE gradient stays */
.btn-primary{
  background:linear-gradient(135deg,#a162e8,#6b21a8);
}
.btn-success{
  background:linear-gradient(135deg,#8494FF,#6367FF);
}
.btn-danger{
  background:linear-gradient(135deg,#FF8383,#FF3737);
}
.btn-blue{
  background:linear-gradient(135deg,#D946EF,#450693);
}

.top-btn-blue{
  background:linear-gradient(135deg,#D946EF,#450693);
}


.btn-primary-copy{
  background:linear-gradient(250deg,#D946EF,#450693);
}
/* ===== THIS IS THE SECRET LAYER (corner color) ===== */
.btn-sweep::before{
  content:"";
  position:absolute;
  inset:0;
  border-radius:inherit;
  background:linear-gradient(
    135deg,
    rgba(255,255,255,0.28) 0%,
    rgba(255,255,255,0.12) 25%,
    rgba(255,255,255,0.0) 40%
  );
  z-index:0;
}

.top-btn-sweep::before{
content:"";
  position:absolute;
  inset:0;
  border-radius:inherit;
  background:linear-gradient(
    135deg,
    rgba(255,255,255,0.28) 0%,
    rgba(255,255,255,0.12) 25%,
    rgba(255,255,255,0.0) 40%
  );
  z-index:0;
}


/* ===== MOVING COLOR SWEEP ===== */
.btn-sweep::after{
  content:"";
  position:absolute;
  top:-120%;
  left:-120%;
  width:240%;
  height:240%;
  border-radius:inherit;
  background:linear-gradient(
    135deg,
    rgba(255,255,255,0.35),
    rgba(255,255,255,0.05),
    rgba(255,255,255,0.35)
  );
  transform:rotate(18deg);
  transition:all .8s cubic-bezier(.22,.61,.36,1);
  z-index:0;
}


.top-btn-sweep::after{
 content:"";
  position:absolute;
  top:-80%;
  left:-80%;
  width:240%;
  height:240%;
  border-radius:inherit;
  background:linear-gradient(
    135deg,
    rgba(255,255,255,0.35),
    rgba(255,255,255,0.05),
    rgba(255,255,255,0.35)
  );
  transform:rotate(50deg);
  transition:all .8s cubic-bezier(.22,.61,.36,1);
  z-index:0;

}

.btn-sweep:hover::after{
  top:0%;
  left:0%;
}

.top-btn-sweep:hover::after{
  top:0%;
  left:0%;
}

.btn-sweep:hover{
  transform:translateY(-3px);
  box-shadow:0 5px 10px rgba(0,0,0,.35);
}
.top-btn-sweep:hover{
 transform:translateY(-3px);
  box-shadow:0 5px 10px rgba(0,0,0,.35);
}


.btn-sweep span{
  position:relative;
  z-index:2;
}

.top-btn-sweep{

 position:relative;
  z-index:2;
}


.clear-anim{
  position: relative;
  display: inline-block;
  font-weight: 600;
  color: #7c3aed;              /* purple tone */
  cursor: pointer;
  transition: color .25s ease, transform .25s ease;
}

/* underline sweep animation */
.clear-anim::after{
  content: "";
  position: absolute;
  left: 0;
  bottom: -3px;
  width: 0%;
  height: 2px;
  background: linear-gradient(90deg,#a855f7,#ec4899);
  transition: width .35s ease;
  border-radius: 4px;
}

.clear-anim:hover{
  color: #ec4899;              /* pink accent on hover */
  transform: translateY(-2px);
}

.clear-anim:hover::after{
  width: 100%;
}

/* ===== ROYAL BUTTON — SMOOTH LUXURY ANIMATION ===== */
.btn-royal{
  position: relative;
  overflow: hidden;
  border-radius: 14px;
  color: #fff;
  background: linear-gradient(135deg,#4338ca,#7c3aed);
  box-shadow: 0 8px 18px rgba(67,56,202,.35);
  transition: transform .28s ease, box-shadow .28s ease, filter .28s ease;
  isolation: isolate;
}

/* soft light layer */
.btn-royal::before{
  content:"";
  position:absolute;
  inset:0;
  border-radius:inherit;
  background: radial-gradient(circle at 30% 30%,
              rgba(255,255,255,.35),
              transparent 45%);
  opacity:.35;
  transition: opacity .35s ease, transform .6s ease;
}

/* liquid sweep highlight */
.btn-royal::after{
  content:"";
  position:absolute;
  top:0;
  left:-150%;
  width:120%;
  height:100%;
  border-radius:inherit;
  background: linear-gradient(
    120deg,
    transparent 0%,
    rgba(255,255,255,.55) 45%,
    transparent 80%
  );
  transform: skewX(-20deg);
  transition: left .9s cubic-bezier(.22,.61,.36,1);
}

/* HOVER EFFECT */
.btn-royal:hover{
  transform: translateY(-3px);
  box-shadow: 0 14px 32px rgba(67,56,202,.45);
  filter: brightness(1.05);
}

.btn-royal:hover::after{
  left:130%;
}

.btn-royal:hover::before{
  opacity:.55;
  transform: scale(1.08);
}

/* CLICK PRESS FEEL */
.btn-royal:active{
  transform: translateY(1px) scale(.98);
  box-shadow: 0 6px 14px rgba(67,56,202,.35);
}

`}</style>
   
   
   
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-indigo-900">Employee Assessment 1st Step (Security)</h1>
          <p className="text-gray-600 mt-2">Provide candidate&apos;s basic details and photo</p>
        </div>

        {/* CAMERA SCANNER SECTION */}
        <div className="mb-6">
          
          
          {/* Camera Selection Dropdown */}
          {availableCameras.length > 0 && showScanner && (
            <div className="mb-3">
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Select Camera:
              </label>
              <select
                value={selectedCamera}
                onChange={(e) => {
                  setSelectedCamera(e.target.value);
                  // Restart scanner with new camera
                  setTimeout(() => {
                    stopScanner();
                    setTimeout(startScanner, 500);
                  }, 100);
                }}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                {availableCameras.map((camera, index) => (
                  <option key={camera.deviceId} value={camera.deviceId}>
                    {camera.label || `Camera ${index + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="max-w-2xl mx-auto mb-6">
  <div className="bg-indigo-600 text-white p-4 rounded-lg shadow flex justify-between items-center">
    
    <div>
      <h2 className="text-lg font-semibold">Today Candidates</h2>
      <p className="text-3xl font-bold">{todayCount}</p>
    </div>

    <button
      onClick={() => setShowAll(true)}
      className="bg-white text-indigo-600 px-4 py-2 rounded-md font-medium hover:bg-gray-100"
    >
      View All
    </button>
    
  </div>
</div>

{showAll && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
    
    <div className="bg-white w-full max-w-2xl p-6 rounded-xl shadow-2xl max-h-[80vh] overflow-y-auto border border-gray-200">

      {/* Header */}
      <div className="flex justify-between items-center mb-5 border-b pb-3">
        <h2 className="text-xl font-bold text-gray-800">
          All Candidates (Today)
        </h2>

        <button
          onClick={() => setShowAll(false)}
          className="text-red-500 hover:text-red-700 text-xl font-bold"
        >
          ✕
        </button>
      </div>

      {/* Table */}
      <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-blue-50 text-gray-700">
            <th className="p-3 border border-gray-200 text-left">Name</th>
            <th className="p-3 border border-gray-200 text-left">ID</th>
            <th className="p-3 border border-gray-200 text-left">Candidate ID</th>
            <th className="p-3 border border-gray-200 text-left">Action</th>
          </tr>
        </thead>

        <tbody>
          {candidates.map((c, i) => (
            <tr key={i} className="hover:bg-gray-50 transition">

              {/* NAME */}
              <td className="p-3 border border-gray-200 text-gray-800">
                {editingId === c.candidateId ? (
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="border px-2 py-1 rounded w-full"
                  />
                ) : (
                  c.name
                )}
              </td>

              {/* NID */}
              <td className="p-3 border border-gray-200 text-gray-700">
                {editingId === c.candidateId ? (
                  <input
                    type="text"
                    value={editForm.nid}
                    onChange={(e) =>
                      setEditForm({ ...editForm, nid: e.target.value })
                    }
                    className="border px-2 py-1 rounded w-full"
                  />
                ) : (
                  c.nid || c.birthCertificate
                )}
              </td>

              {/* Candidate ID */}
              <td className="p-3 border border-gray-200 text-blue-600 font-medium">
                {c.candidateId}
              </td>

              {/* ACTION */}
              <td className="p-3 border border-gray-200">
                {editingId === c.candidateId ? (
                  <button
                    onClick={() => handleUpdate(c.candidateId)}
                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                  >
                    Save
                  </button>
                ) : (
                  <button
                    onClick={() => handleEdit(c)}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    Edit
                  </button>
                )}
              </td>

            </tr>
          ))}
        </tbody>
      </table>

    </div>
  </div>
)}
          
          {showScanner && (
            <div className="border-2 border-dashed border-purple-400 rounded-lg p-4 bg-purple-50 mb-4">
              <div className="text-center mb-3">
                <p className="text-purple-700 font-medium mb-1">Scan QR/Barcode</p>
                <p className="text-sm text-purple-600">{scanningText || 'Position the barcode/QR code within the frame'}</p>
              </div>
              
              <div id="qr-reader" className="w-full"></div>
              
              <div className="mt-3 text-center text-sm text-gray-600">
                <p>Supported formats: NID barcode, QR codes, ID cards</p>
                <p className="text-xs mt-1">The scanner will automatically extract Name and NID</p>
              </div>
              
              {/* Camera troubleshooting tips */}
              {availableCameras.length === 0 && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-700 font-medium">⚠️ No camera detected</p>
                  <p className="text-xs text-yellow-600 mt-1">
                    Please check camera permissions or use manual paste option below.
                  </p>
                </div>
              )}
            </div>
          )}
          
          
        </div>

        {/* TEXT AREA FOR MANUAL PASTE */}
        <div className="mb-6">
          <label className="block mb-2 text-lg font-medium text-gray-700">
            Scan/Paste Data Area:
            <span className="text-sm font-normal text-gray-500 ml-2">(Paste scanned data or use camera scanner above)</span>
          </label>
          <textarea
            ref={textAreaRef}
            rows={3}
            className="w-full p-3 text-gray-700 border border-purple-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder="Paste scanned data here or use camera scanner above..."
            onPaste={handleTextAreaPaste}
            onBlur={(e) => {
              const result = parseScannedData(e.target.value);
              if (result.name || result.nid) {
                setFormData(prev => ({
                  ...prev,
                  name: result.name || prev.name,
                  nid: result.nid || prev.nid
                }));
              }
            }}
          />
          <div className="mt-2 text-sm text-gray-500 flex justify-end">
            <button
              type="button"
              onClick={() => {
                if (textAreaRef.current) {
                  textAreaRef.current.value = '';
                }
              }}
             className="clear-anim text-sm"
            >
              Clear
            </button>
          </div>
        </div>

        

        {/* Search Component */}
        {showSearch && (
          <div className="mb-6">
            <NidOrBirthCertificateSearch 
              key={searchKey}
              nidOrBirthCertificateValue={searchValue}
              autoSearch={true}
            />
            <div className="text-center mt-4">
              <button
                onClick={handleCloseSearch}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
              >
                Close Search
              </button>
            </div>
          </div>
        )}

        {/* NID Exists Warning */}
        
{nidExistsMessage && (
  <div className="mb-4 p-3 bg-yellow-100 text-yellow-700 rounded-md text-center border border-yellow-300">
    {nidExistsMessage}
  </div>
)}
<div
className='text-center'
>
{nidExists && (
  <button
    type="button"
    onClick={handleSearch}
    className="flex-1  text-center btn-sweep btn-primary px-6 py-3 text-md font-bold"
  >
    View Details
  </button>
)} </div>

        {/* Success/Error Messages */}
        {successMessage && !nidExistsMessage && (
          <div className={`mb-4 p-3 rounded-md text-center ${
            successMessage.includes('⚠️') 
              ? 'bg-yellow-100 text-yellow-700' 
              : 'bg-green-100 text-green-700'
          }`}>
            {successMessage}
          </div>
        )}

        {errorMessage && !nidExistsMessage && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-center">
            {errorMessage}
          </div>
        )}




        <form className="space-y-6">
          {/* Name Field */}
          <div>
            <label className="block mb-2 text-lg font-medium text-gray-700">
              Candidate Name:
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-3 rounded-md text-gray-700 border border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Enter candidate full name (auto-filled from scanner)"
              required
            />
            {formErrors.name && (
              <div className="mt-1 text-red-600 text-sm">{formErrors.name}</div>
            )}
          </div>

          {/* Identification Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-lg font-medium text-gray-700">
                NID Number:
                {nidExists && <span className="text-red-500 ml-1">* (Already exists)</span>}
              </label>
              <input
                type="text"
                name="nid"
                value={formData.nid}
                onChange={handleChange}
                className={`w-full p-3 rounded-md border ${nidExists ? 'border-red-500 bg-red-50' : 'border-gray-300'} text-gray-700 border border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"`}
                placeholder="Enter NID number (auto-filled from scanner)"
              />
              {formErrors.nid && (
                <div className="mt-1 text-red-600 text-sm">{formErrors.nid}</div>
              )}
            </div>

            <div>
              <label className="block mb-2 text-lg font-medium text-gray-700">Birth Certificate ID:</label>
              <input
                type="text"
                name="birthCertificate"
                value={formData.birthCertificate}
                onChange={handleChange}
                className="w-full p-3 rounded-md text-gray-700 border border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter birth certificate ID"
              />
            </div>
          </div>










          {formErrors.idValidation && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {formErrors.idValidation}
            </div>
          )}

          <div className="p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
             You must provide either NID or Birth Certificate ID
          </div>

          {/* Photo Upload Section */}
          {/* <div>
            <label className="block mb-2 text-lg font-medium text-gray-700">
              Candidate Photo:
              <span className="text-red-500 ml-1">*</span>
            </label>
            
            <div className="flex space-x-4 mb-4">
             <button
                type="button"
                onClick={startCamera}
                className="flex-1 btn-sweep btn-primary px-6 py-3 text-md font-bold"
              >
                <span>📷 Take Photo</span>
              </button>
              <button
                type="button"
                onClick={() => document.getElementById('fileInput').click()}
                className="flex-1 btn-sweep btn-blue px-6 py-3 text-md font-bold"
              >
                📁 Upload File
              </button>
            </div>

            <input
              id="fileInput"
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              className="hidden"
              disabled={loading}
            />

            {showWebcam && (
              <div className="mb-4 p-4 border border-blue-300 rounded-md bg-blue-50">
                <div className="text-center mb-2">
                  <p className="text-blue-700 font-medium">📸 Camera Active - Smile!</p>
                </div>
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
                  className="w-full h-auto rounded-md"
                />
                <div className="flex space-x-2 mt-2">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium"
                  >
                    📷 Capture Photo
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium"
                  >
                    ❌ Cancel
                  </button>
                </div>
              </div>
            )}

            {(formData.picture || capturedImage) && (
              <div className="flex items-center space-x-4 p-4 border border-green-300 rounded-md bg-green-50">
                <div className="flex-shrink-0">
                  <img 
                    src={formData.picture || capturedImage} 
                    alt="Candidate" 
                    className="w-20 h-20 object-cover rounded-md border border-gray-300"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-green-600 font-medium">
                    {capturedImage ? '✅ Photo captured from camera!' : '✅ Photo selected successfully!'}
                  </p>
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="mt-1 text-red-600 hover:text-red-500 text-sm"
                    disabled={loading}
                  >
                    Remove Photo
                  </button>
                </div>
              </div>
            )}

            <div className="mt-2 text-sm text-gray-500">
              Supported formats: JPEG, PNG, JPG, WebP (Max 5MB) or use camera
            </div>
            {formErrors.picture && (
              <div className="mt-1 text-red-600 text-sm">{formErrors.picture}</div>
            )}
          </div> */}

          {/* Failure Reason Section - শুধুমাত্র FAILED হলে দেখাবে */}
          {showFailureReason && (
            <div className="p-4 border border-red-300 rounded-md bg-red-50">
              <div className="mb-3">
                <label className="block mb-2 text-lg font-medium text-red-700">
                  Failure Reason:
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  name="failureReason"
                  value={formData.failureReason}
                  onChange={handleChange}
                  className="w-full p-3 rounded-md border border-red-300 bg-white text-gray-900 focus:ring-2 focus:ring-red-500"
                >
                  <option value="">-- Select Failure Reason --</option>

                  {failureReasons.map((reason, index) => (
                    <option key={index} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
                {formErrors.failureReason && (
                  <div className="mt-1 text-red-600 text-sm">{formErrors.failureReason}</div>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => handleSubmit('FAILED')}
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium"
                >
                  {loading ? 'Submitting...' : 'Confirm FAILED'}
                </button>
                <button
                  type="button"
                  onClick={cancelFailureReason}
                  disabled={loading}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* PASSED/FAILED Buttons - Failure reason show থাকলে hide করবে */}
          {!showFailureReason && (
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleSubmit('PASSED')}
                disabled={loading || (formData.nid && nidExists)}
                className="w-full btn-sweep btn-success px-6 py-3 text-md font-bold disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'PASSED'}
              </button>
              
              <button
                type="button"
                onClick={() => handleSubmit('FAILED')}
                disabled={loading || (formData.nid && nidExists)}
                className="w-full btn-sweep btn-danger px-6 py-3 text-md font-bold disabled:cursor-not-allowed " 
              >
                {loading ? 'Processing...' : 'FAILED'}
              </button>
            </div>
          )}
        </form>

        
      </div>
    </div>
  );
}