import React, { useState, useEffect } from 'react';
import StepService from '../services/StepService';

const Workouts = () => {
  const [stepData, setStepData] = useState({});
  const [activityLabels, setActivityLabels] = useState({}); // Store user-assigned labels
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const fetchStepData = async () => {
      try {
        if (mounted) {
          setLoading(true);
        }
        
        const data = await StepService.getAllSteps();
        
        // Only update state if component is still mounted
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

    fetchStepData();
    
    // Cleanup function - sets mounted to false when component unmounts
    return () => {
      mounted = false;
    };
  }, []);

  const getRecentDays = (days = 7) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const recent = [];
    Object.entries(stepData).forEach(([date, steps]) => {
      const dateObj = new Date(date);
      if (dateObj >= startDate && dateObj <= endDate && steps > 0) {
        recent.push({ date, steps });
      }
    });

    return recent.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const setActivityLabel = (date, activityType) => {
    setActivityLabels(prev => ({
      ...prev,
      [date]: activityType
    }));
  };

  const getActivitySummary = () => {
    const recentDays = getRecentDays();
    const summary = { walk: 0, jog: 0, run: 0, unlabeled: 0 };
    
    recentDays.forEach(({ date, steps }) => {
      const label = activityLabels[date];
      if (label) {
        summary[label] += steps;
      } else {
        summary.unlabeled += steps;
      }
    });

    return summary;
  };

  const recentDays = getRecentDays();
  const summary = getActivitySummary();

  if (loading) {
    return (
      <div className="container">
        <div className="main-content">
          <div style={{ textAlign: 'center', padding: '40px', color: '#c9d1d9' }}>
            Loading step data...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="main-content">
        {/* <h1 className="contribution-title">Activity Summary</h1>
        <p className="contribution-subtitle">
          Label your recent step activity and view a quick summary
        </p> */}

        {/* Quick Summary */}
        <div className="contribution-section" style={{ marginBottom: '20px' }}>
          <h2 className="contribution-title" style={{ margin: '0 0 12px 0' }}>Last 7 Days</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
            <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '6px' }}>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#58a6ff' }}>
                {summary.walk.toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', color: '#8b949e' }}>Walk</div>
            </div>
            <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '6px' }}>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#58a6ff' }}>
                {summary.jog.toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', color: '#8b949e' }}>Jog</div>
            </div>
            <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '6px' }}>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#58a6ff' }}>
                {summary.run.toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', color: '#8b949e' }}>Run</div>
            </div>
            <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '6px' }}>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#7d8590' }}>
                {summary.unlabeled.toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', color: '#8b949e' }}>Unlabeled</div>
            </div>
          </div>
        </div>

        {/* Recent Days with Labeling */}
        <div className="contribution-section">
          <h2 className="contribution-title" style={{ margin: '0 0 12px 0' }}>Label Recent Activity</h2>
          
          {recentDays.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#8b949e' }}>
              <p style={{ margin: 0, fontSize: '14px' }}>No recent step data available</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recentDays.slice(0, 5).map(({ date, steps }) => (
                <div 
                  key={date} 
                  style={{
                    padding: '12px',
                    backgroundColor: '#0d1117',
                    border: '1px solid #30363d',
                    borderRadius: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: '#f0f6fc',
                      marginBottom: '2px'
                    }}>
                      {new Date(date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#8b949e' 
                    }}>
                      {steps.toLocaleString()} steps
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {['walk', 'jog', 'run'].map((activity) => (
                      <button
                        key={activity}
                        onClick={() => setActivityLabel(date, activity)}
                        style={{
                          padding: '4px 8px',
                          fontSize: '11px',
                          fontWeight: '500',
                          color: activityLabels[date] === activity ? '#ffffff' : '#c9d1d9',
                          backgroundColor: activityLabels[date] === activity ? '#BB1F21' : '#21262d',
                          border: activityLabels[date] === activity ? '1px solid #BB1F21' : '1px solid #30363d',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          textTransform: 'capitalize'
                        }}
                        onMouseOver={(e) => {
                          if (activityLabels[date] !== activity) {
                            e.target.style.backgroundColor = '#30363d';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (activityLabels[date] !== activity) {
                            e.target.style.backgroundColor = '#21262d';
                          }
                        }}
                      >
                        {activity}
                      </button>
                    ))}
                    {activityLabels[date] && (
                      <button
                        onClick={() => setActivityLabel(date, null)}
                        style={{
                          padding: '4px 8px',
                          fontSize: '11px',
                          fontWeight: '500',
                          color: '#da3633',
                          backgroundColor: '#21262d',
                          border: '1px solid #30363d',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.backgroundColor = '#30363d';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.backgroundColor = '#21262d';
                        }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Workouts; 