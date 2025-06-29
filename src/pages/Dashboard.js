import React, { useState, useEffect } from 'react';
import ContributionGraph from '../components/ContributionGraph';
import Profile from '../components/Profile';
import stepService from '../services/stepService';

const Dashboard = () => {
  const [stepData, setStepData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load data from backend API
  useEffect(() => {
    const fetchStepData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await stepService.getAllSteps();
        setStepData(data);
      } catch (error) {
        console.error('Failed to fetch step data:', error);
        setError('Failed to load step data. Please make sure the server is running.');
        // Fallback to empty data if API fails
        setStepData({});
      } finally {
        setLoading(false);
      }
    };

    fetchStepData();
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
      await stepService.updateSteps(date, newSteps);
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
      const response = await stepService.regenerateStepData();
      setStepData(response.data);
    } catch (error) {
      console.error('Failed to regenerate step data:', error);
      setError('Failed to regenerate step data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalSteps = () => {
    return Object.values(stepData).reduce((sum, steps) => sum + steps, 0);
  };

  const calculateActiveDays = () => {
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
          totalWorkouts={calculateActiveDays()}
          currentStreak={0} // This prop is no longer used but kept for compatibility
        />
        
        <div className="contribution-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 className="contribution-title" style={{ margin: 0 }}>Step Activity</h2>
            <button 
              onClick={handleRegenerateData}
              disabled={loading}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '500',
                color: loading ? '#7d8590' : '#c9d1d9',
                backgroundColor: loading ? '#161b22' : '#21262d',
                border: '1px solid #30363d',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = '#30363d';
                  e.target.style.borderColor = '#8b949e';
                }
              }}
              onMouseOut={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = '#21262d';
                  e.target.style.borderColor = '#30363d';
                }
              }}
            >
              {loading ? 'Loading...' : 'Regenerate Data'}
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