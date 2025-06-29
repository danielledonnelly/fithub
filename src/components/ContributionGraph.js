import React, { useState } from 'react';

const ACTIVITY_MODES = {
  sedentary: {
    name: 'Sedentary',
    thresholds: [1000, 2500, 4000, 6000]
  },
  active: {
    name: 'Active',
    thresholds: [3000, 5000, 7500, 10000]
  },
  athletic: {
    name: 'Athletic',
    thresholds: [5000, 7500, 12500, 20000]
  }
};

const ContributionGraph = ({ data }) => {
  const [activityMode, setActivityMode] = useState('active');

  const generateYearData = () => {
    const weeks = [];
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    oneYearAgo.setDate(today.getDate() + 1);
    
    const startDate = new Date(oneYearAgo);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    let currentDate = new Date(startDate);
    
    for (let week = 0; week < 53; week++) {
      const weekData = [];
      
      for (let day = 0; day < 7; day++) {
        const dateString = currentDate.toISOString().split('T')[0];
        const steps = data[dateString] || 0;
        
        // Calculate level based on selected mode's thresholds
        const thresholds = ACTIVITY_MODES[activityMode].thresholds;
        let level = null; // null for no data (blank square)
        
        if (steps > 0) {
          if (steps < 1000) {
            level = 0; // 20% opacity for steps under 1000
          } else {
            level = 0; // Default to level 0 (20% opacity)
            for (let i = thresholds.length - 1; i >= 0; i--) {
              if (steps >= thresholds[i]) {
                level = i + 1;
                break;
              }
            }
          }
        }
        
        weekData.push({
          date: dateString,
          steps: steps,
          level: level,
          dayOfWeek: day,
          isCurrentMonth: currentDate <= today
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      weeks.push(weekData);
    }
    
    return weeks;
  };

  const getTooltipText = (date, steps) => {
    const dateObj = new Date(date);
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    const formattedDate = dateObj.toLocaleDateString('en-US', options);
    
    if (steps === 0) {
      return `No steps recorded on ${formattedDate}`;
    } else {
      return `${steps.toLocaleString()} steps on ${formattedDate}`;
    }
  };

  const weeks = generateYearData();
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentThresholds = ACTIVITY_MODES[activityMode].thresholds;

  return (
    <div className="contribution-graph">
      <div className="contribution-months">
        <div className="month-labels">
          {Array.from({ length: 12 }, (_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() - 11 + i);
            return (
              <div key={i} className="month-label">
                {date.toLocaleDateString('en-US', { month: 'short' })}
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="contribution-main">
        <div className="contribution-days">
          {dayLabels.map((day, index) => (
            <div key={index} className="day-label">
              {index % 2 === 1 ? day : ''}
            </div>
          ))}
        </div>
        
        <div className="contribution-weeks">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="contribution-week">
              {week.map((day, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`contribution-day ${day.level !== null ? `level-${day.level}` : ''}`}
                  title={getTooltipText(day.date, day.steps)}
                  style={{
                    opacity: day.isCurrentMonth ? 1 : 0.3,
                    backgroundColor: day.level === null ? '#161b22' : undefined
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="contribution-footer">
        <div className="contribution-legend">
          <span>Less</span>
          <div className="legend-items">
            <div className="legend-item">
              <div className="contribution-day level-0" />
              <span>{`< ${currentThresholds[0].toLocaleString()}`}</span>
            </div>
            <div className="legend-item">
              <div className="contribution-day level-1" />
              <span>{`${currentThresholds[0].toLocaleString()}+`}</span>
            </div>
            <div className="legend-item">
              <div className="contribution-day level-2" />
              <span>{`${currentThresholds[1].toLocaleString()}+`}</span>
            </div>
            <div className="legend-item">
              <div className="contribution-day level-3" />
              <span>{`${currentThresholds[2].toLocaleString()}+`}</span>
            </div>
            <div className="legend-item">
              <div className="contribution-day level-4" />
              <span>{`${currentThresholds[3].toLocaleString()}+`}</span>
            </div>
          </div>
          <span>More</span>
        </div>

        <div className="mode-selector">
          {Object.entries(ACTIVITY_MODES).map(([mode, { name }]) => (
            <button
              key={mode}
              className={`mode-button ${activityMode === mode ? 'active' : ''}`}
              onClick={() => setActivityMode(mode)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContributionGraph; 