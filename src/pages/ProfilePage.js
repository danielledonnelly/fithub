import React, { useState } from 'react';
import { useProfile } from '../context/ProfileContext';

const ProfilePage = () => {
  const { profile, updateProfile } = useProfile();
  const [formData, setFormData] = useState({
    name: profile.name,
    bio: profile.bio,
    avatar: profile.avatar,
    monthsActive: profile.monthsActive,
    fitnessScore: profile.fitnessScore
  });
  const [isEditing, setIsEditing] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'monthsActive' || name === 'fitnessScore' ? parseInt(value) || 0 : value
    }));
  };

  const handleSave = () => {
    updateProfile(formData);
    setIsEditing(false);
    setSaveMessage('Profile updated successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleCancel = () => {
    setFormData({
      name: profile.name,
      bio: profile.bio,
      avatar: profile.avatar,
      monthsActive: profile.monthsActive,
      fitnessScore: profile.fitnessScore
    });
    setIsEditing(false);
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
            backgroundColor: '#238636',
            border: '1px solid #2ea043',
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
                  backgroundColor: '#238636',
                  border: '1px solid #2ea043',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#2ea043';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#238636';
                }}
              >
                Edit Profile
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gap: '20px', maxWidth: '500px' }}>
            <div>
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

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#f0f6fc' 
              }}>
                Avatar (Single Character)
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: '#f0f6fc' 
                }}>
                  Months Active
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    name="monthsActive"
                    value={formData.monthsActive}
                    onChange={handleInputChange}
                    min="0"
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
                    {profile.monthsActive}
                  </div>
                )}
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: '#f0f6fc' 
                }}>
                  Fitness Score
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    name="fitnessScore"
                    value={formData.fitnessScore}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
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
                    {profile.fitnessScore}
                  </div>
                )}
              </div>
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
                    backgroundColor: '#238636',
                    border: '1px solid #2ea043',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#2ea043';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = '#238636';
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
      </div>
    </div>
  );
};

export default ProfilePage; 