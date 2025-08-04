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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div>
        <h3 style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#f0f6fc',
          margin: '0 0 6px 0'
        }}>
          Upload Screenshot
        </h3>
        <p style={{
          fontSize: '12px',
          color: '#8b949e',
          margin: '0 0 8px 0',
          lineHeight: '1.3'
        }}>
          Upload a screenshot of your fitness app to automatically extract step count.
        </p>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{
          fontSize: '12px',
          fontWeight: '600',
          color: '#f0f6fc'
        }}>
          Screenshot
        </label>
        <div style={{
          position: 'relative',
          display: 'inline-block',
          width: '100%'
        }}>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            style={{
              position: 'absolute',
              opacity: 0,
              width: '100%',
              height: '100%',
              cursor: uploading ? 'not-allowed' : 'pointer',
              zIndex: 2
            }}
          />
          <div style={{
            padding: '8px 12px',
            border: '2px dashed #30363d',
            borderRadius: '6px',
            backgroundColor: '#0d1117',
            color: '#8b949e',
            fontSize: '12px',
            textAlign: 'center',
            cursor: uploading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            borderColor: uploading ? '#30363d' : '#BB1F21',
            backgroundColor: uploading ? '#161b22' : '#0d1117'
          }}
          onMouseEnter={(e) => {
            if (!uploading) {
              e.target.style.borderColor = '#a01a1c';
              e.target.style.backgroundColor = '#161b22';
            }
          }}
          onMouseLeave={(e) => {
            if (!uploading) {
              e.target.style.borderColor = '#BB1F21';
              e.target.style.backgroundColor = '#0d1117';
            }
          }}
          >
            {uploading ? 'Processing...' : 'Choose file or drag here'}
          </div>
        </div>
      </div>
      
      {uploading && (
        <div style={{ 
          color: '#7d8590', 
          fontSize: '12px',
          padding: '8px 12px',
          backgroundColor: '#161b22',
          border: '1px solid #30363d',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            border: '2px solid #30363d',
            borderTop: '2px solid #BB1F21',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          Processing image...
        </div>
      )}
      
      {error && (
        <div style={{ 
          color: '#f85149', 
          fontSize: '12px',
          padding: '8px 12px',
          backgroundColor: '#da3633',
          border: '1px solid #f85149',
          borderRadius: '6px'
        }}>
          Error: {error}
        </div>
      )}
    </div>
  );
};

export default ScreenshotUpload;