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
    <div className="screenshot-upload">
      <h3>Upload Fitness App Screenshot</h3>
      <p>Take a screenshot of your fitness app showing today's steps, then upload it here.</p>
      
      <input
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        disabled={uploading}
        style={{
          padding: '10px',
          border: '1px solid #30363d',
          borderRadius: '6px',
          backgroundColor: '#0d1117',
          color: '#c9d1d9',
          width: '100%',
          marginBottom: '10px'
        }}
      />
      
      {uploading && (
        <div style={{ color: '#7d8590', marginTop: '10px' }}>
          Processing image... This may take a few seconds.
        </div>
      )}
      
      {error && (
        <div style={{ color: '#f85149', marginTop: '10px' }}>
          Error: {error}
        </div>
      )}
    </div>
  );
};

export default ScreenshotUpload;