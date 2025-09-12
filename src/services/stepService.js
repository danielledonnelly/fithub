const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

class StepService {
  // Get auth headers from localStorage
  getAuthHeaders() {
    const token = localStorage.getItem('fithub_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  async getAllSteps() {
    try {
      const response = await fetch(`${API_BASE_URL}/steps`, {
        headers: {
          ...this.getAuthHeaders(),
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching step data:', error);
      throw error;
    }
  }

  async updateSteps(date, steps) {
    try {
      const response = await fetch(`${API_BASE_URL}/steps/${date}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify({ steps }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating step data:', error);
      throw error;
    }
  }

  async regenerateStepData() {
    try {
      const response = await fetch(`${API_BASE_URL}/steps/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error regenerating step data:', error);
      throw error;
    }
  }

  async getStepStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/steps/stats/summary`, {
        headers: {
          ...this.getAuthHeaders(),
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching step stats:', error);
      throw error;
    }
  }

  async deleteSteps(date) {
    try {
      const response = await fetch(`${API_BASE_URL}/steps/${date}`, {
        method: 'DELETE',
        headers: {
          ...this.getAuthHeaders(),
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error deleting step data:', error);
      throw error;
    }
  }

  async deleteAllSteps() {
    try {
      const response = await fetch(`${API_BASE_URL}/steps/`, {
        method: 'DELETE',
        headers: {
          ...this.getAuthHeaders(),
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error deleting all step data:', error);
      throw error;
    }
  }

  async getSyncProgress() {
    try {
      const response = await fetch(`${API_BASE_URL}/fitbit/sync-progress`, {
        headers: {
          ...this.getAuthHeaders(),
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching sync progress:', error);
      throw error;
    }
  }
}

export default new StepService();