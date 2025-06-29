import React from 'react';
import { useProfile } from '../context/ProfileContext';

const Profile = ({ totalWorkouts, currentStreak }) => {
  const { profile } = useProfile();

  return (
    <div className="profile-section">
      <div className="profile-avatar">{profile.avatar}</div>
      <div className="profile-content">
        <div className="profile-header">
          <h1 className="profile-name">{profile.name}</h1>
          <p className="profile-bio">{profile.bio}</p>
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
            <div className="stat-number">{profile.monthsActive}</div>
            <div className="stat-label">Months Active</div>
          </div>
          <div className="stat">
            <div className="stat-number">{profile.fitnessScore}</div>
            <div className="stat-label">Fitness Score</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 