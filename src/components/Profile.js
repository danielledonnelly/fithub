import React from 'react';

const Profile = ({ totalWorkouts, currentStreak }) => {
  return (
    <div className="profile-section">
      <div className="profile-info">
        <div className="profile-avatar">🏃</div>
        <h1 className="profile-name">Fitness Enthusiast</h1>
        <p className="profile-bio">
          Committed to staying fit and healthy. Tracking my fitness journey one workout at a time! 
          🏋️‍♀️ Strength training | 🏃‍♀️ Cardio | 🧘‍♀️ Yoga
        </p>
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