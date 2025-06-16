import React, { useState, useEffect } from 'react';
import ContributionGraph from './components/ContributionGraph';
import Header from './components/Header';
import Profile from './components/Profile';

function App() {
  const [workoutData, setWorkoutData] = useState({});

  // Sample data - in a real app, this would come from an API
  useEffect(() => {
    const generateSampleData = () => {
      const data = {};
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
      
      for (let i = 0; i < 365; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        
        // Random workout data
        const random = Math.random();
        if (random > 0.7) {
          data[dateString] = Math.floor(random * 4) + 1;
        }
      }
      
      return data;
    };

    setWorkoutData(generateSampleData());
  }, []);

  const handleDayClick = (date, level) => {
    const newLevel = level === 0 ? 1 : (level + 1) % 5;
    setWorkoutData(prev => ({
      ...prev,
      [date]: newLevel
    }));
  };

  const calculateStreak = () => {
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
    return Object.values(workoutData).reduce((sum, level) => sum + (level > 0 ? 1 : 0), 0);
  };

  return (
    <div className="App">
      <Header />
      
      <div className="container">
        <div className="main-content">
          <Profile 
            totalWorkouts={calculateTotalWorkouts()}
            currentStreak={calculateStreak()}
          />
          
          <div className="contribution-section">
            <h2 className="contribution-title">Fitness Activity</h2>
            <p className="contribution-subtitle">
              {calculateTotalWorkouts()} workouts in the last year
            </p>
            
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
          </div>
          
          <div className="current-streak">
            <h3 className="streak-number">{calculateStreak()}</h3>
            <p className="streak-label">Day Current Streak</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App; 