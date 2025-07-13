// Step data service - user-specific step data management
// This will be replaced with database operations in the future
const StepModel = require('../models/Step');

class StepService {
  constructor() {
    // Store data per user: { userId: { stepData: {...} } }
    this.userData = {};
    this.initializeDefaultUser();
  }

  // Generate sample step data for development
  generateSampleStepData() {
    const data = {};
    const today = new Date();
    const startDate = new Date(today);
    startDate.setFullYear(startDate.getFullYear() - 1);
    startDate.setDate(startDate.getDate() + 1);
    
    for (let i = 0; i < 365; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      // Random step data between 0 and 12000 with some days having no data
      const random = Math.random();
      if (random > 0.15) { // 85% chance of having steps
        data[dateString] = Math.floor(random * 12000);
      }
    }
    
    return data;
  }

  // Initialize default admin user with sample data
  initializeDefaultUser() {
    // Create sample data for admin user (id: 1)
    this.userData[1] = {
      stepData: this.generateSampleStepData()
    };
  }

  // Get or create user data
  getUserData(userId) {
    if (!this.userData[userId]) {
      this.userData[userId] = {
        stepData: this.generateSampleStepData()
      };
    }
    return this.userData[userId];
  }

  // Get all step data for a specific user with optional date filtering
  async getAllSteps(userId, startDate = null, endDate = null) {
    try {
      return await StepModel.getAllSteps(userId, startDate, endDate);
    } catch (error) {
      // Fallback to in-memory data if database fails
      const userData = this.getUserData(userId);
      const stepData = userData.stepData;

      if (!startDate && !endDate) {
        return stepData;
      }

      const filteredData = {};
      Object.keys(stepData).forEach(date => {
        const dateObj = new Date(date);
        let includeDate = true;
        
        if (startDate && dateObj < new Date(startDate)) {
          includeDate = false;
        }
        if (endDate && dateObj > new Date(endDate)) {
          includeDate = false;
        }
        
        if (includeDate) {
          filteredData[date] = stepData[date];
        }
      });

      return filteredData;
    }
  }

  // Get step data for a specific user and date
  async getStepsByDate(userId, date) {
    if (!this.isValidDateFormat(date)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }
    
    try {
      return await StepModel.getStepsByDate(userId, date);
    } catch (error) {
      // Fallback to in-memory data if database fails
      const userData = this.getUserData(userId);
      return userData.stepData[date] || 0;
    }
  }

  // Update step data for a specific user and date
  async updateSteps(userId, date, steps) {
    if (!this.isValidDateFormat(date)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }
    
    if (typeof steps !== 'number' || steps < 0) {
      throw new Error('Steps must be a non-negative number');
    }
    
    try {
      return await StepModel.updateSteps(userId, date, steps);
    } catch (error) {
      // Fallback to in-memory data if database fails
      const userData = this.getUserData(userId);
      userData.stepData[date] = steps;
      return { date, steps };
    }
  }

  // Delete step data for a specific user and date
  async deleteSteps(userId, date) {
    if (!this.isValidDateFormat(date)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }
    
    try {
      return await StepModel.deleteSteps(userId, date);
    } catch (error) {
      // Fallback to in-memory data if database fails
      const userData = this.getUserData(userId);
      if (userData.stepData[date] !== undefined) {
        delete userData.stepData[date];
        return true;
      }
      return false;
    }
  }

  // Get step statistics for a specific user with optional date filtering
  async getStepStats(userId, startDate = null, endDate = null) {
    try {
      return await StepModel.getStepStats(userId, startDate, endDate);
    } catch (error) {
      // Fallback to in-memory calculation if database fails
      const dataToAnalyze = await this.getAllSteps(userId, startDate, endDate);
      const stepValues = Object.values(dataToAnalyze);
      
      if (stepValues.length === 0) {
        return {
          totalSteps: 0,
          activeDays: 0,
          totalDays: 0,
          averageSteps: 0,
          maxSteps: 0,
          minSteps: 0
        };
      }
      
      const totalSteps = stepValues.reduce((sum, steps) => sum + steps, 0);
      const activeDays = stepValues.filter(steps => steps > 0).length;
      const averageSteps = activeDays > 0 ? Math.round(totalSteps / activeDays) : 0;
      const maxSteps = Math.max(...stepValues);
      const minSteps = stepValues.length > 0 ? Math.min(...stepValues.filter(steps => steps > 0)) : 0;
      
      return {
        totalSteps,
        activeDays,
        totalDays: Object.keys(dataToAnalyze).length,
        averageSteps,
        maxSteps,
        minSteps
      };
    }
  }

  // Regenerate sample data for a specific user
  regenerateData(userId) {
    const userData = this.getUserData(userId);
    userData.stepData = this.generateSampleStepData();
    return Object.keys(userData.stepData).length;
  }

  // Validate date format
  isValidDateFormat(date) {
    return /^\d{4}-\d{2}-\d{2}$/.test(date);
  }

  // Future: This is where we'll add Apple Health and Android Health API integration
  // async syncWithAppleHealth(userId) {
  //   // Implementation for Apple Health integration
  // }
  
  // async syncWithAndroidHealth(userId) {
  //   // Implementation for Android Health integration
  // }
}

// Export singleton instance
module.exports = new StepService();