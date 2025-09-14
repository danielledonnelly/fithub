import React, { useState, useEffect, useMemo } from 'react';
import StepService from '../services/StepService';
import GoalService from '../services/GoalService';

const Goals = () => {
  const [stepData, setStepData] = useState({});
  const [loading, setLoading] = useState(true);
  const [dailyGoal, setDailyGoal] = useState(10000);
  const [weeklyGoal, setWeeklyGoal] = useState(70000);
  const [monthlyGoal, setMonthlyGoal] = useState(280000);
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [goalType, setGoalType] = useState('daily'); // daily, weekly, custom
  const [stepStats, setStepStats] = useState({
    weeklySteps: 0,
    monthlySteps: 0
  });

  const fetchStepStats = async () => {
    try {
      const token = localStorage.getItem('fithub_token');
      if (token) {
        // Fetch weekly and monthly stats from the backend
        const statsResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/steps/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (statsResponse.ok) {
          const stats = await statsResponse.json();
          setStepStats(stats);
        }
      }
    } catch (error) {
      console.error('Failed to fetch step stats:', error);
    }
  };

  const fetchGoals = async () => {
    try {
      const goals = await GoalService.getGoals();
      
      // Use the actual values from the database, with fallbacks for null values
      setDailyGoal(goals.daily_goal ?? 10000);
      setWeeklyGoal(goals.weekly_goal ?? 70000);
      setMonthlyGoal(goals.monthly_goal ?? 280000);
    } catch (error) {
      console.error('Failed to fetch goals:', error);
      // Fall back to localStorage if backend fails
      const savedDailyGoal = localStorage.getItem('fithub_daily_goal');
      const savedWeeklyGoal = localStorage.getItem('fithub_weekly_goal');
      const savedMonthlyGoal = localStorage.getItem('fithub_monthly_goal');
      if (savedDailyGoal) setDailyGoal(parseInt(savedDailyGoal));
      if (savedWeeklyGoal) setWeeklyGoal(parseInt(savedWeeklyGoal));
      if (savedMonthlyGoal) setMonthlyGoal(parseInt(savedMonthlyGoal));
    }
  };

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
                  
                  // Fetch weekly/monthly stats
                  await fetchStepStats();
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
      
      // Fetch weekly/monthly stats
      await fetchStepStats();
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
                  
                  // Fetch weekly/monthly stats and goals in parallel
                  if (mounted) {
                    await Promise.all([fetchStepStats(), fetchGoals()]);
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
        
        // Fetch weekly/monthly stats and goals in parallel
        if (mounted) {
          await Promise.all([fetchStepStats(), fetchGoals()]);
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

  const saveGoals = async () => {
    try {
      await GoalService.updateGoals({
        daily_goal: dailyGoal,
        weekly_goal: weeklyGoal,
        monthly_goal: monthlyGoal
      });
      setIsEditingGoals(false);
    } catch (error) {
      console.error('Failed to save goals:', error);
      // Fall back to localStorage if backend fails
      localStorage.setItem('fithub_daily_goal', dailyGoal.toString());
      localStorage.setItem('fithub_weekly_goal', weeklyGoal.toString());
      localStorage.setItem('fithub_monthly_goal', monthlyGoal.toString());
      setIsEditingGoals(false);
    }
  };

  const getRecentDays = (days) => {
    const result = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = formatDateLocal(date);
      const steps = normalizedStepData[dateString] || 0;
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
    // Use the weekly steps from the backend stats
    const totalSteps = stepStats.weeklySteps || 0;
    const goalsMet = getRecentDays(7).filter(day => day.goalMet).length;
    const averageSteps = Math.round(totalSteps / 7);
    const weeklyProgress = Math.round((totalSteps / weeklyGoal) * 100);
    
    return {
      totalSteps,
      averageSteps,
      goalsMet,
      weeklyProgress
    };
  };

  // Helper to format a Date object as YYYY-MM-DD in local time (same as ContributionGraph)
  const formatDateLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Normalize stepData the same way ContributionGraph does
  const normalizedStepData = useMemo(() => {
    const result = {};
    if (stepData && typeof stepData === 'object') {
      Object.keys(stepData).forEach(key => {
        try {
          // Parse the date key and convert to YYYY-MM-DD format using local time
          const date = new Date(key);
          if (!isNaN(date.getTime())) {
            const dateString = formatDateLocal(date);
            result[dateString] = stepData[key];
          }
        } catch (e) {
          // If key is already in YYYY-MM-DD format, use it as is
          if (key.match(/^\d{4}-\d{2}-\d{2}$/)) {
            result[key] = stepData[key];
          }
        }
      });
    }
    return result;
  }, [stepData]);

  const getTodayProgress = () => {
    // Calculate today's steps from normalized stepData (same as contribution graph)
    const today = formatDateLocal(new Date());
    const steps = normalizedStepData[today] || 0;
    const progress = Math.round((steps / dailyGoal) * 100);
    const remaining = Math.max(0, dailyGoal - steps);
    
    // Debug logging
    console.log('Daily Progress Debug:', {
      today,
      steps,
      stepDataKeys: Object.keys(stepData).slice(0, 5), // Show first 5 keys
      normalizedKeys: Object.keys(normalizedStepData).slice(0, 5), // Show first 5 normalized keys
      dailyGoal,
      progress
    });
    
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

  const getDailyStreak = () => {
    // Calculate how many consecutive days the user met their daily goal
    const recentDays = getRecentDays(365); // Check last year for accuracy
    let streak = 0;
    
    // Start from today and work backwards
    for (let i = recentDays.length - 1; i >= 0; i--) {
      if (recentDays[i].goalMet) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const getWeeklyStreak = () => {
    // Calculate how many consecutive weeks the user met their weekly goal
    const recentDays = getRecentDays(365); // Check last year
    let streak = 0;
    
    // Group days into weeks and check if each week met the goal
    const weeks = [];
    for (let i = 0; i < recentDays.length; i += 7) {
      const weekDays = recentDays.slice(i, i + 7);
      const weekTotal = weekDays.reduce((sum, day) => sum + day.steps, 0);
      weeks.push({
        weekTotal,
        goalMet: weekTotal >= weeklyGoal
      });
    }
    
    // Count consecutive weeks from most recent
    for (let i = weeks.length - 1; i >= 0; i--) {
      if (weeks[i].goalMet) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const getMonthlyStreak = () => {
    // Calculate how many consecutive months the user met their monthly goal
    const recentDays = getRecentDays(365); // Check last year
    let streak = 0;
    
    // Group days into months and check if each month met the goal
    const months = {};
    recentDays.forEach(day => {
      const monthKey = day.date.substring(0, 7); // YYYY-MM
      if (!months[monthKey]) {
        months[monthKey] = { totalSteps: 0, goalMet: false };
      }
      months[monthKey].totalSteps += day.steps;
    });
    
    // Mark months that met the goal
    Object.keys(months).forEach(monthKey => {
      months[monthKey].goalMet = months[monthKey].totalSteps >= monthlyGoal;
    });
    
    // Sort months by date and count consecutive from most recent
    const sortedMonths = Object.keys(months).sort().reverse();
    for (const monthKey of sortedMonths) {
      if (months[monthKey].goalMet) {
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
  const dailyStreak = getDailyStreak();
  const weeklyStreak = getWeeklyStreak();
  const monthlyStreak = getMonthlyStreak();


  return (
    <div className="container">
      <div className="main-content">
        <div className="flex justify-between items-center mb-1 page-header">
          <div>
            <h1 className="page-title">Goals</h1>
            <p className="contribution-subtitle">
              Set and track your fitness goals using your step data
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="section mb-5">
          <div className="flex justify-between items-center mb-6">
            <h2 className="section-title m-0">Progress</h2>
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

          <div className="space-y-4">
            {/* Daily Goal */}
            <div className="px-4 py-4 border border-solid border-fithub-light-grey rounded-lg bg-fithub-medium-grey">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-base text-fithub-white m-0">Daily Goal</h4>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-fithub-text">
                    {dailyStreak} day streak
                  </div>
                  {isEditingGoals ? (
                    <input
                      type="number"
                      value={dailyGoal}
                      onChange={(e) => setDailyGoal(parseInt(e.target.value) || 0)}
                      className="w-24 px-3 py-2 text-sm bg-fithub-dark-grey border border-solid border-fithub-light-grey rounded-md text-fithub-text outline-none focus:outline-none focus:ring-0 focus:border-fithub-peach transition-colors text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  ) : (
                    <div className="text-lg font-semibold text-fithub-white">
                      {dailyGoal.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Daily Progress Bar */}
              <div className="w-full h-3 bg-fithub-dark-grey rounded-full overflow-hidden">
                <div 
                  className="h-full bg-fithub-bright-red transition-all duration-300 ease-in-out"
                  style={{ width: `${Math.min(todayProgress.progress, 100)}%` }}
                />
              </div>
              <div className="text-xs text-fithub-text mt-2">
                {Number(todayProgress.steps).toLocaleString()} / {Number(dailyGoal).toLocaleString()} steps ({todayProgress.progress}%)
              </div>
            </div>

            {/* Weekly Goal */}
            <div className="px-4 py-4 border border-solid border-fithub-light-grey rounded-lg bg-fithub-medium-grey">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-base text-fithub-white m-0">Weekly Goal</h4>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-fithub-text">
                    {weeklyStreak} week streak
                  </div>
                  {isEditingGoals ? (
                    <input
                      type="number"
                      value={weeklyGoal}
                      onChange={(e) => setWeeklyGoal(parseInt(e.target.value) || 0)}
                      className="w-24 px-3 py-2 text-sm bg-fithub-dark-grey border border-solid border-fithub-light-grey rounded-md text-fithub-text outline-none focus:outline-none focus:ring-0 focus:border-fithub-peach transition-colors text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  ) : (
                    <div className="text-lg font-semibold text-fithub-white">
                      {weeklyGoal.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Weekly Progress Bar */}
              <div className="w-full h-3 bg-fithub-dark-grey rounded-full overflow-hidden">
                <div 
                  className="h-full bg-fithub-bright-red transition-all duration-300 ease-in-out"
                  style={{ width: `${Math.min(weekProgress.weeklyProgress, 100)}%` }}
                />
              </div>
              <div className="text-xs text-fithub-text mt-2">
                {Number(weekProgress.totalSteps || 0).toLocaleString()} / {Number(weeklyGoal).toLocaleString()} steps ({weekProgress.weeklyProgress}%)
              </div>
            </div>

              {/* Monthly Goal */}
              <div className="px-4 py-4 border border-solid border-fithub-light-grey rounded-lg bg-fithub-medium-grey">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base text-fithub-white m-0">Monthly Goal</h4>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-fithub-text">
                      {monthlyStreak} month streak
                    </div>
                    {isEditingGoals ? (
                      <input
                        type="number"
                        value={monthlyGoal}
                        onChange={(e) => setMonthlyGoal(parseInt(e.target.value) || 0)}
                        className="w-24 px-3 py-2 text-sm bg-fithub-dark-grey border border-solid border-fithub-light-grey rounded-md text-fithub-text outline-none focus:outline-none focus:ring-0 focus:border-fithub-peach transition-colors text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    ) : (
                      <div className="text-lg font-semibold text-fithub-white">
                        {monthlyGoal.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Monthly Progress Bar */}
                <div className="w-full h-3 bg-fithub-dark-grey rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-fithub-bright-red transition-all duration-300 ease-in-out"
                    style={{ width: `${Math.min((stepStats.monthlySteps || 0) / monthlyGoal * 100, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-fithub-text mt-2">
                  {Number(stepStats.monthlySteps || 0).toLocaleString()} / {Number(monthlyGoal).toLocaleString()} steps ({Math.round((stepStats.monthlySteps || 0) / monthlyGoal * 100)}%)
                </div>
              </div>
          </div>
        </div>


      </div>
    </div>
  );
};

export default Goals;