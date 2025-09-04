import React, { useState, useEffect } from 'react';
import StepService from '../services/StepService';

const Goals = () => {
  const [stepData, setStepData] = useState({});
  const [stepDataLoading, setStepDataLoading] = useState(false);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [hasTriedSync, setHasTriedSync] = useState(false);
  
  // Load goals from localStorage with defaults
  const [dailyGoal, setDailyGoal] = useState(() => {
    const saved = localStorage.getItem('fithub_daily_goal');
    return saved ? parseInt(saved) : 10000;
  });
  const [weeklyGoal, setWeeklyGoal] = useState(() => {
    const saved = localStorage.getItem('fithub_weekly_goal');
    return saved ? parseInt(saved) : 70000;
  });

  // Load goals from database on component mount
  useEffect(() => {
    const loadGoalsFromDatabase = async () => {
      const token = localStorage.getItem('fithub_token');
      if (token) {
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const profile = await response.json();
            if (profile.daily_goal) {
              setDailyGoal(profile.daily_goal);
              localStorage.setItem('fithub_daily_goal', profile.daily_goal.toString());
            }
            if (profile.weekly_goal) {
              setWeeklyGoal(profile.weekly_goal);
              localStorage.setItem('fithub_weekly_goal', profile.weekly_goal.toString());
            }
          }
        } catch (error) {
          console.log('Could not load goals from database, using localStorage values');
        }
      }
    };

    loadGoalsFromDatabase();
  }, []);
  const [isEditingGoals, setIsEditingGoals] = useState(false);

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

        // Today's steps will come from the database data loaded above
        // No need for separate API call - the stepData already includes today's steps

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

  const saveGoals = async () => {
    try {
      // Save to localStorage
      localStorage.setItem('fithub_daily_goal', dailyGoal.toString());
      localStorage.setItem('fithub_weekly_goal', weeklyGoal.toString());
      
      // Save to database if user is authenticated
      const token = localStorage.getItem('fithub_token');
      if (token) {
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/profile`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              daily_goal: dailyGoal,
              weekly_goal: weeklyGoal
            })
          });
          
          if (response.ok) {
            console.log('Goals saved to database');
          }
        } catch (dbError) {
          console.log('Could not save goals to database, using localStorage only');
        }
      }
      
      setIsEditingGoals(false);
    } catch (error) {
      console.error('Failed to save goals:', error);
    }
  };

  const getRecentDays = (days) => {
    const result = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const steps = stepData[dateString] || 0;
      const goalMet = steps >= dailyGoal;
      
      result.push({
        date: dateString,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        steps,
        goalMet
      });
    }
    
    return result;
  };

  const getCurrentWeekProgress = () => {
    const recentDays = getRecentDays(7);
    const totalSteps = recentDays.reduce((sum, day) => sum + day.steps, 0);
    const goalsMet = recentDays.filter(day => day.goalMet).length;
    const averageSteps = Math.round(totalSteps / 7);
    const weeklyProgress = Math.round((totalSteps / weeklyGoal) * 100);
    
    return {
      totalSteps,
      averageSteps,
      goalsMet,
      weeklyProgress
    };
  };

  const getTodayProgress = () => {
    const today = new Date().toISOString().split('T')[0];
    const steps = stepData[today] || 0;
    const progress = Math.round((steps / dailyGoal) * 100);
    const remaining = Math.max(0, dailyGoal - steps);
    
    
    return {
      steps,
      progress,
      remaining
    };
  };

  const getGoalStreak = () => {
    const recentDays = getRecentDays(30); // Check last 30 days
    let streak = 0;
    
    for (let i = recentDays.length - 1; i >= 0; i--) {
      if (recentDays[i].goalMet) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const recentDays = getRecentDays(7);
  const weekProgress = getCurrentWeekProgress();
  const todayProgress = getTodayProgress();
  const currentStreak = getGoalStreak();


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

        <div className="flex justify-between items-center mb-5">
          <div>
            <h1 className="contribution-title">Goals</h1>
            <p className="contribution-subtitle">
              Set and track your fitness goals using your step data
            </p>
          </div>
          <div className="flex gap-2">
            {stepDataLoading && (
              <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-fithub-white">
                <div className="w-3 h-3 border border-fithub-white border-t-transparent rounded-full animate-spin"></div>
                Syncing step data...
              </div>
            )}
          </div>
        </div>

        {/* Goal Settings */}
        <div className="contribution-section mb-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="contribution-title m-0">Goal Settings</h2>
            {!isEditingGoals ? (
              <button
                onClick={() => setIsEditingGoals(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-fithub-bright-red rounded-md cursor-pointer hover:bg-fithub-dark-red border-0 outline-none"
              >
                Edit Goals
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={saveGoals}
                  className="px-4 py-2 text-sm font-medium text-white bg-fithub-bright-red rounded-md cursor-pointer border-0 outline-none"
                >
                  Save Goals
                </button>
                <button
                  onClick={() => setIsEditingGoals(false)}
                  className="px-4 py-2 text-sm font-medium text-fithub-text bg-[#21262d] border border-fithub-light-grey rounded cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-fithub-white">
                Daily Goal
              </label>
              {isEditingGoals ? (
                <input
                  type="number"
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm bg-fithub-dark-grey border border-fithub-light-grey rounded text-fithub-text outline-none"
                />
              ) : (
                <div className="px-3 py-2 text-sm text-fithub-text bg-fithub-medium-grey border border-fithub-light-grey rounded">
                  {dailyGoal.toLocaleString()} steps
                </div>
              )}
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-fithub-white">
                Weekly Goal
              </label>
              {isEditingGoals ? (
                <input
                  type="number"
                  value={weeklyGoal}
                  onChange={(e) => setWeeklyGoal(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm bg-fithub-dark-grey border border-fithub-light-grey rounded text-fithub-text outline-none"
                />
              ) : (
                <div className="px-3 py-2 text-sm text-fithub-text bg-fithub-medium-grey border border-fithub-light-grey rounded">
                  {weeklyGoal.toLocaleString()} steps
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Goal Achievement Stats */}
        <div className="contribution-section mb-5">
          <h2 className="contribution-title mb-4">Goal Achievement</h2>
          
          <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4">
            <div className="text-center p-4 bg-fithub-dark-grey border border-fithub-light-grey rounded">
              <div className="text-2xl font-bold text-blue-400 mb-1">
                {currentStreak}
              </div>
              <div className="text-xs text-fithub-text">Day Streak</div>
            </div>
            
            <div className="text-center p-4 bg-fithub-dark-grey border border-fithub-light-grey rounded">
              <div className="text-2xl font-bold text-green-500 mb-1">
                {weekProgress.goalsMet}/7
              </div>
              <div className="text-xs text-fithub-text">Weekly Goals Met</div>
            </div>
            
            <div className="text-center p-4 bg-fithub-dark-grey border border-fithub-light-grey rounded">
              <div className="text-2xl font-bold text-fithub-white mb-1">
                {Math.round((weekProgress.goalsMet / 7) * 100)}%
              </div>
              <div className="text-xs text-fithub-text">Weekly Success Rate</div>
            </div>
          </div>
        </div>

        {/* Today's Progress */}
        <div className="contribution-section mb-5">
          <h2 className="contribution-title mb-4">Today's Progress</h2>
          
          <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4 mb-4">
            <div className="text-center p-4 bg-fithub-dark-grey border border-fithub-light-grey rounded">
              <div className="text-2xl font-bold text-blue-400 mb-1">
                {todayProgress.steps.toLocaleString()}
              </div>
              <div className="text-xs text-fithub-text">Steps Today</div>
            </div>
            
            <div className="text-center p-4 bg-fithub-dark-grey border border-fithub-light-grey rounded">
              <div className={`text-2xl font-bold mb-1 ${todayProgress.progress >= 100 ? 'text-green-500' : 'text-red-500'}`}>
                {todayProgress.progress}%
              </div>
              <div className="text-xs text-fithub-text">Goal Progress</div>
            </div>
            
            <div className="text-center p-4 bg-fithub-dark-grey border border-fithub-light-grey rounded">
              <div className="text-2xl font-bold text-fithub-white mb-1">
                {todayProgress.remaining.toLocaleString()}
              </div>
              <div className="text-xs text-fithub-text">Steps Remaining</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-[#21262d] rounded overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ease-in-out ${
                todayProgress.progress >= 100 ? 'bg-green-500' : 'bg-blue-400'
              }`}
              style={{ width: `${todayProgress.progress}%` }}
            />
          </div>
        </div>

        {/* Weekly Progress */}
        <div className="contribution-section mb-5">
          <h2 className="contribution-title mb-4">This Week's Progress</h2>
          
          <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-3 mb-4">
            <div className="text-center p-3 bg-fithub-dark-grey border border-fithub-light-grey rounded">
              <div className="text-lg font-semibold text-blue-400">
                {weekProgress.totalSteps.toLocaleString()}
              </div>
              <div className="text-xs text-fithub-text">Total Steps</div>
            </div>
            
            <div className="text-center p-3 bg-fithub-dark-grey border border-fithub-light-grey rounded">
              <div className="text-lg font-semibold text-fithub-white">
                {weekProgress.averageSteps.toLocaleString()}
              </div>
              <div className="text-xs text-fithub-text">Daily Average</div>
            </div>
            
            <div className="text-center p-3 bg-fithub-dark-grey border border-fithub-light-grey rounded">
              <div className="text-lg font-semibold text-green-500">
                {weekProgress.goalsMet}/7
              </div>
              <div className="text-xs text-fithub-text">Goals Met</div>
            </div>
            
            <div className="text-center p-3 bg-fithub-dark-grey border border-fithub-light-grey rounded">
              <div className={`text-lg font-semibold ${weekProgress.weeklyProgress >= 100 ? 'text-green-500' : 'text-red-500'}`}>
                {weekProgress.weeklyProgress}%
              </div>
              <div className="text-xs text-fithub-text">Weekly Goal</div>
            </div>
          </div>
        </div>

        {/* Daily Progress Chart */}
        <div className="contribution-section">
          <h2 className="contribution-title mb-4">Daily Progress Chart</h2>
          
          <div className="flex items-end gap-2 h-30 py-4">
            {recentDays.map((day, index) => {
              const heightPercentage = Math.max((day.steps / Math.max(dailyGoal, Math.max(...recentDays.map(d => d.steps)))) * 100, 2);
              
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center">
                  <div 
                    className={`w-full rounded-t min-h-1 relative mb-2 transition-all duration-300 ${
                      day.goalMet ? 'bg-green-500' : 'bg-blue-400'
                    }`}
                    style={{ height: `${heightPercentage}%` }}
                    title={`${day.steps.toLocaleString()} steps`}
                  />
                  <div className="text-xs text-fithub-text text-center">
                    {day.dayName}
                  </div>
                  <div className="text-xs text-fithub-text text-center mt-0.5">
                    {day.steps.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Goal Line Reference */}
          <div className="text-xs text-fithub-text mt-2 text-center">
            <span className="text-green-500">■</span> Goal Met ({dailyGoal.toLocaleString()} steps) &nbsp;&nbsp;
            <span className="text-blue-400">■</span> Below Goal
          </div>
        </div>
      </div>
    </div>
  );
};

export default Goals;