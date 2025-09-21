import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import ContributionGraph from '../components/ContributionGraph';
import Profile from '../components/Profile';
import CommunityService from '../services/CommunityService';
import StepService from '../services/StepService';

const UserProfile = () => {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [stepData, setStepData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalSteps, setTotalSteps] = useState(0);
  const [activeDays, setActiveDays] = useState(0);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get user data by username
        const userResponse = await CommunityService.getUserByUsername(username);
        setUser(userResponse.user);
        
        // Get actual step data for this user
        const stepResponse = await StepService.getStepsForUser(username);
        setStepData(stepResponse.steps || {});
        
      } catch (error) {
        console.error('Error loading user profile:', error);
        if (error.message.includes('404') || error.message.includes('not found')) {
          setError('User not found');
        } else {
          setError('Failed to load user profile');
        }
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      loadUserProfile();
    }
  }, [username]);

  // Calculate stats from step data
  useEffect(() => {
    if (stepData && typeof stepData === 'object') {
      const total = Object.values(stepData).reduce((sum, steps) => sum + steps, 0);
      const active = Object.values(stepData).filter(steps => steps > 0).length;
      setTotalSteps(total);
      setActiveDays(active);
    }
  }, [stepData]);

  const activeDaysText = useMemo(() => {
    if (!stepData || typeof stepData !== 'object') return 0;
    return Object.values(stepData).filter(steps => steps > 0).length;
  }, [stepData]);

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
          </div>
        </div>
      </div>
    );
  }

  // Create profile object for the Profile component
  const profileData = {
    name: user.display_name || user.username,
    bio: user.bio || '',
    avatar: user.avatar || ''
  };

  return (
    <div className="container">
      <div className="main-content">
        {error && (
          <div className="px-3 py-2 bg-fithub-bright-red border border-fithub-red rounded text-fithub-white mb-5 text-sm">
            {error}
          </div>
        )}

        {/* Community Profile Header */}
        <div className="mb-4 p-3 bg-fithub-dark-grey border border-fithub-light-grey rounded">
          <div className="flex items-center gap-2 text-fithub-text text-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            <span>Viewing {user.display_name || user.username}'s profile from Community</span>
          </div>
        </div>

        <Profile 
          profile={profileData}
          totalSteps={totalSteps}
          stepData={stepData}
          username={username}
          showInteractiveElements={false}
          onSuccess={() => {}}
        />

        <div className="section">
          <div className="flex justify-between items-center mb-3 max-w-full">
            <h2 className="contribution-title m-0">Step Activity</h2>
            <p className="contribution-subtitle m-0 text-fithub-white text-sm hidden md:block">
              {activeDays} active days in the last year
            </p>
            <div className="flex gap-2">
              <div className="relative group">
                <svg 
                  className="w-5 h-5 text-fithub-text hover:text-fithub-white transition-colors"
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <div className="absolute bottom-full right-0 mb-1 px-4 py-2 bg-fithub-dark-grey border border-solid border-fithub-light-grey text-fithub-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-80 z-10">
                  <p className="mb-2">
                    This grid visualizes {user.display_name || user.username}'s activity each day, showing their step data from FitBit and manual entries.
                  </p>
                  <p className="mb-2">
                    The data is synced periodically to keep it up to date.
                  </p>
                  <p>
                    This is a read-only view of their profile.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <ContributionGraph 
            data={stepData}
            isSyncing={false}
          />
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
