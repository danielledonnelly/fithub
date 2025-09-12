import React, { useState, useEffect } from 'react';
import StepService from '../services/StepService';

const Goals = () => {
  const [stepData, setStepData] = useState({});
  const [loading, setLoading] = useState(true);
  const [dailyGoal, setDailyGoal] = useState(10000);
  const [weeklyGoal, setWeeklyGoal] = useState(70000);
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [goalType, setGoalType] = useState('daily'); // daily, weekly, custom

  const fetchStepData = async () => {
    try {
      setLoading(true);
      
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
              // Fitbit is connected, try to get combined data
              const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/fitbit/steps-for-graph`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (response.ok) {
                const result = await response.json();
                setStepData(result.steps);
                console.log('Using combined step data:', result.source);
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
      setStepData(data);
    } catch (error) {
      console.error('Failed to fetch step data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        if (mounted) {
          setLoading(true);
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
                // Fitbit is connected, try to get combined data
                const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/fitbit/steps-for-graph`, {
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
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  const saveGoals = () => {
    localStorage.setItem('fithub_daily_goal', dailyGoal.toString());
    localStorage.setItem('fithub_weekly_goal', weeklyGoal.toString());
    setIsEditingGoals(false);
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

  if (loading) {
    return (
      <div className="container">
        <div className="main-content">
          <div className="text-center py-10 text-fithub-text">
            Loading goals data...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="main-content">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h1 className="contribution-title">Goals</h1>
            <p className="contribution-subtitle">
              Set and track your fitness goals using your step data
            </p>
          </div>
          <button
            onClick={fetchStepData}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-fithub-bright-red rounded-md cursor-pointer hover:bg-fithub-dark-red disabled:opacity-60 disabled:cursor-not-allowed border-0 outline-none"
          >
            {loading ? 'Loading...' : 'Refresh Data'}
          </button>
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
              <div className="text-2xl font-bold text-fithub-bright-red mb-1">
                {currentStreak}
              </div>
              <div className="text-xs text-fithub-text">Day Streak</div>
            </div>
            
            <div className="text-center p-4 bg-fithub-dark-grey border border-fithub-light-grey rounded">
              <div className="text-2xl font-bold text-fithub-bright-red mb-1">
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
              <div className="text-2xl font-bold text-fithub-bright-red mb-1">
                {todayProgress.steps.toLocaleString()}
              </div>
              <div className="text-xs text-fithub-text">Steps Today</div>
            </div>
            
            <div className="text-center p-4 bg-fithub-dark-grey border border-fithub-light-grey rounded">
              <div className={`text-2xl font-bold mb-1 ${todayProgress.progress >= 100 ? 'text-fithub-bright-red' : 'text-fithub-bright-red'}`}>
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
                todayProgress.progress >= 100 ? 'bg-fithub-bright-red' : 'bg-fithub-bright-red'
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
              <div className="text-lg font-semibold text-fithub-bright-red">
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
              <div className="text-lg font-semibold text-fithub-bright-red">
                {weekProgress.goalsMet}/7
              </div>
              <div className="text-xs text-fithub-text">Goals Met</div>
            </div>
            
            <div className="text-center p-3 bg-fithub-dark-grey border border-fithub-light-grey rounded">
              <div className={`text-lg font-semibold ${weekProgress.weeklyProgress >= 100 ? 'text-fithub-bright-red' : 'text-fithub-bright-red'}`}>
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
                      day.goalMet ? 'bg-fithub-bright-red' : 'bg-fithub-bright-red'
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
            <span className="text-fithub-bright-red">■</span> Goal Met ({dailyGoal.toLocaleString()} steps) &nbsp;&nbsp;
            <span className="text-fithub-bright-red">■</span> Below Goal
          </div>
        </div>
      </div>
    </div>
  );
};

export default Goals;