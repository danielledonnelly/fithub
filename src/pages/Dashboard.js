import React, { useState, useEffect } from 'react';
import ContributionGraph from '../components/ContributionGraph';
import Profile from '../components/Profile';
import { useFitbit } from '../context/FitbitContext';
import fitbitService from '../services/fitbitService';

const Dashboard = () => {
  const [workoutData, setWorkoutData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { accessToken, profile } = useFitbit();

  useEffect(() => {
    const fetchFitbitData = async () => {
      if (!accessToken) return;

      setIsLoading(true);
      try {
        // Fetch last 365 days of activity
        const today = new Date();
        const data = {};
        
        for (let i = 0; i < 365; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateString = date.toISOString().split('T')[0];
          
          try {
            const activityData = await fitbitService.getActivityData(dateString, accessToken);
            
            // Calculate activity level based on steps and active minutes
            const steps = activityData.summary?.steps || 0;
            const veryActiveMinutes = activityData.summary?.veryActiveMinutes || 0;
            const fairlyActiveMinutes = activityData.summary?.fairlyActiveMinutes || 0;
            
            // Calculate activity level (0-4)
            let level = 0;
            if (steps > 0 || veryActiveMinutes > 0 || fairlyActiveMinutes > 0) {
              if (steps < 5000) level = 1;
              else if (steps < 10000) level = 2;
              else if (steps < 15000) level = 3;
              else level = 4;
              
              // Boost level based on active minutes
              if (veryActiveMinutes > 30 || fairlyActiveMinutes > 60) {
                level = Math.min(level + 1, 4);
              }
            }
            
            data[dateString] = level;
          } catch (error) {
            console.error(`Error fetching data for ${dateString}:`, error);
          }
        }
        
        setWorkoutData(data);
      } catch (error) {
        console.error('Error fetching Fitbit data:', error);
      }
      setIsLoading(false);
    };

    fetchFitbitData();
  }, [accessToken]);

  const handleDayClick = (date, level) => {
    // In the future, we could add manual overrides here
    console.log(`Clicked ${date} with level ${level}`);
  };

  const calculateStreak = () => {
    if (!workoutData) return 0;
    
    const today = new Date();
    let streak = 0;
    
    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      if (workoutData[dateString] > 0) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const calculateTotalWorkouts = () => {
    if (!workoutData) return 0;
    return Object.values(workoutData).reduce((sum, level) => sum + (level > 0 ? 1 : 0), 0);
  };

  if (!accessToken) {
    return (
      <div className="container">
        <div className="main-content">
          <Profile 
            totalWorkouts={0}
            currentStreak={0}
          />
          <div className="text-center mt-8">
            <p className="text-[#8b949e] mb-4">Connect your Fitbit to see your activity data!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="main-content">
        <Profile 
          totalWorkouts={calculateTotalWorkouts()}
          currentStreak={calculateStreak()}
        />
        
        <div className="contribution-section">
          <h2 className="contribution-title">Fitness Activity</h2>
          <p className="contribution-subtitle">
            {isLoading ? 'Loading your activity data...' : `${calculateTotalWorkouts()} active days in the last year`}
          </p>
          
          <div className="contribution-content">
            <div className="contribution-graph-container">
              {isLoading ? (
                <div className="flex items-center justify-center h-[200px]">
                  <p className="text-[#8b949e]">Loading your activity data...</p>
                </div>
              ) : (
                <>
                  <ContributionGraph 
                    data={workoutData} 
                    onDayClick={handleDayClick}
                  />
                  
                  <div className="contribution-legend">
                    <span>Less</span>
                    <div className="legend-item">
                      <div className="legend-square level-0"></div>
                    </div>
                    <div className="legend-item">
                      <div className="legend-square level-1"></div>
                    </div>
                    <div className="legend-item">
                      <div className="legend-square level-2"></div>
                    </div>
                    <div className="legend-item">
                      <div className="legend-square level-3"></div>
                    </div>
                    <div className="legend-item">
                      <div className="legend-square level-4"></div>
                    </div>
                    <span>More</span>
                  </div>
                </>
              )}
            </div>
            
            <div className="current-streak">
              <div className="streak-number">{calculateStreak()}</div>
              <div className="streak-label">Day Current Streak</div>
              <div className="streak-description">
                {calculateStreak() > 0 ? 'Keep it up!' : 'Start your streak today!'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 