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

  const [saveMessage, setSaveMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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



    // Load Fitbit connection status
    useEffect(() => {
      const loadFitbitStatus = async () => {
        try {
          const token = localStorage.getItem('fithub_token');
          if (token) {
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/fitbit/status`, {
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

  // Auto-save function with debouncing
  const autoSave = React.useCallback(
    React.useMemo(() => {
      let timeoutId;
      return (data) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          try {
            setSaving(true);
            const updatedProfile = await ProfileService.updateProfile(data);
            setProfile(updatedProfile);
          } catch (error) {
            console.error('Error auto-saving profile:', error);
            setSaveMessage('Failed to auto-save. Please try again.');
            setTimeout(() => setSaveMessage(''), 3000);
          } finally {
            setSaving(false);
          }
        }, 1000); // Wait 1 second after user stops typing
      };
    }, []),
    []
  );

  // Auto-save when formData changes
  React.useEffect(() => {
    if (!loading && (formData.name !== profile.name || formData.bio !== profile.bio || formData.avatar !== profile.avatar)) {
      autoSave(formData);
    }
  }, [formData, profile, loading, autoSave]);



    // Handle Fitbit connection
  const handleConnectFitbit = async () => {
    try {
      setFitbitLoading(true);
      const token = localStorage.getItem('fithub_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/fitbit/auth-url`, {
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
                    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/fitbit/status`, {
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
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/fitbit/sync`, {
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
        const statusResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/fitbit/status`, {
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
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/fitbit/disconnect`, {
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



  return (
    <div className="container">
      <div className="main-content">
        <h1 className="contribution-title">Profile Settings</h1>
        <p className="contribution-subtitle">
          Manage your profile information and preferences
        </p>

        {saveMessage && (
          <div className="px-3 py-3 bg-fithub-bright-red border border-fithub-bright-red rounded-md text-white mb-5 text-sm">
            {saveMessage}
          </div>
        )}
        
        <div className="contribution-section">
          <div className="flex justify-between items-center mb-5">
            <h2 className="contribution-title m-0">Profile Information</h2>
          </div>

          <div className="grid gap-5 max-w-4xl">
            <div className="flex gap-8 items-start">
              <div>
                <label className="block mb-2 text-base font-medium text-gray-100">
                  Avatar
                </label>
                <div className="flex flex-col items-center gap-2">
                  <div 
                    className="w-16 h-16 flex items-center justify-center text-2xl text-gray-500 bg-gray-600 border border-gray-600 rounded-full overflow-hidden cursor-pointer hover:bg-gray-500 transition-colors"
                    onClick={() => document.getElementById('avatar-upload').click()}
                  >
                    {formData.avatar && formData.avatar.startsWith('data:') ? (
                      <img 
                        src={formData.avatar} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="w-full h-full flex items-center justify-center text-2xl text-gray-500 bg-gray-600">
                      {formData.avatar && !formData.avatar.startsWith('data:') ? formData.avatar : '?'}
                    </div>
                  </div>
                  <input
                    id="avatar-upload"
                    type="file"
                    name="avatar"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setFormData(prev => ({
                            ...prev,
                            avatar: event.target.result
                          }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
              </div>
              
              <div style={{ flex: '0 0 200px' }}>
                <label className="block mb-2 text-base font-medium text-gray-100">
                  Display Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm bg-fithub-dark-grey border border-fithub-medium-grey rounded-md text-gray-300 outline-none border-0 focus:outline-none focus:ring-0"
                />
              </div>
              
              <div style={{ flex: '1' }}>
                <label className="block mb-2 text-base font-medium text-gray-100">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows="1"
                  className="w-full px-3 py-2 text-sm bg-fithub-dark-grey border border-fithub-medium-grey rounded-md text-gray-300 outline-none resize-y border-0 focus:outline-none focus:ring-0"
                />
              </div>
            </div>





            
          </div>
        </div>

        

        {/* Fitness App Integrations Section */}
        <div className="contribution-section" style={{ marginTop: '20px' }}>
          <h2 className="contribution-title">Fitness App Integrations</h2>
          <p className="contribution-subtitle">
            Connect your fitness apps to automatically sync your step data
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>


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
                    className="px-4 py-2 text-sm font-medium text-white bg-fithub-bright-red rounded-md cursor-pointer hover:bg-fithub-dark-red disabled:opacity-60 disabled:cursor-not-allowed border-0 outline-none"
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
                      className="px-3 py-1.5 text-xs font-medium text-white bg-fithub-dark-red rounded cursor-pointer hover:bg-fithub-brown border-0 outline-none"
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