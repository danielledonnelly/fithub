import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ContributionGraph from '../components/ContributionGraph';
import CommunityService from '../services/CommunityService';

const UserProfile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stepData, setStepData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Search for the user by username
        const searchResult = await CommunityService.searchUsers(username);
        const foundUser = searchResult.users.find(u => u.username === username);
        
        if (!foundUser) {
          setError('User not found');
          return;
        }
        
        setUser(foundUser);
        
        // Get leaderboard data to get step information
        const leaderboardData = await CommunityService.getLeaderboard();
        const userWithSteps = leaderboardData.users.find(u => u.username === username);
        
        if (userWithSteps) {
          // Create step data object for the contribution graph
          // For now, we'll create mock data based on their totals
          // In a real implementation, you'd want to fetch their actual daily step data
          const mockStepData = {};
          const today = new Date();
          
          // Generate some mock data for the last 365 days
          for (let i = 0; i < 365; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            // Use their daily average or generate some variation
            const dailyAverage = Math.floor(userWithSteps.daily_steps / 7); // Rough weekly average
            const variation = Math.floor(Math.random() * dailyAverage * 0.5);
            mockStepData[dateStr] = Math.max(0, dailyAverage + variation);
          }
          
          setStepData(mockStepData);
        }
        
      } catch (error) {
        console.error('Error loading user profile:', error);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      loadUserProfile();
    }
  }, [username]);

  const handleBackToCommunity = () => {
    navigate('/community');
  };

  if (loading) {
    return (
      <div className="container">
        <div className="main-content">
          <div className="text-fithub-text text-center py-8">Loading user profile...</div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container">
        <div className="main-content">
          <div className="text-center py-8">
            <h1 className="text-2xl font-bold text-fithub-white mb-4">User Not Found</h1>
            <p className="text-fithub-text mb-4">The user "{username}" could not be found.</p>
            <button
              onClick={handleBackToCommunity}
              className="px-4 py-2 bg-fithub-bright-red text-white rounded hover:bg-fithub-dark-red transition-colors"
            >
              Back to Community
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate stats from step data
  const totalSteps = Object.values(stepData).reduce((sum, steps) => sum + steps, 0);
  const activeDays = Object.values(stepData).filter(steps => steps > 0).length;
  const currentStreak = calculateStreak(stepData);
  const maxStreak = calculateMaxStreak(stepData);

  return (
    <div className="container">
      <div className="main-content">
        <div className="flex justify-between items-center mb-1 page-header">
          <div>
            <button
              onClick={handleBackToCommunity}
              className="text-fithub-text hover:text-fithub-white transition-colors mb-2"
            >
              ← Back to Community
            </button>
            <h1 className="page-title">{user.display_name || user.username}</h1>
            <p className="contribution-subtitle">
              @{user.username}
            </p>
          </div>
        </div>

        {/* User Info */}
        <div className="section mb-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-fithub-dark-grey rounded-full flex items-center justify-center">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.display_name || user.username}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <span className="text-2xl text-fithub-white">
                  {(user.display_name || user.username).charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-fithub-white">
                {user.display_name || user.username}
              </h2>
              <p className="text-fithub-text">@{user.username}</p>
              {user.bio && (
                <p className="text-fithub-text mt-2">{user.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
          <div className="section text-center">
            <div className="text-2xl font-bold text-fithub-bright-red">
              {totalSteps.toLocaleString()}
            </div>
            <div className="text-sm text-fithub-text">Total Steps</div>
          </div>
          <div className="section text-center">
            <div className="text-2xl font-bold text-fithub-bright-red">
              {activeDays}
            </div>
            <div className="text-sm text-fithub-text">Active Days</div>
          </div>
          <div className="section text-center">
            <div className="text-2xl font-bold text-fithub-bright-red">
              {currentStreak}
            </div>
            <div className="text-sm text-fithub-text">Current Streak</div>
          </div>
          <div className="section text-center">
            <div className="text-2xl font-bold text-fithub-bright-red">
              {maxStreak}
            </div>
            <div className="text-sm text-fithub-text">Best Streak</div>
          </div>
        </div>

        {/* Contribution Graph */}
        <div className="section mb-5">
          <h2 className="section-title mb-4">Activity Overview</h2>
          <ContributionGraph stepData={stepData} />
        </div>
      </div>
    </div>
  );
};

// Helper function to calculate current streak
function calculateStreak(stepData) {
  const dates = Object.keys(stepData).sort().reverse();
  let streak = 0;
  
  for (const date of dates) {
    if (stepData[date] > 0) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

// Helper function to calculate maximum streak
function calculateMaxStreak(stepData) {
  const dates = Object.keys(stepData).sort();
  let maxStreak = 0;
  let currentStreak = 0;
  
  for (const date of dates) {
    if (stepData[date] > 0) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }
  
  return maxStreak;
}

export default UserProfile;
