import React, { useState, useEffect } from 'react';
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
            const statusResponse = await fetch('http://localhost:5001/api/fitbit/status', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (statusResponse.ok) {
              const status = await statusResponse.json();
              if (status.connected) {
                // Fitbit is connected, try to get combined data
                const response = await fetch('http://localhost:5001/api/fitbit/steps-for-graph', {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });
                
                if (response.ok) {
                  const result = await response.json();
                  if (mounted) {
                    setStepData(result.steps);
                    console.log('Using combined step data:', result.source);
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

    fetchStepData();

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
      setLoading(true);
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
        fetch('http://localhost:5001/api/fitbit/sync', {
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
        const dataResponse = await fetch('http://localhost:5001/api/fitbit/steps-for-graph', {
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
      setLoading(false);
    }
  };

  const handleDisconnectFitbit = async () => {
    try {
      const token = localStorage.getItem('fithub_token');
      const response = await fetch('http://localhost:5001/api/fitbit/disconnect', {
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

  const calculateTotalSteps = () => {
    if (!stepData || typeof stepData !== 'object') return 0;
    return Object.values(stepData).reduce((sum, steps) => sum + steps, 0);
  };



  const calculateActiveDays = () => {
    if (!stepData || typeof stepData !== 'object') return 0;
    return Object.values(stepData).filter(steps => steps > 0).length;
  };



  if (loading) {
    return (
      <div className="container">
        <div className="main-content">
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '200px',
            fontSize: '16px',
            color: '#c9d1d9'
          }}>
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
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#da3633',
            border: '1px solid #f85149',
            borderRadius: '6px',
            color: '#ffffff',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <Profile 
          profile={profile}
          totalWorkouts={calculateActiveDays()}
          currentStreak={0}
          totalSteps={calculateTotalSteps()}
          onSuccess={() => window.location.reload()}
        />


        
        <div className="contribution-section">
          <div style={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            maxWidth: '100%'
          }}>
            <h2 className="contribution-title" style={{ margin: 0 }}>Step Activity</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleRefreshFitbitData}
                disabled={loading}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: '#ffffff',
                  backgroundColor: '#00A085',
                  border: '1px solid #00A085',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  transition: 'all 0.2s'
                }}
              >
                {loading ? 'Syncing...' : 'Sync Fitbit'}
              </button>
            </div>
          </div>
          <p className="contribution-subtitle" style={{ maxWidth: '100%' }}>
            {calculateActiveDays()} active days in the last year
          </p>
          
          <ContributionGraph 
            data={stepData}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;