const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

class GoalService {
  static async getGoals() {
    const token = localStorage.getItem('fithub_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/auth/goals`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch goals: ${response.status} ${errorText}`);
    }

    return await response.json();
  }

  static async updateGoals(goals) {
    const token = localStorage.getItem('fithub_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/auth/goals`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(goals)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update goals: ${response.status} ${errorText}`);
    }

    return await response.json();
  }
}

export default GoalService;
