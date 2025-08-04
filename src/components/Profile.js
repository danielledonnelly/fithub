import React from 'react';
import LogStepsForm from './LogStepsForm';
import ScreenshotUpload from './ScreenshotUpload';

const Profile = ({ profile, totalWorkouts, currentStreak, totalSteps, onSuccess }) => {
  // Provide fallbacks for profile data
  const safeProfile = {
    name: profile?.name || '',
    bio: profile?.bio || '',
    avatar: profile?.avatar || ''
  };

  return (
    <div className="profile-section">
      <div className="profile-avatar">{safeProfile.avatar}</div>
      <div className="profile-content">
        <div className="profile-header">
          <h1 className="profile-name">{safeProfile.name}</h1>
          <p className="profile-bio">{safeProfile.bio}</p>
        </div>
        <div className="profile-stats">
          <div className="stat">
            <div className="stat-number">{totalWorkouts || 0}</div>
            <div className="stat-label">Total Workouts</div>
          </div>
          <div className="stat">
            <div className="stat-number">{currentStreak || 0}</div>
            <div className="stat-label">Current Streak</div>
          </div>
          <div className="stat">
            <div className="stat-number">{totalSteps || 0}</div>
            <div className="stat-label">Total Steps</div>
          </div>
          {/* Commented out for now
          <div className="stat">
            <div className="stat-number">{profile.monthsActive}</div>
            <div className="stat-label">Months Active</div>
          </div>
          <div className="stat">
            <div className="stat-number">{profile.fitnessScore}</div>
            <div className="stat-label">Fitness Score</div>
          </div>
          */}
        </div>
      </div>
      
      <div style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        gap: '12px',
        minWidth: '400px',
        maxWidth: '500px'
      }}>
        <div style={{
          backgroundColor: '#161b22',
          border: '1px solid #30363d',
          borderRadius: '6px',
          padding: '12px',
          flex: '1'
        }}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#f0f6fc',
            margin: '0 0 8px 0'
          }}>
            Log Steps
          </h3>
          <LogStepsForm onSuccess={onSuccess} />
        </div>
        
        <div style={{
          backgroundColor: '#161b22',
          border: '1px solid #30363d',
          borderRadius: '6px',
          padding: '12px',
          flex: '1'
        }}>
          <ScreenshotUpload onSuccess={onSuccess} />
        </div>
      </div>
    </div>
  );
};

export default Profile; 