
// components/viva-interview/VideosSection.js
'use client'
import { useState, useRef } from 'react';

export default function VideosSection({ formData, setFormData, uploading }) {
  const [videoName, setVideoName] = useState('');
  const videoFilesRef = useRef(null);

  const handleVideoSelect = () => {
    const file = videoFilesRef.current?.files[0];
    if (!file || !videoName) {
      alert('❌ Please select a video file and enter a name');
      return;
    }

    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    if (!allowedTypes.includes(file.type)) {
      alert('❌ Please select a valid video file (MP4, WebM, OGG)');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert('❌ Video size should be less than 50MB');
      return;
    }

    const localUrl = URL.createObjectURL(file);
    const newVideo = {
      name: videoName,
      url: localUrl,
      originalName: file.name,
      file: file
    };
    
    setFormData(prev => ({
      ...prev,
      videos: [...prev.videos, newVideo]
    }));
    
    setVideoName('');
    videoFilesRef.current.value = '';
  };

  const removeVideo = (index) => {
    const updatedVideos = [...formData.videos];
    updatedVideos.splice(index, 1);
    setFormData(prev => ({ ...prev, videos: updatedVideos }));
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-3 text-indigo-600">Process Videos</h2>
      
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Video Name:</label>
            <input
              type="text"
              value={videoName}
              onChange={(e) => setVideoName(e.target.value)}
              placeholder="Enter video name/description"
              className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
              disabled={uploading}
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Select Video:</label>
            <input
              ref={videoFilesRef}
              type="file"
              accept="video/*"
              className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
              disabled={uploading}
            />
          </div>
        </div>
        
        <button
          type="button"
          onClick={handleVideoSelect}
          disabled={uploading || !videoName || !videoFilesRef.current?.files[0]}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
        >
          + Add Video
        </button>

        {formData.videos.length > 0 && (
          <div className="mt-3">
            <h3 className="text-sm font-medium mb-2 text-gray-700">Selected Videos:</h3>
            <div className="space-y-2">
              {formData.videos.map((video, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-indigo-100 rounded flex items-center justify-center">
                      <span className="text-xs">🎥</span>
                    </div>
                    <div>
                      <div className="font-medium text-sm text-gray-900">{video.name}</div>
                      <div className="text-xs text-gray-500">{video.originalName}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVideo(index)}
                    className="text-red-600 hover:text-red-500 text-sm transition-colors"
                    disabled={uploading}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}