import React from 'react';

const Profile = ({ profile, totalWorkouts, currentStreak, totalSteps }) => {
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
    </div>
  );
};

export default Profile; 