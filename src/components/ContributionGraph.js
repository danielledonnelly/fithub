import React, { useState, useMemo } from 'react';

const ACTIVITY_MODES = {
  sedentary: {
    name: 'Sedentary',
    thresholds: [2500, 4000, 6000]
  },
  active: {
    name: 'Active',
    thresholds: [5000, 7500, 10000]
  },
  athletic: {
    name: 'Athletic',
    thresholds: [7500, 12500, 20000]
  },
  goals: {
    name: 'Goals',
    thresholds: null // Will be calculated dynamically
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

const ContributionGraph = ({ data, dailyGoal: propDailyGoal }) => {
  const [activityMode, setActivityMode] = useState('active');
  
  // This graph shows year-to-date data (January 1st to current date)
  // It maintains grid alignment by starting from the previous Sunday
  // All dates use the device's local timezone

  // Get daily goal from localStorage for goal-based mode, with fallback to prop
  const getDailyGoal = () => {
    const savedGoal = localStorage.getItem('fithub_daily_goal');
    return savedGoal ? parseInt(savedGoal) : (propDailyGoal || 10000);
  };

  // Convert data keys from Date objects to YYYY-MM-DD format
  const normalizedData = useMemo(() => {
    const result = {};
    if (data && typeof data === 'object') {
      Object.keys(data).forEach(key => {
        try {
          // Parse the date key and convert to YYYY-MM-DD format using local time
          const date = new Date(key);
          if (!isNaN(date.getTime())) {
            const dateString = formatDateLocal(date);
            result[dateString] = data[key];
          }
        } catch (e) {
          // If key is already in YYYY-MM-DD format, use it as is
          if (key.match(/^\d{4}-\d{2}-\d{2}$/)) {
            result[key] = data[key];
          }
        }
      });
    }
    return result;
  }, [data]);

  // Calculate the start date (January 1st of current year)
  // Use local time to ensure we get the correct current date
  const { today, currentYear, startDate, adjustedStartDate, numWeeks, totalDays } = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const startDate = new Date(currentYear, 0, 1); // January 1st of current year
    const startDay = startDate.getDay();
    const adjustedStartDate = addDays(startDate, -startDay); // Go back to previous Sunday for grid alignment

    // Calculate the number of days to display (from January 1st to today, inclusive)
    const totalDays = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    // Calculate weeks needed to include the current week
    const daysFromAdjustedStart = Math.ceil((today - adjustedStartDate) / (1000 * 60 * 60 * 24)) + 1;
    const numWeeks = Math.ceil(daysFromAdjustedStart / 7);
    
    return { today, currentYear, startDate, adjustedStartDate, numWeeks, totalDays };
  }, []); // Only calculate once per day
  
  // Note: We use adjustedStartDate for grid alignment, but actual data starts from January 1st

  // Generate the weeks data
  const generateYearData = () => {
    const weeks = [];
    let currentDate = new Date(adjustedStartDate);
    for (let week = 0; week < numWeeks; week++) {
      const weekData = [];
      for (let day = 0; day < 7; day++) {
        const dateString = formatDateLocal(currentDate);
        const steps = normalizedData[dateString] || 0;
        let thresholds = ACTIVITY_MODES[activityMode].thresholds;
        let level = null;
        
        // Handle goal-based mode
        if (activityMode === 'goals') {
          const dailyGoal = getDailyGoal();
          if (steps === 0) {
            level = null;
          } else if (steps < dailyGoal * 0.75) {
            level = 0;
          } else if (steps < dailyGoal) {
            level = 1;
          } else if (steps < dailyGoal * 1.25) {
            level = 2;
          } else {
            level = 3;
          }
        } else {
          // Standard threshold-based mode
          if (steps > 0) {
            level = 0;
            for (let i = thresholds.length - 1; i >= 0; i--) {
              if (steps >= thresholds[i]) {
                level = i + 1;
                break;
              }
            }
          }
        }
        // Only show data for dates in the current year (January 1st onwards)
        const isInCurrentYear = currentDate >= startDate;
        
        weekData.push({
          date: dateString,
          steps: isInCurrentYear ? steps : 0,
          level: isInCurrentYear ? level : null,
          dayOfWeek: day,
          isCurrentMonth: currentDate <= today,
          isInCurrentYear: isInCurrentYear
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

  const weeks = useMemo(() => generateYearData(), [normalizedData, activityMode, today, currentYear, startDate, adjustedStartDate, numWeeks]);
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentThresholds = ACTIVITY_MODES[activityMode].thresholds;
  const dailyGoal = getDailyGoal();
  


  return (
    <div className="contribution-graph">
      <div className="contribution-months">
        <div className="month-labels">
          {Array.from({ length: 12 }, (_, i) => {
            const date = new Date(currentYear, i, 1);
            // Only show months up to the current month
            if (date <= today) {
              return (
                <div key={i} className="month-label">
                  {date.toLocaleDateString('en-US', { month: 'short' })}
                </div>
              );
            }
            return null;
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
            {activityMode === 'goals' ? (
              <>
                <div className="legend-item">
                  <div className="contribution-day level-0" />
                  <span>{`< ${Math.round(dailyGoal * 0.75).toLocaleString()}`}</span>
                </div>
                <div className="legend-item">
                  <div className="contribution-day level-1" />
                  <span>{`${dailyGoal.toLocaleString()}+`}</span>
                </div>
                <div className="legend-item">
                  <div className="contribution-day level-2" />
                  <span>{`${Math.round(dailyGoal * 1.25).toLocaleString()}+`}</span>
                </div>
                <div className="legend-item">
                  <div className="contribution-day level-3" />
                  <span>{`${Math.round(dailyGoal * 1.5).toLocaleString()}+`}</span>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
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

export default React.memo(ContributionGraph); 