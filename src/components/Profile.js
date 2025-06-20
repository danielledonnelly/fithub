import React from 'react';
import { useFitbit } from '../context/FitbitContext';

const Profile = ({ totalWorkouts, currentStreak }) => {
  const { profile, isLoading, login, logout, accessToken } = useFitbit();

  if (isLoading) {
    return (
      <div className="flex gap-10 mb-10">
        <div className="flex-1">
          <p className="text-[#8b949e]">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-10 mb-10">
      <div className="flex-1">
        <div className="w-[120px] h-[120px] rounded-full bg-[#30363d] flex items-center justify-center text-5xl text-[#7d8590] mb-5">
          {profile ? profile.firstName.charAt(0) : 'D'}
        </div>
        <h1 className="text-3xl font-bold text-[#f0f6fc] mb-2">
          {profile ? `${profile.firstName} ${profile.lastName}` : 'DANI'}
        </h1>
        <p className="text-[#8b949e] mb-4">
          {profile ? profile.aboutMe || 'No bio available' : 'LOCK IN LOCK IN LOCK IN'}
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
        <div className="mt-6">
          {!accessToken ? (
            <button
              onClick={login}
              className="bg-[#238636] text-white px-4 py-2 rounded-md hover:bg-[#2ea043] transition-colors"
            >
              Connect Fitbit
            </button>
          ) : (
            <button
              onClick={logout}
              className="bg-[#21262d] text-[#c9d1d9] px-4 py-2 rounded-md hover:bg-[#30363d] transition-colors"
            >
              Disconnect Fitbit
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile; 