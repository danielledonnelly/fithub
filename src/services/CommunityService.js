const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

class CommunityService {
  // Get auth headers from localStorage
  getAuthHeaders() {
    const token = localStorage.getItem('fithub_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  // Search users by username
  async searchUsers(query) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/search?query=${encodeURIComponent(query)}`, {
        headers: {
          ...this.getAuthHeaders(),
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  // Get leaderboard data
  async getLeaderboard() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/leaderboard`, {
        headers: {
          ...this.getAuthHeaders(),
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  }

  // Get user by username
  async getUserByUsername(username) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/user/${encodeURIComponent(username)}`, {
        headers: {
          ...this.getAuthHeaders(),
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }
}

export default new CommunityService();
