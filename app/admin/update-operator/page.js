// app/admin/update-operator/page.js

"use client";
import { useState, useRef, useEffect } from 'react';

// ডেটা ফরম্যাটিং এর জন্য Helper Function
const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
};

const OperatorUpdatePage = () => {
    const [searchId, setSearchId] = useState('');
    const [operatorData, setOperatorData] = useState(null);
    const [formData, setFormData] = useState({});
    const [pictureFile, setPictureFile] = useState(null);
    const [newVideoFiles, setNewVideoFiles] = useState([]);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // 📸 Camera State and Refs
    const [stream, setStream] = useState(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    
    // ✅ NEW: Processes state for allowed processes
    const [processes, setProcesses] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loadingProcesses, setLoadingProcesses] = useState(true);

    // ✅ NEW: Fetch processes from API
    useEffect(() => {
        const fetchProcesses = async () => {
            try {
                const response = await fetch('/api/processes');
                if (response.ok) {
                    const data = await response.json();
                    setProcesses(data);
                }
            } catch (error) {
                console.error('Error fetching processes:', error);
            } finally {
                setLoadingProcesses(false);
            }
        };
        fetchProcesses();
    }, []);

    // ✅ NEW: Handle process toggle
    const handleProcessToggle = (processName) => {
        setFormData(prev => {
            const newProcesses = { ...prev.allowedProcesses };
            if (newProcesses[processName] !== undefined) {
                delete newProcesses[processName];
            } else {
                newProcesses[processName] = 0; // default score
            }
            return { ...prev, allowedProcesses: newProcesses };
        });
    };

    // ✅ NEW: Handle process score change
    const handleProcessScoreChange = (processName, score) => {
        setFormData(prev => ({
            ...prev,
            allowedProcesses: {
                ...prev.allowedProcesses,
                [processName]: parseInt(score) || 0
            }
        }));
    };

    // --- Camera Capture Logic ---
    const startCamera = async () => {
        setError('');
        try {
            const constraints = { video: { facingMode: "environment" } }; 
            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(mediaStream);
            
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play().catch(err => {
                        console.error("Video play failed:", err);
                        setError("Video stream failed to play. Try again or check permissions.");
                    });
                };
            }
        } catch (err) {
            console.error("Error accessing camera: ", err);
            setError("Could not access camera. Check device permissions or ensure you are on HTTPS.");
        }
    };
    
    const stopCamera = () => {
        stream?.getTracks().forEach(track => track.stop());
        setStream(null);
    };

    const handleCapture = () => {
        if (stream && videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            canvas.toBlob((blob) => {
                const capturedFile = new File([blob], `captured_image_${Date.now()}.jpeg`, { type: 'image/jpeg' });
                setPictureFile(capturedFile);
                stopCamera();
            }, 'image/jpeg');
        }
    };
    // --- End Camera Capture Logic ---

    // --- Search Logic (Updated to set allowed processes properly) ---
    const handleSearch = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setOperatorData(null);
        setFormData({});
        setPictureFile(null); 
        setNewVideoFiles([]);
        setSearchTerm('');
        stopCamera();

        if (!searchId) {
            setError('Please enter an Operator ID.');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`/api/operators/search-for-update?operatorId=${searchId}`);
            const result = await response.json();

            if (result.success) {
                setMessage('Operator found. You can now update the details.');
                const data = result.data;
                setOperatorData(data);
                
                // ✅ UPDATED: Set allowed processes directly as object, not JSON string
                setFormData({
                    ...data,
                    joiningDate: formatDate(data.joiningDate),
                    allowedProcesses: data.allowedProcesses || {}, // Keep as object
                    videos: data.videos?.map(v => v.url).join('\n') || '',
                });
            } else {
                setError(result.message || 'Failed to find operator.');
                setMessage('');
            }
        } catch (err) {
            setError('An error occurred during search.');
        } finally {
            setIsLoading(false);
        }
    };

    // --- Form Change Handler ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // --- Picture File Change Handler ---
    const handlePictureFileChange = (e) => {
        const file = e.target.files[0];
        setPictureFile(file);
        stopCamera();
    };
    
    // --- Video Files Change Handler ---
    const handleVideoFileChange = (e) => {
        const files = Array.from(e.target.files); 
        setNewVideoFiles(files);
    };
    
    // --- Update Logic ---
    const handleUpdate = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        if (!operatorData || !operatorData._id) {
            setError('No operator loaded for update.');
            return;
        }
        
        setIsLoading(true);
        
        const updateFormData = new FormData();

        // 1. Text/JSON Fields Add to FormData
        for (const key in formData) {
            if (key === 'operatorId' || key === 'picture' || key === 'videos') continue; 

            let value = formData[key];

            if (key === 'allowedProcesses') {
                // ✅ UPDATED: Already an object, no need to parse
                updateFormData.append(key, JSON.stringify(value));
            } 
            else {
                updateFormData.append(key, value);
            }
        }
        
        // 1.1. Existing/Updated Video URLs
        const videoUrls = (formData.videos || '').split('\n').filter(url => url.trim() !== '');
        const videoObjects = videoUrls.map(url => ({ 
             name: url.substring(url.lastIndexOf('/') + 1),
             url: url.trim() 
        }));
        updateFormData.append('videos', JSON.stringify(videoObjects));

        // 2. File Fields Add to FormData
        
        // Picture File
        if (pictureFile) {
            updateFormData.append('pictureFile', pictureFile);
        } else if (operatorData.picture && !formData.picture) {
            updateFormData.append('picture', ''); 
        }

        // Video Files
        if (newVideoFiles.length > 0) {
            newVideoFiles.forEach(file => {
                updateFormData.append('newVideoFiles', file); 
            });
        }

        try {
            const response = await fetch(`/api/operators/operator-update/${operatorData._id}`, {
                method: 'PUT',
                body: updateFormData,
            });
            const result = await response.json();

            if (result.success) {
                setMessage('Operator updated successfully! 🎉');
                setError('');
                const updatedData = result.data;
                setOperatorData(updatedData);
                setFormData({
                    ...updatedData,
                    joiningDate: formatDate(updatedData.joiningDate),
                    allowedProcesses: updatedData.allowedProcesses || {}, // Keep as object
                    videos: updatedData.videos?.map(v => v.url).join('\n') || '',
                });
                setPictureFile(null);
                setNewVideoFiles([]);
            } else {
                setError(result.message || 'Update failed.');
                setMessage('');
            }
        } catch (err) {
            setError('An error occurred during update.');
        } finally {
            setIsLoading(false);
        }
    };

    // ✅ NEW: Filter processes for search
    const filteredProcesses = processes.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- RENDER ---
    return (
        <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-center text-blue-700">👤 Operator Data Update</h1>
            
            {/* Search Section */}
            <div className="max-w-xl mx-auto mb-8 p-6 bg-white shadow-lg rounded-lg border border-blue-200">
                <form onSubmit={handleSearch} className="flex space-x-2">
                    <input
                        type="text"
                        placeholder="Search by Operator ID (e.g., OP1234)"
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                        className="flex-grow p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:bg-gray-400"
                        disabled={isLoading}
                    >
                        {isLoading && !operatorData ? 'Searching...' : 'Search'}
                    </button>
                </form>
            </div>

            {/* Message/Error Display */}
            <div className="max-w-xl mx-auto mb-4">
                {message && <p className="p-3 bg-green-100 text-green-700 border border-green-300 rounded-lg">{message}</p>}
                {error && <p className="p-3 bg-red-100 text-red-700 border border-red-300 rounded-lg">{error}</p>}
            </div>

            {/* Update Form */}
            {operatorData && (
                <div className="max-w-4xl mx-auto p-8 bg-white shadow-2xl rounded-xl">
                    <h2 className="text-2xl font-semibold mb-6 text-blue-600 border-b pb-2">Update Details for {operatorData.operatorId}</h2>
                    <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Name & Joining Date */}
                        <div className="flex flex-col">
                            <label htmlFor="name" className="text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input type="text" id="name" name="name" value={formData.name || ''} onChange={handleChange} className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="joiningDate" className="text-sm font-medium text-gray-700 mb-1">Joining Date</label>
                            <input type="date" id="joiningDate" name="joiningDate" value={formData.joiningDate || ''} onChange={handleChange} className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        
                        {/* Picture Field */}
                        <div className="md:col-span-2 flex flex-col border p-4 rounded-lg bg-gray-50">
                            <label className="text-lg font-bold text-gray-800 mb-3">Operator Picture 📸</label>
                            
                            {(pictureFile || operatorData.picture) && (
                                <div className="mb-4">
                                    <p className="text-sm font-medium mb-2">Current/New Picture Preview:</p>
                                    <img 
                                        src={pictureFile ? URL.createObjectURL(pictureFile) : operatorData.picture} 
                                        alt="Operator" 
                                        className="w-32 h-32 object-cover rounded-md border-2 border-indigo-300" 
                                    />
                                </div>
                            )}

                            {stream ? (
                                <div className="flex flex-col items-center">
                                    <p className="text-sm font-medium mb-2 text-indigo-600">Live Camera View:</p>
                                    <video 
                                        ref={videoRef} 
                                        className="w-full max-w-sm rounded-lg mb-3 border-4 border-red-500" 
                                        autoPlay 
                                        playsInline 
                                        muted 
                                    />
                                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                                    <div className="flex space-x-2">
                                        <button 
                                            type="button" 
                                            onClick={handleCapture} 
                                            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg"
                                        >
                                            Snap Photo
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={stopCamera} 
                                            className="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg"
                                        >
                                            Cancel Camera
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={startCamera}
                                        className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg transition duration-200 flex items-center justify-center mb-3"
                                    >
                                        📸 Open Camera View
                                    </button>
                                    
                                    <p className="text-center my-2 text-gray-500 font-semibold">-- OR --</p>

                                    <label htmlFor="pictureFile" className="text-sm font-medium text-gray-700 mb-2">1. Select Picture File:</label>
                                    <input
                                        type="file"
                                        id="pictureFile"
                                        name="pictureFile"
                                        accept="image/*"
                                        onChange={handlePictureFileChange}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                    />
                                </>
                            )}
                            
                            <small className="text-gray-500 mt-2">Only the newly uploaded file will be saved on update.</small>
                        </div>

                        {/* Designation, Grade, NID, Birth Certificate */}
                        <div className="flex flex-col">
                            <label htmlFor="designation" className="text-sm font-medium text-gray-700 mb-1">Designation</label>
                            <input type="text" id="designation" name="designation" value={formData.designation || ''} onChange={handleChange} className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="grade" className="text-sm font-medium text-gray-700 mb-1">Grade</label>
                            <select id="grade" name="grade" value={formData.grade || ''} onChange={handleChange} className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white">
                                {["A", "A+", "A++", "B+", "B++", "B", "C", "D", "E", "F"].map(g => (<option key={g} value={g}>{g}</option>))}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="nid" className="text-sm font-medium text-gray-700 mb-1">NID</label>
                            <input type="text" id="nid" name="nid" value={formData.nid || ''} onChange={handleChange} className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="birthCertificate" className="text-sm font-medium text-gray-700 mb-1">Birth Certificate</label>
                            <input type="text" id="birthCertificate" name="birthCertificate" value={formData.birthCertificate || ''} onChange={handleChange} className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                        </div>

                        {/* ✅ UPDATED: Allowed Processes Section (Same as operator form) */}
                        <div className="md:col-span-2 flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1">
                                Allowed Processes 
                                <span className="ml-2 text-xs text-gray-400">
                                    ({Object.keys(formData.allowedProcesses || {}).length} selected)
                                </span>
                            </label>
                            
                            {/* Search */}
                            <input
                                type="text"
                                placeholder="Search process..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full mb-2 p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 sm:text-sm"
                            />

                            <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2 bg-white">
                                {loadingProcesses ? (
                                    <div className="text-center py-2">Loading processes...</div>
                                ) : filteredProcesses.length === 0 ? (
                                    <div className="text-center py-2">No processes found</div>
                                ) : (
                                    filteredProcesses.map((process) => {
                                        const isSelected = formData.allowedProcesses && formData.allowedProcesses[process.name] !== undefined;
                                        return (
                                            <div key={process._id} className="flex items-center gap-2 mb-1">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleProcessToggle(process.name)}
                                                    className="text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className="flex-1 text-gray-900">{process.name}</span>

                                                {isSelected && (
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={formData.allowedProcesses[process.name]}
                                                        onChange={(e) => handleProcessScoreChange(process.name, e.target.value)}
                                                        className="w-16 p-1 rounded-md border border-gray-300 text-black text-sm"
                                                    />
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                        
                        {/* Videos Field */}
                        <div className="md:col-span-2 flex flex-col border p-4 rounded-lg bg-yellow-50">
                            <label className="text-lg font-bold text-gray-800 mb-3">Training Videos 📹</label>
                            
                            {operatorData.videos && operatorData.videos.length > 0 && (
                                <div className="mb-4 grid grid-cols-2 gap-4">
                                    <p className="text-sm font-medium col-span-2 mb-2">Existing Videos:</p>
                                    {operatorData.videos.map((video, index) => (
                                        <div key={index} className="border p-2 rounded-md bg-white">
                                            <p className="text-xs font-semibold truncate mb-1">{video.name || `Video ${index + 1}`}</p>
                                            <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-xs block truncate">
                                                Watch Video
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <label htmlFor="newVideoFiles" className="text-sm font-bold text-gray-700 mb-1 mt-2">1. Upload New Video Files (Add)</label>
                            <input
                                type="file"
                                id="newVideoFiles"
                                name="newVideoFiles"
                                accept="video/*"
                                multiple
                                onChange={handleVideoFileChange}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200"
                            />
                            {newVideoFiles.length > 0 && (
                                <p className="text-sm text-orange-600 mt-1">**{newVideoFiles.length}**টি নতুন ফাইল যোগ করা হয়েছে। সেভ করলে আপলোড হবে।</p>
                            )}

                            <p className="text-center my-3 text-gray-500 font-semibold">-- OR --</p>
                            
                            <label htmlFor="videos" className="text-sm font-bold text-gray-700 mb-1">2. Update/Replace Existing Videos (URLs separated by new lines)</label>
                            <textarea
                                id="videos"
                                name="videos"
                                rows="5"
                                value={formData.videos || ''}
                                onChange={handleChange}
                                className="p-3 border border-gray-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder='http://link.to/video1&#10;http://link.to/video2'
                            />
                            <small className="text-gray-500 mt-2">টেক্সট-এরিয়ার সব URL ডাটাবেসে সেভ হবে। নতুন লাইন ব্যবহার করে URL যোগ বা মুছে দিয়ে আপডেট করুন।</small>
                        </div>

                        {/* Submit Button */}
                        <div className="md:col-span-2 pt-4">
                            <button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition duration-200 disabled:bg-gray-400 flex items-center justify-center"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Updating...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default OperatorUpdatePage;