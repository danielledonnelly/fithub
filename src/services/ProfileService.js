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

  // Upload avatar image
  async uploadAvatar(file) {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`${API_BASE_URL}/upload/avatar`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  }
}

export default new ProfileService(); 