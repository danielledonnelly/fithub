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
  const [stepDataLoading, setStepDataLoading] = useState(false);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [hasTriedSync, setHasTriedSync] = useState(false);
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
      } finally {
        // Dashboard is ready to show once profile is loaded
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Check if rate limit has expired
  useEffect(() => {
    if (rateLimited && syncStatus && syncStatus.message && syncStatus.message.includes('Rate limit timeout')) {
      // Extract the next attempt time from the message
      const match = syncStatus.message.match(/Next sync in (\d+) minutes/);
      if (match) {
        const minutes = parseInt(match[1]);
        console.log(`Rate limit expires in ${minutes} minutes`);
        // Reset rate limit state after the timeout period
        setTimeout(() => {
          setRateLimited(false);
          console.log('Rate limit expired - auto-sync will be available again');
        }, minutes * 60 * 1000);
      }
    }
  }, [rateLimited, syncStatus]);

  // Load existing data first, then auto-sync in background
  useEffect(() => {
    let mounted = true;

    const loadDataAndSync = async () => {
      try {
        if (mounted) {
          setStepDataLoading(true);
          setError(null);
        }
        
        const token = localStorage.getItem('fithub_token');
        if (!token) {
          // No token, just load local data
          const data = await StepService.getAllSteps();
          if (mounted) {
            setStepData(data);
            setStepDataLoading(false);
          }
          return;
        }

        // First, load existing data immediately
        try {
          const existingDataResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/steps`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (existingDataResponse.ok) {
            const existingData = await existingDataResponse.json();
            if (mounted) {
              setStepData(existingData);
              setStepDataLoading(false); // Show existing data immediately
            }
          }
        } catch (existingDataError) {
          console.log('Could not load existing data, falling back to local');
          const data = await StepService.getAllSteps();
          if (mounted) {
            setStepData(data);
            setStepDataLoading(false);
          }
        }

        // Then try auto-sync in background (if not already tried or rate limited)
        if (!hasTriedSync && !rateLimited) {
          setHasTriedSync(true);
          console.log('Starting background auto-sync...');
          
          try {
            const autoSyncResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/fitbit/auto-sync`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (autoSyncResponse.ok) {
              const autoSyncResult = await autoSyncResponse.json();
              if (mounted) {
                setSyncStatus(autoSyncResult);
                
                // Check if we're rate limited
                if (autoSyncResult.rateLimitHit || (autoSyncResult.message && autoSyncResult.message.includes('Rate limit timeout'))) {
                  console.log('Rate limited - stopping auto-sync attempts');
                  setRateLimited(true);
                  return;
                }
                
                if (autoSyncResult.synced) {
                  console.log('Auto-sync completed:', autoSyncResult.message);
                  // Update the step data with new data
                  setStepData(autoSyncResult.steps);
                } else {
                  console.log('Auto-sync status:', autoSyncResult.message);
                  // Even if no sync happened, update with current data
                  if (autoSyncResult.steps) {
                    setStepData(autoSyncResult.steps);
                  }
                }
              }
            }
          } catch (autoSyncError) {
            console.log('Auto-sync not available');
          }
        }
      } catch (error) {
        console.error('Error in loadDataAndSync:', error);
        if (mounted) {
          setError('Failed to load step data');
          setStepDataLoading(false);
        }
      }
    };

    loadDataAndSync();

    // Cleanup function - sets mounted to false when component unmounts
    return () => {
      mounted = false;
    };
  }, [hasTriedSync, rateLimited]);

  const handleResetRateLimit = () => {
    setRateLimited(false);
    setSyncStatus(null);
    setHasTriedSync(false);
    console.log('Rate limit manually reset - auto-sync will be available again');
  };

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

        {syncStatus && syncStatus.rateLimitHit && (
          <div className="px-3 py-2 bg-yellow-600 border border-yellow-400 rounded text-white mb-5 text-sm flex justify-between items-center">
            <span>Auto-sync paused: {syncStatus.message}</span>
            <button 
              onClick={handleResetRateLimit}
              className="ml-2 px-2 py-1 bg-yellow-700 hover:bg-yellow-800 rounded text-xs"
            >
              Reset
            </button>
          </div>
        )}

        {syncStatus && syncStatus.synced && !syncStatus.rateLimitHit && (
          <div className="px-3 py-2 bg-green-600 border border-green-400 rounded text-white mb-5 text-sm">
            Auto-sync complete: {syncStatus.message}
          </div>
        )}

        {syncStatus && !syncStatus.synced && !syncStatus.rateLimitHit && (
          <div className="px-3 py-2 bg-blue-600 border border-blue-400 rounded text-white mb-5 text-sm">
            Background sync in progress: {syncStatus.message}
          </div>
        )}

        <Profile 
          profile={profile}
          totalWorkouts={activeDays}
          currentStreak={0}
          totalSteps={totalSteps}
          onSuccess={() => window.location.reload()}
        />


        
        <div className="contribution-section">
          <div className="flex justify-between items-center mb-3 max-w-full">
            <h2 className="contribution-title m-0">Step Activity</h2>
            <p className="contribution-subtitle m-0 text-fithub-white text-sm">
              {activeDays} active days in the last year
            </p>
            <div className="flex gap-2">
              {stepDataLoading && (
                <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-fithub-white">
                  <div className="w-3 h-3 border border-fithub-white border-t-transparent rounded-full animate-spin"></div>
                  Syncing step data...
                </div>
              )}
            </div>
          </div>
          
          <ContributionGraph 
            data={stepData}
            isSyncing={stepDataLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;