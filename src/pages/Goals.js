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
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    loadGoals();
    
    return () => {
      mounted = false;
    };
  }, []);

  const loadGoals = () => {
    const savedDailyGoal = localStorage.getItem('fithub_daily_goal');
    const savedWeeklyGoal = localStorage.getItem('fithub_weekly_goal');
    
    if (savedDailyGoal) setDailyGoal(parseInt(savedDailyGoal));
    if (savedWeeklyGoal) setWeeklyGoal(parseInt(savedWeeklyGoal));
  };

  const saveGoals = () => {
    localStorage.setItem('fithub_daily_goal', dailyGoal.toString());
    localStorage.setItem('fithub_weekly_goal', weeklyGoal.toString());
    setIsEditingGoals(false);
  };

  const getRecentDays = (days = 7) => {
    const result = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const steps = stepData[dateString] || 0;
      
      result.push({
        date: dateString,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        steps,
        goalMet: steps >= dailyGoal
      });
    }
    
    return result;
  };

  const getCurrentWeekProgress = () => {
    const recentDays = getRecentDays(7);
    const totalSteps = recentDays.reduce((sum, day) => sum + day.steps, 0);
    const averageSteps = Math.round(totalSteps / 7);
    const goalsMet = recentDays.filter(day => day.goalMet).length;
    
    return {
      totalSteps,
      averageSteps,
      goalsMet,
      weeklyProgress: Math.round((totalSteps / weeklyGoal) * 100)
    };
  };



  const getTodayProgress = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaySteps = stepData[today] || 0;
    const progress = Math.round((todaySteps / dailyGoal) * 100);
    
    return {
      steps: todaySteps,
      progress: Math.min(progress, 100),
      remaining: Math.max(dailyGoal - todaySteps, 0)
    };
  };

  const getGoalStreak = () => {
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const steps = stepData[dateString] || 0;
      
      if (steps >= dailyGoal) {
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
          <div style={{ textAlign: 'center', padding: '40px', color: '#c9d1d9' }}>
            Loading goals data...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 className="contribution-title">Goals</h1>
            <p className="contribution-subtitle">
              Set and track your fitness goals using your step data
            </p>
          </div>
          <button
            onClick={fetchStepData}
            disabled={loading}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#ffffff',
              backgroundColor: '#00A085',
              border: '1px solid #00A085',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#00A085';
                e.target.style.borderColor = '#00A085';
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#00A085';
                e.target.style.borderColor = '#00A085';
              }
            }}
          >
            {loading ? 'Loading...' : 'Refresh Data'}
          </button>
        </div>

        {/* Goal Settings */}
        <div className="contribution-section" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 className="contribution-title" style={{ margin: 0 }}>Goal Settings</h2>
            {!isEditingGoals ? (
              <button
                onClick={() => setIsEditingGoals(true)}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#ffffff',
                  backgroundColor: '#BB1F21',
                  border: '1px solid #BB1F21',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#921E21';
                  e.target.style.borderColor = '#921E21';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#BB1F21';
                  e.target.style.borderColor = '#BB1F21';
                }}
              >
                Edit Goals
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={saveGoals}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#ffffff',
                    backgroundColor: '#BB1F21',
                    border: '1px solid #BB1F21',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Save Goals
                </button>
                <button
                  onClick={() => setIsEditingGoals(false)}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#c9d1d9',
                    backgroundColor: '#21262d',
                    border: '1px solid #30363d',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#f0f6fc' 
              }}>
                Daily Goal
              </label>
              {isEditingGoals ? (
                <input
                  type="number"
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(parseInt(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '14px',
                    backgroundColor: '#0d1117',
                    border: '1px solid #30363d',
                    borderRadius: '6px',
                    color: '#c9d1d9',
                    outline: 'none'
                  }}
                />
              ) : (
                <div style={{ 
                  padding: '8px 12px', 
                  fontSize: '14px', 
                  color: '#c9d1d9',
                  backgroundColor: '#161b22',
                  border: '1px solid #30363d',
                  borderRadius: '6px'
                }}>
                  {dailyGoal.toLocaleString()} steps
                </div>
              )}
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#f0f6fc' 
              }}>
                Weekly Goal
              </label>
              {isEditingGoals ? (
                <input
                  type="number"
                  value={weeklyGoal}
                  onChange={(e) => setWeeklyGoal(parseInt(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '14px',
                    backgroundColor: '#0d1117',
                    border: '1px solid #30363d',
                    borderRadius: '6px',
                    color: '#c9d1d9',
                    outline: 'none'
                  }}
                />
              ) : (
                <div style={{ 
                  padding: '8px 12px', 
                  fontSize: '14px', 
                  color: '#c9d1d9',
                  backgroundColor: '#161b22',
                  border: '1px solid #30363d',
                  borderRadius: '6px'
                }}>
                  {weeklyGoal.toLocaleString()} steps
                </div>
              )}
            </div>

            
          </div>
        </div>

        {/* Goal Achievement Stats */}
        <div className="contribution-section" style={{ marginBottom: '20px' }}>
          <h2 className="contribution-title" style={{ margin: '0 0 16px 0' }}>Goal Achievement</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '6px' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#58a6ff', marginBottom: '4px' }}>
                {currentStreak}
              </div>
              <div style={{ fontSize: '12px', color: '#8b949e' }}>Day Streak</div>
            </div>
            
            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '6px' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#238636', marginBottom: '4px' }}>
                {weekProgress.goalsMet}/7
              </div>
              <div style={{ fontSize: '12px', color: '#8b949e' }}>Weekly Goals Met</div>
            </div>
            
            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '6px' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#f0f6fc', marginBottom: '4px' }}>
                {Math.round((weekProgress.goalsMet / 7) * 100)}%
              </div>
              <div style={{ fontSize: '12px', color: '#8b949e' }}>Weekly Success Rate</div>
            </div>
          </div>
        </div>

        {/* Today's Progress */}
        <div className="contribution-section" style={{ marginBottom: '20px' }}>
          <h2 className="contribution-title" style={{ margin: '0 0 16px 0' }}>Today's Progress</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '6px' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#58a6ff', marginBottom: '4px' }}>
                {todayProgress.steps.toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', color: '#8b949e' }}>Steps Today</div>
            </div>
            
            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '6px' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: todayProgress.progress >= 100 ? '#238636' : '#f85149', marginBottom: '4px' }}>
                {todayProgress.progress}%
              </div>
              <div style={{ fontSize: '12px', color: '#8b949e' }}>Goal Progress</div>
            </div>
            
            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '6px' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#f0f6fc', marginBottom: '4px' }}>
                {todayProgress.remaining.toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', color: '#8b949e' }}>Steps Remaining</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ 
            width: '100%', 
            height: '8px', 
            backgroundColor: '#21262d', 
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div 
              style={{ 
                width: `${todayProgress.progress}%`, 
                height: '100%', 
                backgroundColor: todayProgress.progress >= 100 ? '#238636' : '#58a6ff',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>

        {/* Weekly Progress */}
        <div className="contribution-section" style={{ marginBottom: '20px' }}>
          <h2 className="contribution-title" style={{ margin: '0 0 16px 0' }}>This Week's Progress</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '6px' }}>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#58a6ff' }}>
                {weekProgress.totalSteps.toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', color: '#8b949e' }}>Total Steps</div>
            </div>
            
            <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '6px' }}>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#f0f6fc' }}>
                {weekProgress.averageSteps.toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', color: '#8b949e' }}>Daily Average</div>
            </div>
            
            <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '6px' }}>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#238636' }}>
                {weekProgress.goalsMet}/7
              </div>
              <div style={{ fontSize: '12px', color: '#8b949e' }}>Goals Met</div>
            </div>
            
            <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '6px' }}>
              <div style={{ fontSize: '18px', fontWeight: '600', color: weekProgress.weeklyProgress >= 100 ? '#238636' : '#f85149' }}>
                {weekProgress.weeklyProgress}%
              </div>
              <div style={{ fontSize: '12px', color: '#8b949e' }}>Weekly Goal</div>
            </div>
          </div>
        </div>



        {/* Daily Progress Chart */}
        <div className="contribution-section">
          <h2 className="contribution-title" style={{ margin: '0 0 16px 0' }}>Daily Progress Chart</h2>
          
          <div style={{ display: 'flex', alignItems: 'end', gap: '8px', height: '120px', padding: '16px 0' }}>
            {recentDays.map((day, index) => {
              const heightPercentage = Math.max((day.steps / Math.max(dailyGoal, Math.max(...recentDays.map(d => d.steps)))) * 100, 2);
              
              return (
                <div key={day.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div 
                    style={{ 
                      width: '100%', 
                      height: `${heightPercentage}%`,
                      backgroundColor: day.goalMet ? '#238636' : '#58a6ff',
                      borderRadius: '2px 2px 0 0',
                      minHeight: '4px',
                      position: 'relative',
                      marginBottom: '8px'
                    }}
                    title={`${day.steps.toLocaleString()} steps`}
                  />
                  <div style={{ fontSize: '11px', color: '#8b949e', textAlign: 'center' }}>
                    {day.dayName}
                  </div>
                  <div style={{ fontSize: '10px', color: '#7d8590', textAlign: 'center', marginTop: '2px' }}>
                    {day.steps.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Goal Line Reference */}
          <div style={{ fontSize: '12px', color: '#8b949e', marginTop: '8px', textAlign: 'center' }}>
            <span style={{ color: '#238636' }}>■</span> Goal Met ({dailyGoal.toLocaleString()} steps) &nbsp;&nbsp;
            <span style={{ color: '#58a6ff' }}>■</span> Below Goal
          </div>
        </div>
      </div>
    </div>
  );
};

export default Goals;
