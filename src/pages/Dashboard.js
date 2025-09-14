import React, { useState, useEffect, useMemo } from 'react';
import ContributionGraph from '../components/ContributionGraph';
import Profile from '../components/Profile';
import StepService from '../services/StepService';
import ProfileService from '../services/ProfileService';
import LogStepsForm from '../components/LogStepsForm';
import ScreenshotUpload from '../components/ScreenshotUpload';
// import dummySteps from '../data/dummySteps';

const Dashboard = () => {
  const [stepData, setStepData] = useState({});
  const [fitbitSyncing, setFitbitSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(null);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState({
    name: '',
    bio: '',
    avatar: ''
  });


  // Load profile from database
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileData = await ProfileService.getProfile();
        setProfile(profileData);
      } catch (error) {
        console.error('Error loading profile:', error);
        // Fallback to empty profile with username from auth
        const user = JSON.parse(localStorage.getItem('fithub_user') || '{}');
        setProfile({
          name: user.username || '',
          bio: '',
          avatar: ''
        });
      }
    };

    loadProfile();
  }, []);

  // Refresh profile when component becomes visible (user navigates back from ProfilePage)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const loadProfile = async () => {
          try {
            const profileData = await ProfileService.getProfile();
            setProfile(profileData);
          } catch (error) {
            console.error('Error refreshing profile:', error);
          }
        };
        loadProfile();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Load data from backend API
  useEffect(() => {
    let mounted = true;

    const fetchStepData = async () => {
      try {
        if (mounted) {
          setError(null);
        }
        
        // Try to get combined step data (local + Fitbit) first
        const token = localStorage.getItem('fithub_token');
        if (token) {
          try {
            // First check if Fitbit is connected
            const statusResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/fitbit/status`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (statusResponse.ok) {
              const status = await statusResponse.json();
              if (status.connected) {
                // Fitbit is connected, try to get combined data (this triggers auto-sync)
                const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/fitbit/steps-for-graph`, {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });
                
                if (response.ok) {
                  const result = await response.json();
                  if (mounted) {
                    setStepData(result.steps);
                    setSyncProgress(result.syncProgress);
                    console.log('Dashboard using combined step data:', result.source);
                  }
                  return;
                }
              }
            }
          } catch (fitbitError) {
            console.log('Fitbit data not available, falling back to local data');
          }
        }
        
        // Fallback to local step data
        const data = await StepService.getAllSteps();
        if (mounted) {
          setStepData(data);
        }
      } catch (error) {
        console.error('Failed to fetch step data:', error);
        if (mounted) {
          setError('Failed to load step data. Please make sure the server is running.');
          setStepData({});
        }
      } finally {
        // No longer need to manage loading state
      }
    };

    const refreshStepData = async () => {
      try {
        const token = localStorage.getItem('fithub_token');
        if (token) {
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/fitbit/steps-for-graph`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const result = await response.json();
            if (mounted) {
              setStepData(result.steps);
            }
          }
        }
      } catch (error) {
        // Silent fail for polling
      }
    };

    const checkIfSyncActive = async () => {
      try {
        const token = localStorage.getItem('fithub_token');
        if (token) {
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/fitbit/sync-status`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const result = await response.json();
            return result.syncActive;
          }
        }
      } catch (error) {
        // Silent fail
      }
      return false;
    };

    const startConditionalPolling = async () => {
      const isSyncActive = await checkIfSyncActive();
      
      if (isSyncActive) {
        // Sync is active, start polling
        console.log('Sync detected - starting live updates');
        const pollInterval = setInterval(async () => {
          if (!mounted) return;
          
          await refreshStepData();
          
          // Check if sync is still active
          const stillActive = await checkIfSyncActive();
          if (!stillActive) {
            console.log('Sync completed - stopping live updates');
            clearInterval(pollInterval);
          }
        }, 3000);
      }
    };

    // Initial fetch
    fetchStepData();

    // Check if we need to start polling
    startConditionalPolling();

    // Cleanup function - sets mounted to false when component unmounts
    return () => {
      mounted = false;
    };
  }, []);

  // Poll for sync progress when sync is active
  useEffect(() => {
    let intervalId;
    
    if (syncProgress && syncProgress.status === 'syncing') {
      intervalId = setInterval(async () => {
        try {
          const progressData = await StepService.getSyncProgress();
          if (progressData.isActive) {
            setSyncProgress(progressData.progress);
            
            // Refresh step data every poll to show live updates
            const token = localStorage.getItem('fithub_token');
            if (token) {
              const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/fitbit/steps-for-graph`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (response.ok) {
                const result = await response.json();
                setStepData(result.steps);
              }
            }
          } else {
            // Sync completed, refresh data one final time
            const token = localStorage.getItem('fithub_token');
            if (token) {
              const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/fitbit/steps-for-graph`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (response.ok) {
                const result = await response.json();
                setStepData(result.steps);
                setSyncProgress(null);
              }
            }
            clearInterval(intervalId);
          }
        } catch (error) {
          console.error('Error polling sync progress:', error);
        }
      }, 2000); // Poll every 2 seconds for live updates
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [syncProgress]);

  const handleDayClick = async (date, steps) => {
    try {
      const newSteps = steps === 0 ? 1500 : (steps >= 7500 ? 0 : steps + 1500);

      // Optimistically update UI
      const updatedData = {
        ...stepData,
        [date]: newSteps
      };
      setStepData(updatedData);

      // Update backend
      await StepService.updateSteps(date, newSteps);
    } catch (error) {
      console.error('Failed to update step data:', error);
      // Revert optimistic update on error
      const revertedData = { ...stepData };
      setStepData(revertedData);
      setError('Failed to update step data. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleRegenerateData = async () => {
    try {
      setError(null);

      // First regenerate the data on the backend
      await StepService.regenerateStepData();

      // Then fetch the new data
      const newData = await StepService.getAllSteps();
      setStepData(newData);
    } catch (error) {
      console.error('Failed to regenerate step data:', error);
      setError('Failed to regenerate step data. Please try again.');
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
        setError('Fitbit disconnected successfully!');
        setTimeout(() => setError(null), 5000);
        
        // Refresh the step data to remove Fitbit data
        const data = await StepService.getAllSteps();
        setStepData(data);
      } else {
        const error = await response.json();
        setError(`Failed to disconnect: ${error.message}`);
        setTimeout(() => setError(null), 5000);
      }
    } catch (error) {
      console.error('Failed to disconnect Fitbit:', error);
      setError('Failed to disconnect Fitbit. Please try again.');
      setTimeout(() => setError(null), 5000);
    }
  };

  const [totalSteps, setTotalSteps] = useState(0);

  const [activeDays, setActiveDays] = useState(0);

  // Fetch total steps from database (same calculation as weekly/monthly)
  useEffect(() => {
    const fetchTotalSteps = async () => {
      try {
        const token = localStorage.getItem('fithub_token');
        if (!token) return;

        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/steps/total-stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const stats = await response.json();
          setTotalSteps(stats.totalSteps || 0);
          setActiveDays(stats.activeDays || 0);
        }
      } catch (error) {
        console.error('Error fetching total stats:', error);
      }
    };

    fetchTotalSteps();
  }, [stepData]); // Re-fetch when step data changes

  const activeDaysText = useMemo(() => {
    if (!stepData || typeof stepData !== 'object') return 0;
    return Object.values(stepData).filter(steps => steps > 0).length;
  }, [stepData]);

  return (
    <div className="container">
      <div className="main-content">
        {error && (
          <div className="px-3 py-2 bg-fithub-bright-red border border-fithub-red rounded text-fithub-white mb-5 text-sm">
            {error}
          </div>
        )}

        {syncProgress && syncProgress.status === 'syncing' && (
          <div className="px-3 py-2 bg-fithub-orange border border-fithub-peach rounded text-fithub-white mb-5 text-sm">
            <div className="flex items-center justify-between">
              <span>
                Syncing Fitbit data... {syncProgress.completed}/{syncProgress.total} days
              </span>
              <div className="w-4 h-4 border-2 border-fithub-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="w-full bg-fithub-bright-red rounded-full h-2 mt-2">
              <div 
                className="bg-fithub-white h-2 rounded-full transition-all duration-300" 
                style={{ width: `${(syncProgress.completed / syncProgress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {syncProgress && syncProgress.status === 'rate_limited' && (
          <div className="px-3 py-2 bg-fithub-dark-red border border-fithub-red rounded text-fithub-white mb-5 text-sm">
            <div className="flex items-center justify-between">
              <span>
                Rate limited by Fitbit API. Sync will resume in {Math.ceil((syncProgress.cooldownUntil - Date.now()) / (60 * 1000))} minutes.
                {syncProgress.reason && ` (${syncProgress.reason})`}
              </span>
              <div className="w-4 h-4 border-2 border-fithub-white border-t-transparent rounded-full animate-spin ml-2"></div>
            </div>
          </div>
        )}

        <Profile 
          profile={profile}
          currentStreak={0}
          totalSteps={totalSteps}
          onSuccess={() => window.location.reload()}
          stepData={stepData}
        />

        
        <div className="contribution-section">
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
                    This grid visualizes your activity each day, adding together steps you sync from FitBit with any steps you manually enter. 
                  </p>
                  <p className="mb-2">
                    The dashboard will start by syncing your year-to-date step data, and then periodically update as needed.
                  </p>
                  <p>
                    Use the buttons at the bottom of the screen to adjust step scoring to match your lifestyle.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <ContributionGraph 
            data={stepData}
            isSyncing={fitbitSyncing}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;