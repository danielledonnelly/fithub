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

// Helper to format a Date object as YYYY-MM-DD in local time
function formatDateLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to add days to a date (returns a new Date)
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

const ContributionGraph = ({ data }) => {
  const [activityMode, setActivityMode] = useState('active');

  // Calculate the start date (previous Sunday, 1 year ago from today)
  const today = new Date();
  const oneYearAgo = addDays(today, -364); // 365 days including today
  const startDay = oneYearAgo.getDay();
  const startDate = addDays(oneYearAgo, -startDay); // Go back to previous Sunday

  // Calculate the number of days to display (from startDate to today, inclusive)
  const totalDays = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
  const numWeeks = Math.ceil(totalDays / 7);

  // Generate the weeks data
  const generateYearData = () => {
    const weeks = [];
    let currentDate = new Date(startDate);
    for (let week = 0; week < numWeeks; week++) {
      const weekData = [];
      for (let day = 0; day < 7; day++) {
        const dateString = formatDateLocal(currentDate);
        const steps = data[dateString] || 0;
        const thresholds = ACTIVITY_MODES[activityMode].thresholds;
        let level = null;
        if (steps > 0) {
          if (steps < 1000) {
            level = 0;
          } else {
            level = 0;
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
        currentDate = addDays(currentDate, 1);
      }
      weeks.push(weekData);
    }
    return weeks;
  };

  // Tooltip uses local time
  const getTooltipText = (date, steps) => {
    // Force local time by parsing as YYYY-MM-DDT00:00:00
    const dateObj = new Date(date + 'T00:00:00');
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
            date.setMonth(date.getMonth() - 12 + i);
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