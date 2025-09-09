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
  const [loading, setLoading] = useState(true);
  const [fitbitSyncing, setFitbitSyncing] = useState(false);
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

  // Load data from backend API
  useEffect(() => {
    let mounted = true;

    const fetchStepData = async () => {
      try {
        if (mounted) {
          setLoading(true);
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
        if (mounted) {
          setLoading(false);
        }
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
        }, 5000);
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
      setLoading(true);
      setError(null);

      // First regenerate the data on the backend
      await StepService.regenerateStepData();

      // Then fetch the new data
      const newData = await StepService.getAllSteps();
      setStepData(newData);
    } catch (error) {
      console.error('Failed to regenerate step data:', error);
      setError('Failed to regenerate step data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshFitbitData = async () => {
    try {
      setFitbitSyncing(true);
      setError(null);
      
      const token = localStorage.getItem('fithub_token');
      if (!token) {
        setError('Please log in to sync Fitbit data');
        return;
      }
      
      // Add timeout to prevent stuck loading state
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 30000); // 30 second timeout
      });
      
      // Just try to sync directly - if it fails, the backend will tell us why
      const response = await Promise.race([
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/fitbit/sync`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        timeoutPromise
      ]);
      
      if (response.ok) {
        const result = await response.json();
        setError(`Fitbit sync successful! Synced ${result.stepsSynced} days of step data.`);
        setTimeout(() => setError(null), 5000);
        
        // Refresh the step data
        const dataResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/fitbit/steps-for-graph`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (dataResponse.ok) {
          const dataResult = await dataResponse.json();
          setStepData(dataResult.steps);
        }
      } else {
        const error = await response.json();
        if (response.status === 429) {
          setError(`Rate limited: ${error.message}`);
        } else {
          setError(`Fitbit sync failed: ${error.message}`);
        }
        setTimeout(() => setError(null), 5000);
      }
    } catch (error) {
      console.error('Failed to sync Fitbit data:', error);
      setError('Failed to sync Fitbit data. Please try again.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setFitbitSyncing(false);
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

  const totalSteps = useMemo(() => {
    if (!stepData || typeof stepData !== 'object') return 0;
    return Object.values(stepData).reduce((sum, steps) => sum + steps, 0);
  }, [stepData]);

  const activeDays = useMemo(() => {
    if (!stepData || typeof stepData !== 'object') return 0;
    return Object.values(stepData).filter(steps => steps > 0).length;
  }, [stepData]);

  if (loading) {
    return (
      <div className="container">
        <div className="main-content">
          <div className="flex justify-center items-center h-50 text-base text-c9d1d9">
            Loading step data...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="main-content">
        {error && (
          <div className="px-3 py-2 bg-red-600 border border-red-400 rounded text-white mb-5 text-sm">
            {error}
          </div>
        )}

        <Profile 
          profile={profile}
          currentStreak={0}
          totalSteps={totalSteps}
          onSuccess={() => window.location.reload()}
        />

        
        <div className="contribution-section">
          <div className="flex justify-between items-center mb-3 max-w-full">
            <h2 className="contribution-title m-0">Step Activity</h2>
            <p className="contribution-subtitle m-0 text-fithub-white text-sm hidden md:block">
              {activeDays} active days in the last year
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleRefreshFitbitData}
                disabled={fitbitSyncing}
                className="px-3 py-1.5 text-xs font-medium text-white bg-fithub-bright-red rounded cursor-pointer hover:bg-fithub-dark-red disabled:opacity-60 disabled:cursor-not-allowed border-0 outline-none flex items-center gap-2"
              >
                {fitbitSyncing && (
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {fitbitSyncing ? 'Syncing...' : 'Sync Fitbit'}
              </button>
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