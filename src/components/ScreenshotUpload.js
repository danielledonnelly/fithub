import React, { useState } from 'react';

const ScreenshotUpload = ({ onSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('screenshot', file);

    try {
      const token = localStorage.getItem('fithub_token');
      const response = await fetch('/api/steps/upload-screenshot', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      setUploading(false);
      onSuccess(data);
    } catch (error) {
      setUploading(false);
      setError(error.message);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm font-semibold text-fithub-white m-0">
          Upload Screenshot
        </h3>
        <p className="text-xs text-fithub-text">
          Upload a screenshot of your fitness app to automatically extract step count.
        </p>
      </div>
      
      <div className="flex flex-col gap-0.5">

        <div className="relative inline-block w-full">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="absolute opacity-0 w-full h-full cursor-pointer z-10 disabled:cursor-not-allowed"
          />
          <div className={`px-3 py-2 border-2 border-dashed rounded-md text-xs text-center transition-all duration-200 ${
            uploading 
              ? 'border-fithub-light-grey bg-fithub-medium-grey cursor-not-allowed' 
              : 'border-fithub-light-grey bg-fithub-dark-grey cursor-pointer hover:border-gray-500 hover:bg-fithub-medium-grey'
          }`}>
            {uploading ? 'Processing...' : 'Choose file or drag here'}
          </div>
        </div>
      </div>
      
      {uploading && (
        <div className="text-fithub-text text-xs px-3 py-2 bg-fithub-medium-grey border border-fithub-light-grey rounded-md flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-fithub-light-grey border-t-fithub-bright-red rounded-full animate-spin"></div>
          Processing image...
        </div>
      )}
      
      {error && (
        <div className="text-fithub-bright-red text-xs px-3 py-2 bg-fithub-dark-red border border-fithub-red rounded-md">
          Error: {error}
        </div>
      )}
    </div>
  );
};

export default ScreenshotUpload;