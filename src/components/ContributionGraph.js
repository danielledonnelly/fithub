import React from 'react';

const ContributionGraph = ({ data, onDayClick }) => {
  const generateYearData = () => {
    const weeks = [];
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    
    // Start from the beginning of the week containing the date one year ago
    const startDate = new Date(oneYearAgo);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    let currentDate = new Date(startDate);
    
    // Generate 53 weeks to cover a full year
    for (let week = 0; week < 53; week++) {
      const weekData = [];
      
      for (let day = 0; day < 7; day++) {
        const dateString = currentDate.toISOString().split('T')[0];
        const level = data[dateString] || 0;
        
        weekData.push({
          date: dateString,
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

  const getTooltipText = (date, level) => {
    const dateObj = new Date(date);
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    const formattedDate = dateObj.toLocaleDateString('en-US', options);
    
    if (level === 0) {
      return `No workouts on ${formattedDate}`;
    } else if (level === 1) {
      return `Light workout on ${formattedDate}`;
    } else if (level === 2) {
      return `Moderate workout on ${formattedDate}`;
    } else if (level === 3) {
      return `Good workout on ${formattedDate}`;
    } else {
      return `Intense workout on ${formattedDate}`;
    }
  };

  const weeks = generateYearData();

  return (
    <div className="contribution-graph">
      {weeks.map((week, weekIndex) => (
        <div key={weekIndex} className="contribution-week">
          {week.map((day, dayIndex) => (
            <div
              key={`${weekIndex}-${dayIndex}`}
              className={`contribution-day level-${day.level}`}
              title={getTooltipText(day.date, day.level)}
              onClick={() => onDayClick(day.date, day.level)}
              style={{
                opacity: day.isCurrentMonth ? 1 : 0.3
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default ContributionGraph; 