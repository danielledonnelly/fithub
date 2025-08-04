const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

class ProfileService {
  // Get auth headers from localStorage
  getAuthHeaders() {
    const token = localStorage.getItem('fithub_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  // Get user profile from database
  async getProfile() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: {
          ...this.getAuthHeaders(),
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.profile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }

  // Update user profile in database
  async updateProfile(updates) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.profile;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }
}

export default new ProfileService(); 