import React, { useState, useEffect } from 'react';
import ContributionGraph from '../components/ContributionGraph';
import Profile from '../components/Profile';

const Dashboard = () => {
  const [stepData, setStepData] = useState({});

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

  // Load data from localStorage or generate new data
  useEffect(() => {
    const savedData = localStorage.getItem('fithub-step-data');
    if (savedData) {
      try {
        setStepData(JSON.parse(savedData));
      } catch (error) {
        console.error('Error parsing saved data:', error);
        const newData = generateSampleData();
        setStepData(newData);
        localStorage.setItem('fithub-step-data', JSON.stringify(newData));
      }
    } else {
      const newData = generateSampleData();
      setStepData(newData);
      localStorage.setItem('fithub-step-data', JSON.stringify(newData));
    }
  }, []);

  const handleDayClick = (date, steps) => {
    const newSteps = steps === 0 ? 1500 : (steps >= 7500 ? 0 : steps + 1500);
    const updatedData = {
      ...stepData,
      [date]: newSteps
    };
    setStepData(updatedData);
    localStorage.setItem('fithub-step-data', JSON.stringify(updatedData));
  };

  const handleRegenerateData = () => {
    const newData = generateSampleData();
    setStepData(newData);
    localStorage.setItem('fithub-step-data', JSON.stringify(newData));
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 className="contribution-title" style={{ margin: 0 }}>Step Activity</h2>
            <button 
              onClick={handleRegenerateData}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '500',
                color: '#c9d1d9',
                backgroundColor: '#21262d',
                border: '1px solid #30363d',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#30363d';
                e.target.style.borderColor = '#8b949e';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#21262d';
                e.target.style.borderColor = '#30363d';
              }}
            >
              Regenerate Data
            </button>
          </div>
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