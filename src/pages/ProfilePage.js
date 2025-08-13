import React, { useState, useEffect } from 'react';
import ProfileService from '../services/ProfileService';

const ProfilePage = () => {
  const [profile, setProfile] = useState({
    name: '',
    bio: '',
    avatar: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    avatar: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [googleFitStatus, setGoogleFitStatus] = useState({
    connected: false,
    connectedAt: null,
    lastSync: null
  });
  const [googleFitLoading, setGoogleFitLoading] = useState(false);

  // Load profile from database
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const profileData = await ProfileService.getProfile();
        setProfile(profileData);
        setFormData(profileData);
      } catch (error) {
        console.error('Error loading profile:', error);
        // Fallback to empty profile
        const emptyProfile = {
          name: '',
          bio: '',
          avatar: ''
        };
        setProfile(emptyProfile);
        setFormData(emptyProfile);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

    // Load Google Fit connection status
    useEffect(() => {
      const loadGoogleFitStatus = async () => {
        try {
          const token = localStorage.getItem('fithub_token');
          if (token) {
            const response = await fetch('http://localhost:5001/api/google-fit/status', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            if (response.ok) {
              const status = await response.json();
              setGoogleFitStatus(status);
            }
          }
        } catch (error) {
          console.error('Error loading Google Fit status:', error);
        }
      };
  
      loadGoogleFitStatus();
    }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      const updatedProfile = await ProfileService.updateProfile(formData);
      setProfile(updatedProfile);
      setIsEditing(false);
      setSaveMessage('Profile updated successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaveMessage('Failed to update profile. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile.name,
      bio: profile.bio,
      avatar: profile.avatar
    });
    setIsEditing(false);
  };

  // Handle Google Fit connection
  const handleConnectGoogleFit = async () => {
    try {
      setGoogleFitLoading(true);
      const token = localStorage.getItem('fithub_token');
      const response = await fetch('http://localhost:5001/api/google-fit/auth-url', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Open Google OAuth in new window
        window.open(data.authUrl, '_blank', 'width=500,height=600');
      }
    } catch (error) {
      console.error('Error getting Google Fit auth URL:', error);
    } finally {
      setGoogleFitLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="main-content">
        <h1 className="contribution-title">Profile Settings</h1>
        <p className="contribution-subtitle">
          Manage your profile information and preferences
        </p>

        {saveMessage && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#BB1F21',
            border: '1px solid #BB1F21',
            borderRadius: '6px',
            color: '#ffffff',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {saveMessage}
          </div>
        )}

        <div className="contribution-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 className="contribution-title" style={{ margin: 0 }}>Profile Information</h2>
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#ffffff',
                  backgroundColor: '#BB1F21',
                  border: '1px solid #BB1F21',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#921E21';
                  e.target.style.borderColor = '#921E21';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#BB1F21';
                  e.target.style.borderColor = '#BB1F21';
                }}
              >
                Edit Profile
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gap: '20px', maxWidth: '500px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: '#f0f6fc' 
                }}>
                  Avatar
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="avatar"
                    value={formData.avatar}
                    onChange={handleInputChange}
                    maxLength="1"
                    style={{
                      width: '60px',
                      padding: '8px 12px',
                      fontSize: '14px',
                      backgroundColor: '#0d1117',
                      border: '1px solid #30363d',
                      borderRadius: '6px',
                      color: '#c9d1d9',
                      outline: 'none',
                      textAlign: 'center'
                    }}
                  />
                ) : (
                  <div style={{ 
                    width: '60px',
                    height: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    color: '#7d8590',
                    backgroundColor: '#30363d',
                    border: '1px solid #30363d',
                    borderRadius: '50%'
                  }}>
                    {profile.avatar}
                  </div>
                )}
              </div>
              
              <div style={{ flex: '1' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: '#f0f6fc' 
                }}>
                  Display Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '14px',
                      backgroundColor: '#0d1117',
                      border: '1px solid #30363d',
                      borderRadius: '6px',
                      color: '#c9d1d9',
                      outline: 'none'
                    }}
                  />
                ) : (
                  <div style={{ 
                    padding: '8px 12px', 
                    fontSize: '14px', 
                    color: '#c9d1d9',
                    backgroundColor: '#161b22',
                    border: '1px solid #30363d',
                    borderRadius: '6px'
                  }}>
                    {profile.name}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#f0f6fc' 
              }}>
                Bio
              </label>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '14px',
                    backgroundColor: '#0d1117',
                    border: '1px solid #30363d',
                    borderRadius: '6px',
                    color: '#c9d1d9',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              ) : (
                <div style={{ 
                  padding: '8px 12px', 
                  fontSize: '14px', 
                  color: '#c9d1d9',
                  backgroundColor: '#161b22',
                  border: '1px solid #30363d',
                  borderRadius: '6px',
                  minHeight: '60px'
                }}>
                  {profile.bio}
                </div>
              )}
            </div>



            {isEditing && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button 
                  onClick={handleSave}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#ffffff',
                    backgroundColor: '#BB1F21',
                    border: '1px solid #BB1F21',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#921E21';
                    e.target.style.borderColor = '#921E21';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = '#BB1F21';
                    e.target.style.borderColor = '#BB1F21';
                  }}
                >
                  Save Changes
                </button>
                <button 
                  onClick={handleCancel}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#c9d1d9',
                    backgroundColor: '#21262d',
                    border: '1px solid #30363d',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#30363d';
                    e.target.style.borderColor = '#8b949e';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = '#21262d';
                    e.target.style.borderColor = '#30363d';
                  }}
                >
                  Cancel
                </button>
              </div>
            )}

            
          </div>
        </div>

        {/* Google Fit Integration Section */}
        <div className="contribution-section" style={{ marginTop: '20px' }}>
          <h2 className="contribution-title">Google Fit Integration</h2>
          <p className="contribution-subtitle">
            Connect your Google Fit account to automatically sync your step data
          </p>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
            <div style={{ 
              padding: '12px 16px', 
              backgroundColor: googleFitStatus.connected ? '#28a745' : '#6c757d',
              color: '#ffffff',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {googleFitStatus.connected ? 'Connected' : 'Not Connected'}
            </div>
            
            {!googleFitStatus.connected ? (
              <button
                onClick={handleConnectGoogleFit}
                disabled={googleFitLoading}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#ffffff',
                  backgroundColor: '#007bff',
                  border: '1px solid #007bff',
                  borderRadius: '6px',
                  cursor: googleFitLoading ? 'not-allowed' : 'pointer',
                  opacity: googleFitLoading ? 0.6 : 1,
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  if (!googleFitLoading) {
                    e.target.style.backgroundColor = '#0056b3';
                    e.target.style.borderColor = '#0056b3';
                  }
                }}
                onMouseOut={(e) => {
                  if (!googleFitLoading) {
                    e.target.style.backgroundColor = '#007bff';
                    e.target.style.borderColor = '#007bff';
                  }
                }}
              >
                {googleFitLoading ? 'Loading...' : 'Connect Google Fit'}
              </button>
            ) : (
              <div style={{ fontSize: '14px', color: '#6c757d' }}>
                Connected since: {googleFitStatus.connectedAt ? new Date(googleFitStatus.connectedAt).toLocaleDateString() : 'Unknown'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 