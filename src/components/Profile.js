import React from 'react';

const Profile = ({ totalWorkouts, currentStreak }) => {
  return (
    <div className="flex gap-10 mb-10">
      <div className="flex-1">
        <div className="w-[120px] h-[120px] rounded-full bg-[#30363d] flex items-center justify-center text-5xl text-[#7d8590] mb-5">D</div>
        <h1 className="text-3xl font-bold text-[#f0f6fc] mb-2">DANI</h1>
        <p className="text-[#8b949e] mb-4"> 
          LOCK IN LOCK IN LOCK IN aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaAAAAAAAA
        </p>
        <div className="flex gap-6">
          <div className="flex flex-col items-center">
            <div className="text-2xl font-bold text-[#f0f6fc]">{totalWorkouts}</div>
            <div className="text-sm text-[#8b949e]">Total Workouts</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-2xl font-bold text-[#f0f6fc]">{currentStreak}</div>
            <div className="text-sm text-[#8b949e]">Current Streak</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-2xl font-bold text-[#f0f6fc]">12</div>
            <div className="text-sm text-[#8b949e]">Months Active</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-2xl font-bold text-[#f0f6fc]">85</div>
            <div className="text-sm text-[#8b949e]">Fitness Score</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 