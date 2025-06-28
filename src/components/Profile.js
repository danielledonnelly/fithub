import React from 'react';

const Profile = ({ totalWorkouts, currentStreak }) => {
  return (
    <div className="profile-section">
      <div className="profile-avatar">D</div>
      <div className="profile-content">
        <div className="profile-header">
          <h1 className="profile-name">DANI</h1>
          <p className="profile-bio">LOCK IN LOCK IN LOCK IN</p>
        </div>
        <div className="profile-stats">
          <div className="stat">
            <div className="stat-number">{totalWorkouts}</div>
            <div className="stat-label">Total Workouts</div>
          </div>
          <div className="stat">
            <div className="stat-number">{currentStreak}</div>
            <div className="stat-label">Current Streak</div>
          </div>
          <div className="stat">
            <div className="stat-number">12</div>
            <div className="stat-label">Months Active</div>
          </div>
          <div className="stat">
            <div className="stat-number">85</div>
            <div className="stat-label">Fitness Score</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 