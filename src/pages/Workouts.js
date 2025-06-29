import React, { useState } from 'react';

const Workouts = () => {
  const [selectedWorkout, setSelectedWorkout] = useState('');
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');
  const [workoutHistory, setWorkoutHistory] = useState([]);

  const workoutTypes = [
    { id: 'walk', name: 'Walk', description: 'Casual walking pace' },
    { id: 'jog', name: 'Jog', description: 'Light jogging pace' },
    { id: 'run', name: 'Run', description: 'Running at faster pace' }
  ];

  const handleWorkoutSubmit = (e) => {
    e.preventDefault();
    if (!selectedWorkout || !duration) {
      alert('Please select a workout type and duration');
      return;
    }

    const newWorkout = {
      id: Date.now(),
      type: selectedWorkout,
      duration: parseInt(duration),
      distance: distance ? parseFloat(distance) : null,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toLocaleString()
    };

    setWorkoutHistory([newWorkout, ...workoutHistory]);
    
    // Reset form
    setSelectedWorkout('');
    setDuration('');
    setDistance('');
  };

  const getWorkoutTypeName = (type) => {
    const workout = workoutTypes.find(w => w.id === type);
    return workout ? workout.name : type;
  };

  return (
    <div className="container">
      <div className="main-content">
        <h1 className="contribution-title">Workouts</h1>
        <p className="contribution-subtitle">
          Track your walking, jogging, and running activities
        </p>

        {/* Workout Form */}
        <div className="contribution-section" style={{ marginBottom: '20px' }}>
          <h2 className="contribution-title" style={{ margin: '0 0 20px 0' }}>Log New Workout</h2>
          
          <form onSubmit={handleWorkoutSubmit}>
            {/* Workout Type Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '12px', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#f0f6fc' 
              }}>
                Choose Workout Type
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                {workoutTypes.map((workout) => (
                  <div
                    key={workout.id}
                    onClick={() => setSelectedWorkout(workout.id)}
                    style={{
                      padding: '16px',
                      backgroundColor: selectedWorkout === workout.id ? '#21262d' : '#0d1117',
                      border: selectedWorkout === workout.id ? '1px solid #58a6ff' : '1px solid #30363d',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'center'
                    }}
                    onMouseOver={(e) => {
                      if (selectedWorkout !== workout.id) {
                        e.target.style.backgroundColor = '#161b22';
                        e.target.style.borderColor = '#8b949e';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (selectedWorkout !== workout.id) {
                        e.target.style.backgroundColor = '#0d1117';
                        e.target.style.borderColor = '#30363d';
                      }
                    }}
                  >
                    <h3 style={{ 
                      margin: '0 0 4px 0', 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      color: '#f0f6fc' 
                    }}>
                      {workout.name}
                    </h3>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '12px', 
                      color: '#8b949e' 
                    }}>
                      {workout.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Duration and Distance */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: '#f0f6fc' 
                }}>
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g., 30"
                  min="1"
                  required
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
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: '#f0f6fc' 
                }}>
                  Distance (miles) - Optional
                </label>
                <input
                  type="number"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  placeholder="e.g., 2.5"
                  step="0.1"
                  min="0"
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
              </div>
            </div>

            <button
              type="submit"
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#ffffff',
                backgroundColor: '#238636',
                border: '1px solid #2ea043',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#2ea043';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#238636';
              }}
            >
              Log Workout
            </button>
          </form>
        </div>

        {/* Workout History */}
        <div className="contribution-section">
          <h2 className="contribution-title" style={{ margin: '0 0 20px 0' }}>Recent Workouts</h2>
          
          {workoutHistory.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 20px',
              color: '#8b949e'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>💪</div>
              <p style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#c9d1d9' }}>No workouts logged yet</p>
              <p style={{ margin: 0, fontSize: '14px' }}>Start by logging your first workout above!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {workoutHistory.map((workout) => (
                <div 
                  key={workout.id} 
                  style={{
                    padding: '16px',
                    backgroundColor: '#0d1117',
                    border: '1px solid #30363d',
                    borderRadius: '6px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ 
                        margin: '0 0 4px 0', 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        color: '#f0f6fc' 
                      }}>
                        {getWorkoutTypeName(workout.type)}
                      </h3>
                      <p style={{ 
                        margin: 0, 
                        fontSize: '12px', 
                        color: '#8b949e' 
                      }}>
                        {workout.timestamp}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                        fontSize: '18px', 
                        fontWeight: '600', 
                        color: '#f0f6fc' 
                      }}>
                        {workout.duration} min
                      </div>
                      {workout.distance && (
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#8b949e' 
                        }}>
                          {workout.distance} miles
                        </div>
                      )}
                    </div>
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