const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

class StepService {
  async getAllSteps() {
    try {
      const response = await fetch(`${API_BASE_URL}/steps`);
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
      const response = await fetch(`${API_BASE_URL}/steps/stats/summary`);
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
}

const stepService = new StepService();
export default stepService; 