import React, { useState, useEffect } from 'react';

const Community = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Mock data for demonstration
  const mockUsers = [
    { id: 1, username: 'fitness_guru', dailySteps: 12500, weeklySteps: 87500, monthlySteps: 350000 },
    { id: 2, username: 'step_master', dailySteps: 15000, weeklySteps: 105000, monthlySteps: 420000 },
    { id: 3, username: 'walking_queen', dailySteps: 8000, weeklySteps: 56000, monthlySteps: 224000 },
    { id: 4, username: 'runner_pro', dailySteps: 18000, weeklySteps: 126000, monthlySteps: 504000 },
    { id: 5, username: 'casual_walker', dailySteps: 6000, weeklySteps: 42000, monthlySteps: 168000 }
  ];

  const handleSearch = (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    const results = mockUsers.filter(user => 
      user.username.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(results);
  };

  const openUserProfile = (username) => {
    console.log(`Opening profile for user: ${username}`);
  };

  const LeaderboardRow = ({ user, rank, type }) => {
    const getSteps = () => {
      switch (type) {
        case 'daily': return user.dailySteps;
        case 'weekly': return user.weeklySteps;
        case 'monthly': return user.monthlySteps;
        default: return 0;
      }
    };

    const steps = getSteps();

    return (
      <div className="px-4 py-3 border border-solid border-fithub-light-grey rounded-lg bg-fithub-medium-grey mb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-lg font-semibold text-fithub-bright-red">
              #{rank}
            </div>
            <span
              onClick={() => openUserProfile(user.username)}
              className="text-base text-fithub-white hover:text-fithub-bright-red transition-colors cursor-pointer"
            >
              {user.username}
            </span>
          </div>
          <div className="text-base text-fithub-white">
            {steps.toLocaleString()} steps
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container">
      <div className="main-content">
        <div className="flex justify-between items-center mb-1 page-header">
          <div>
            <h1 className="page-title">Community</h1>
            <p className="contribution-subtitle">
              Connect with other fitness enthusiasts and compete on leaderboards.
            </p>
          </div>
        </div>

        {/* User Search */}
        <div className="section mb-5">
          <h2 className="section-title mb-4">Find Users</h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              className="w-full px-3 py-2 text-sm bg-fithub-dark-grey border border-solid border-fithub-light-grey rounded-md text-fithub-text outline-none focus:outline-none focus:ring-0 focus:border-fithub-salmon transition-colors"
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-fithub-medium-grey border border-fithub-light-grey rounded z-10 max-h-60 overflow-y-auto">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => openUserProfile(user.username)}
                    className="px-4 py-3 hover:bg-fithub-dark-grey cursor-pointer border-b border-fithub-light-grey last:border-b-0"
                  >
                    <div className="text-base text-fithub-white">{user.username}</div>
                    <div className="text-sm text-fithub-text">
                      {user.dailySteps.toLocaleString()} steps today
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Leaderboards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily Leaderboard */}
          <div className="section">
            <h2 className="section-title mb-4">Daily Leaderboard</h2>
            <div className="space-y-2">
              {mockUsers.sort((a, b) => b.dailySteps - a.dailySteps).slice(0, 10).map((user, index) => (
                <LeaderboardRow
                  key={user.id}
                  user={user}
                  rank={index + 1}
                  type="daily"
                />
              ))}
            </div>
          </div>

          {/* Weekly Leaderboard */}
          <div className="section">
            <h2 className="section-title mb-4">Weekly Leaderboard</h2>
            <div className="space-y-2">
              {mockUsers.sort((a, b) => b.weeklySteps - a.weeklySteps).slice(0, 10).map((user, index) => (
                <LeaderboardRow
                  key={user.id}
                  user={user}
                  rank={index + 1}
                  type="weekly"
                />
              ))}
            </div>
          </div>

          {/* Monthly Leaderboard */}
          <div className="section">
            <h2 className="section-title mb-4">Monthly Leaderboard</h2>
            <div className="space-y-2">
              {mockUsers.sort((a, b) => b.monthlySteps - a.monthlySteps).slice(0, 10).map((user, index) => (
                <LeaderboardRow
                  key={user.id}
                  user={user}
                  rank={index + 1}
                  type="monthly"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community; 