import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CommunityService from '../services/CommunityService';

const Community = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [leaderboardUsers, setLeaderboardUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Load leaderboard data on component mount
  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLoading(true);
        const data = await CommunityService.getLeaderboard();
        setLeaderboardUsers(data.users || []);
      } catch (error) {
        console.error('Error loading leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, []);

  const handleSearch = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const data = await CommunityService.searchUsers(query);
      setSearchResults(data.users || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const openUserProfile = (username) => {
    navigate(`/profile/${username}`);
  };

  const LeaderboardRow = ({ user, rank, type }) => {
    const getSteps = () => {
      switch (type) {
        case 'daily': return user.daily_steps || 0;
        case 'weekly': return user.weekly_steps || 0;
        case 'monthly': return user.monthly_steps || 0;
        default: return 0;
      }
    };

    const steps = getSteps();
    const displayName = user.display_name || user.username;

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
              {displayName}
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
            {searchLoading && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-fithub-medium-grey border-2 border-fithub-light-grey rounded-md z-10 p-4 shadow-lg">
                <div className="text-fithub-text text-center">Searching...</div>
              </div>
            )}
            {searchResults.length > 0 && !searchLoading && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-fithub-medium-grey border-2 border-fithub-light-grey rounded-md z-10 max-h-60 overflow-y-auto shadow-lg">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => openUserProfile(user.username)}
                    className="px-4 py-3 hover:bg-fithub-dark-grey cursor-pointer border border-white mb-1 last:mb-0 transition-colors rounded"
                    style={{ border: '1px solid #30363d' }}
                  >
                    <div className="flex justify-between items-center text-base text-fithub-white">
                      <span className="text-sm text-fithub-text">@{user.username}</span>
                      <span>{user.display_name || user.username}</span>
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
            {loading ? (
              <div className="text-fithub-text text-center py-8">Loading...</div>
            ) : (
              <div className="space-y-2">
                {leaderboardUsers
                  .sort((a, b) => (b.daily_steps || 0) - (a.daily_steps || 0))
                  .slice(0, 10)
                  .map((user, index) => (
                    <LeaderboardRow
                      key={user.id}
                      user={user}
                      rank={index + 1}
                      type="daily"
                    />
                  ))}
              </div>
            )}
          </div>

          {/* Weekly Leaderboard */}
          <div className="section">
            <h2 className="section-title mb-4">Weekly Leaderboard</h2>
            {loading ? (
              <div className="text-fithub-text text-center py-8">Loading...</div>
            ) : (
              <div className="space-y-2">
                {leaderboardUsers
                  .sort((a, b) => (b.weekly_steps || 0) - (a.weekly_steps || 0))
                  .slice(0, 10)
                  .map((user, index) => (
                    <LeaderboardRow
                      key={user.id}
                      user={user}
                      rank={index + 1}
                      type="weekly"
                    />
                  ))}
              </div>
            )}
          </div>

          {/* Monthly Leaderboard */}
          <div className="section">
            <h2 className="section-title mb-4">Monthly Leaderboard</h2>
            {loading ? (
              <div className="text-fithub-text text-center py-8">Loading...</div>
            ) : (
              <div className="space-y-2">
                {leaderboardUsers
                  .sort((a, b) => (b.monthly_steps || 0) - (a.monthly_steps || 0))
                  .slice(0, 10)
                  .map((user, index) => (
                    <LeaderboardRow
                      key={user.id}
                      user={user}
                      rank={index + 1}
                      type="monthly"
                    />
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community; 