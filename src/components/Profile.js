import React, { useState, useEffect } from 'react';
import LogStepsForm from './LogStepsForm';
import ScreenshotUpload from './ScreenshotUpload';

const Profile = ({ profile, totalWorkouts, currentStreak, totalSteps, onSuccess, stepData }) => {
  const [weeklySteps, setWeeklySteps] = useState(0);
  const [monthlySteps, setMonthlySteps] = useState(0);

  // Provide fallbacks for profile data
  const safeProfile = {
    name: profile?.name || '',
    bio: profile?.bio || '',
    avatar: profile?.avatar || ''
  };

  // Fetch weekly and monthly step stats
  useEffect(() => {
    const fetchStepStats = async () => {
      try {
        const token = localStorage.getItem('fithub_token');
        if (!token) return;

        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/steps/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const stats = await response.json();
          setWeeklySteps(stats.weeklySteps || 0);
          setMonthlySteps(stats.monthlySteps || 0);
        }
      } catch (error) {
        console.error('Error fetching step stats:', error);
      }
    };

    fetchStepStats();
  }, [stepData]); // Re-fetch when stepData changes

  return (
    <div className="profile-section">
      <div className="profile-avatar">
        {safeProfile.avatar ? (
          <img 
            src={safeProfile.avatar.startsWith('data:') ? safeProfile.avatar : `${process.env.REACT_APP_BASE_URL || 'http://localhost:5001'}${safeProfile.avatar}`} 
            alt="Profile Avatar" 
            className="w-full h-full object-cover rounded-full"
            onError={(e) => {
              console.error('Profile avatar failed to load:', e);
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl text-fithub-text bg-fithub-light-grey rounded-full">
            ?
          </div>
        )}
      </div>
      <div className="profile-content">
        <div className="profile-header">
          <h1 className="profile-name">{safeProfile.name}</h1>
          <p className="profile-bio">{safeProfile.bio}</p>
        </div>
         <div className="profile-stats">
           <div className="stat">
             <div className="stat-number">{(Number(weeklySteps) || 0).toLocaleString()}</div>
             <div className="stat-label">Weekly Steps</div>
           </div>
           <div className="stat">
             <div className="stat-number">{(Number(monthlySteps) || 0).toLocaleString()}</div>
             <div className="stat-label">Monthly Steps</div>
           </div>
           <div className="stat">
             <div className="stat-number">{(Number(totalSteps) || 0).toLocaleString()}</div>
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
      
      <div className="flex flex-row gap-3 min-w-[400px] max-w-[500px]">
        <div className="bg-fithub-medium-grey border border-solid border-fithub-light-grey rounded p-3 flex-1">
          <h3 className="text-sm font-semibold text-fithub-white mb-2 m-0">
            Log Steps
          </h3>
          <LogStepsForm onSuccess={onSuccess} />
        </div>
        
        <div className="bg-fithub-medium-grey border border-solid border-fithub-light-grey rounded p-3 flex-1">
          <ScreenshotUpload onSuccess={onSuccess} />
        </div>
      </div>
    </div>
  );
};

export default Profile; 