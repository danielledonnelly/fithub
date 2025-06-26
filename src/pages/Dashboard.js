import React, { useState, useEffect } from 'react';
import ContributionGraph from '../components/ContributionGraph';
import Profile from '../components/Profile';

const Dashboard = () => {
  const [stepData, setStepData] = useState({});

  // Sample data - in a real app, this would come from an API
  useEffect(() => {
    const generateSampleData = () => {
      const data = {};
      const today = new Date();
      const startDate = new Date(today);
      startDate.setFullYear(startDate.getFullYear() - 1);
      startDate.setDate(startDate.getDate() + 1);
      
      for (let i = 0; i < 365; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        
        // Random step data between 0 and 10000
        const random = Math.random();
        if (random > 0.2) { // 80% chance of having steps
          data[dateString] = Math.floor(random * 10000);
        }
      }
      
      return data;
    };

    setStepData(generateSampleData());
  }, []);

  const handleDayClick = (date, steps) => {
    const newSteps = steps === 0 ? 1500 : (steps >= 7500 ? 0 : steps + 1500);
    setStepData(prev => ({
      ...prev,
      [date]: newSteps
    }));
  };

  const calculateTotalSteps = () => {
    return Object.values(stepData).reduce((sum, steps) => sum + steps, 0);
  };

  const calculateActiveDays = () => {
    return Object.values(stepData).filter(steps => steps > 0).length;
  };

  return (
    <div className="container">
      <div className="main-content">
        <Profile 
          totalWorkouts={calculateActiveDays()}
          currentStreak={0} // This prop is no longer used but kept for compatibility
        />
        
        <div className="contribution-section">
          <h2 className="contribution-title">Step Activity</h2>
          <p className="contribution-subtitle">
            {calculateActiveDays()} active days in the last year
          </p>
          
          <div className="contribution-content">
            <div className="contribution-graph-container">
              <ContributionGraph 
                data={stepData} 
                onDayClick={handleDayClick}
              />
            </div>
            
            <div className="current-streak">
              <div className="streak-number">{calculateTotalSteps().toLocaleString()}</div>
              <div className="streak-label">Total Steps</div>
              <div className="streak-description">This Year</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 