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
  const [fitbitStatus, setFitbitStatus] = useState({
    connected: false,
    connectedAt: null,
    lastSync: null
  });
  const [fitbitLoading, setFitbitLoading] = useState(false);
  const [fitbitSyncLoading, setFitbitSyncLoading] = useState(false);

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

    // Load Fitbit connection status
    useEffect(() => {
      const loadFitbitStatus = async () => {
        try {
          const token = localStorage.getItem('fithub_token');
          if (token) {
            const response = await fetch('http://localhost:5001/api/fitbit/status', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            if (response.ok) {
              const status = await response.json();
              setFitbitStatus(status);
            }
          }
        } catch (error) {
          console.error('Error loading Fitbit status:', error);
        }
      };
  
      loadFitbitStatus();
      
      // Set up polling to check status every 30 seconds during OAuth flow
      const interval = setInterval(loadFitbitStatus, 30000);
      
      // Listen for OAuth completion messages from popup
      const handleMessage = (event) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'FITBIT_OAUTH_COMPLETE') {
          console.log('Fitbit OAuth completed, refreshing status...');
          loadFitbitStatus();
          setSaveMessage('Fitbit connected successfully!');
          setTimeout(() => setSaveMessage(''), 3000);
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('message', handleMessage);
      };
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

    // Handle Fitbit connection
  const handleConnectFitbit = async () => {
    try {
      setFitbitLoading(true);
      const token = localStorage.getItem('fithub_token');
      const response = await fetch('http://localhost:5001/api/fitbit/auth-url', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Open Fitbit OAuth in new window
        const popup = window.open(data.authUrl, '_blank', 'width=500,height=600');
        
        // Check if popup was blocked
        if (!popup) {
          setSaveMessage('Popup was blocked. Please allow popups and try again.');
          setTimeout(() => setSaveMessage(''), 5000);
          return;
        }
        
        // Set up a check for popup completion
        const checkPopup = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkPopup);
            // Popup closed, refresh status
            setTimeout(() => {
              const loadFitbitStatus = async () => {
                try {
                  const token = localStorage.getItem('fithub_token');
                  if (token) {
                    const response = await fetch('http://localhost:5001/api/fitbit/status', {
                      headers: {
                        'Authorization': `Bearer ${token}`
                      }
                    });
                    if (response.ok) {
                      const status = await response.json();
                      setFitbitStatus(status);
                    }
                  }
                } catch (error) {
                  console.error('Error loading Fitbit status:', error);
                }
              };
              loadFitbitStatus();
            }, 1000); // Wait 1 second for backend to process
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error getting Fitbit auth URL:', error);
      setSaveMessage('Failed to connect Fitbit. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setFitbitLoading(false);
    }
  };

  // Handle Fitbit sync
  const handleSyncFitbit = async () => {
    try {
      setFitbitSyncLoading(true);
      const token = localStorage.getItem('fithub_token');
      const response = await fetch('http://localhost:5001/api/fitbit/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setSaveMessage(`Fitbit sync successful! Synced ${result.stepsSynced} days of step data.`);
        setTimeout(() => setSaveMessage(''), 5000);
        
        // Refresh the Fitbit status to show last sync time
        const statusResponse = await fetch('http://localhost:5001/api/fitbit/status', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (statusResponse.ok) {
          const status = await statusResponse.json();
          setFitbitStatus(status);
        }
      } else {
        const error = await response.json();
        setSaveMessage(`Fitbit sync failed: ${error.message}`);
        setTimeout(() => setSaveMessage(''), 5000);
      }
    } catch (error) {
      console.error('Error syncing Fitbit:', error);
      setSaveMessage('Failed to sync Fitbit. Please try again.');
      setTimeout(() => setSaveMessage(''), 5000);
    } finally {
      setFitbitSyncLoading(false);
    }
  };

  const handleDisconnectFitbit = async () => {
    try {
      const token = localStorage.getItem('fithub_token');
      const response = await fetch('http://localhost:5001/api/fitbit/disconnect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setSaveMessage('Fitbit disconnected successfully!');
        setTimeout(() => setSaveMessage(''), 5000);
        
        // Update local state
        setFitbitStatus({
          connected: false,
          connectedAt: null,
          lastSync: null
        });
      } else {
        const error = await response.json();
        setSaveMessage(`Failed to disconnect: ${error.message}`);
        setTimeout(() => setSaveMessage(''), 5000);
      }
    } catch (error) {
      console.error('Error disconnecting Fitbit:', error);
      setSaveMessage('Failed to disconnect Fitbit. Please try again.');
      setTimeout(() => setSaveMessage(''), 5000);
    }
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

        

        {/* Fitness App Integrations Section */}
        <div className="contribution-section" style={{ marginTop: '20px' }}>
          <h2 className="contribution-title">Fitness App Integrations</h2>
          <p className="contribution-subtitle">
            Connect your fitness apps to automatically sync your step data
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
            {/* Google Fit Integration */}
            <div style={{ 
              padding: '16px', 
              border: '1px solid #30363d', 
              borderRadius: '8px',
              backgroundColor: '#161b22'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#f0f6fc' }}>Google Fit</h3>
                <div style={{ 
                  padding: '8px 12px', 
                  backgroundColor: googleFitStatus.connected ? '#28a745' : '#6c757d',
                  color: '#ffffff',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {googleFitStatus.connected ? 'Connected' : 'Not Connected'}
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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

            {/* Fitbit Integration */}
            <div style={{ 
              padding: '16px', 
              border: '1px solid #30363d', 
              borderRadius: '8px',
              backgroundColor: '#161b22'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#f0f6fc' }}>Fitbit</h3>
                <div style={{ 
                  padding: '8px 12px', 
                  backgroundColor: fitbitStatus.connected ? '#28a745' : '#6c757d',
                  color: '#ffffff',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {fitbitStatus.connected ? 'Connected' : 'Not Connected'}
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {!fitbitStatus.connected ? (
                  <button
                    onClick={handleConnectFitbit}
                    disabled={fitbitLoading}
                    style={{
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#ffffff',
                      backgroundColor: '#00C9A7',
                      border: '1px solid #00C9A7',
                      borderRadius: '6px',
                      cursor: fitbitLoading ? 'not-allowed' : 'pointer',
                      opacity: fitbitLoading ? 0.6 : 1,
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      if (!fitbitLoading) {
                        e.target.style.backgroundColor = '#00A085';
                        e.target.style.borderColor = '#00A085';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!fitbitLoading) {
                        e.target.style.backgroundColor = '#00C9A7';
                        e.target.style.borderColor = '#00C9A7';
                      }
                    }}
                  >
                    {fitbitLoading ? 'Loading...' : 'Connect Fitbit'}
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontSize: '14px', color: '#6c757d' }}>
                      Connected since: {fitbitStatus.connectedAt ? new Date(fitbitStatus.connectedAt).toLocaleDateString() : 'Unknown'}
                    </div>

                    <button
                      onClick={handleDisconnectFitbit}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#ffffff',
                        backgroundColor: '#dc3545',
                        border: '1px solid #dc3545',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.backgroundColor = '#c82333';
                        e.target.style.borderColor = '#c82333';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.backgroundColor = '#dc3545';
                        e.target.style.borderColor = '#dc3545';
                      }}
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 