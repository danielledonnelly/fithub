/**
 * StepService - Service layer for step data management
 * 
 * This service acts as a bridge between the API controllers and the database model.
 * It provides:
 * - Fallback mechanisms when database is unavailable
 * - Data validation and formatting
 * - Business logic for step calculations
 * - Sample data generation for development
 * 
 * Architecture: Service Layer Pattern
 * - Controllers call this service
 * - Service calls StepModel for database operations
 * - Provides fallback to in-memory data if database fails
 */
const StepModel = require('../models/Step');

class StepService {
  constructor() {
    // In-memory fallback storage: { userId: { stepData: {...} } }
    // Used when database is unavailable or for development
    this.userData = {};
    this.initializeDefaultUser();
  }

  /**
   * Generate realistic sample step data for development and testing
   * 
   * Creates 365 days of synthetic step data with realistic patterns:
   * - 85% of days have step data (15% are rest days)
   * - Random step counts between 0-12,000
   * - Covers the past year for comprehensive testing
   * 
   * @returns {Object} Object with date keys and step values
   */
  generateSampleStepData() {
    const data = {};
    const today = new Date();
    const startDate = new Date(today);
    startDate.setFullYear(startDate.getFullYear() - 1);
    startDate.setDate(startDate.getDate() + 1);
    
    // Generate 365 days of sample data
    for (let i = 0; i < 365; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      // Realistic step data: 85% of days have steps, 15% are rest days
      const random = Math.random();
      if (random > 0.15) { // 85% chance of having steps
        data[dateString] = Math.floor(random * 12000);
      }
    }
    
    return data;
  }

  /**
   * Initialize default admin user with sample data
   * 
   * Creates sample data for user ID 1 (admin) for development purposes.
   * This ensures the app has data to display during development.
   */
  initializeDefaultUser() {
    // Create sample data for admin user (id: 1)
    this.userData[1] = {
      stepData: this.generateSampleStepData()
    };
  }

  /**
   * Get or create user data in memory fallback
   * 
   * If user doesn't exist in memory, creates them with sample data.
   * This is used as a fallback when database operations fail.
   * 
   * @param {number} userId - The user's ID
   * @returns {Object} User data object with stepData property
   */
  getUserData(userId) {
    if (!this.userData[userId]) {
      this.userData[userId] = {
        stepData: this.generateSampleStepData()
      };
    }
    return this.userData[userId];
  }

  /**
   * Get all step data for a user with optional date filtering
   * 
   * Primary method for retrieving step data. Attempts database first,
   * falls back to in-memory data if database is unavailable.
   * 
   * @param {number} userId - The user's ID
   * @param {string|null} startDate - Optional start date filter (YYYY-MM-DD)
   * @param {string|null} endDate - Optional end date filter (YYYY-MM-DD)
   * @returns {Object} Step data object with date keys and step values
   */
  async getAllSteps(userId, startDate = null, endDate = null) {
    try {
      // Try database first - this is the primary data source
      return await StepModel.getAllSteps(userId, startDate, endDate);
    } catch (error) {
      // Fallback to in-memory data if database fails
      console.warn('Database unavailable, using in-memory fallback for getAllSteps');
      const userData = this.getUserData(userId);
      const stepData = userData.stepData;

      // If no date filtering requested, return all data
      if (!startDate && !endDate) {
        return stepData;
      }

      // Apply date filtering to in-memory data
      const filteredData = {};
      Object.keys(stepData).forEach(date => {
        const dateObj = new Date(date);
        let includeDate = true;
        
        // Check start date filter
        if (startDate && dateObj < new Date(startDate)) {
          includeDate = false;
        }
        // Check end date filter
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

  /**
   * Get step data for a specific user and date
   * 
   * @param {number} userId - The user's ID
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {number} Total steps for that date (0 if no data)
   */
  async getStepsByDate(userId, date) {
    // Validate date format before processing
    if (!this.isValidDateFormat(date)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }
    
    try {
      return await StepModel.getStepsByDate(userId, date);
    } catch (error) {
      // Fallback to in-memory data if database fails
      console.warn('Database unavailable, using in-memory fallback for getStepsByDate');
      const userData = this.getUserData(userId);
      return userData.stepData[date] || 0;
    }
  }

  /**
   * Update step data for a specific user and date
   * 
   * Used for manual step entry through the UI. Includes validation
   * and fallback mechanisms.
   * 
   * @param {number} userId - The user's ID
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {number} steps - Number of steps to record
   * @returns {Object} Confirmation object with date and steps
   * @throws {Error} If date format is invalid or steps is negative
   */
  async updateSteps(userId, date, steps) {
    // Validate date format
    if (!this.isValidDateFormat(date)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }
    
    // Validate step count
    if (typeof steps !== 'number' || steps < 0) {
      throw new Error('Steps must be a non-negative number');
    }
    
    try {
      return await StepModel.updateSteps(userId, date, steps);
    } catch (error) {
      // Fallback to in-memory data if database fails
      console.warn('Database unavailable, using in-memory fallback for updateSteps');
      const userData = this.getUserData(userId);
      userData.stepData[date] = steps;
      return { date, steps };
    }
  }

  /**
   * Delete step data for a specific user and date
   * 
   * @param {number} userId - The user's ID
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {boolean} True if data was deleted
   */
  async deleteSteps(userId, date) {
    if (!this.isValidDateFormat(date)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }
    
    try {
      return await StepModel.deleteSteps(userId, date);
    } catch (error) {
      // Fallback to in-memory data if database fails
      console.warn('Database unavailable, using in-memory fallback for deleteSteps');
      const userData = this.getUserData(userId);
      if (userData.stepData[date] !== undefined) {
        delete userData.stepData[date];
        return true;
      }
      return false;
    }
  }

  // Delete all step data for a user
  async deleteAllSteps(userId) {
    try {
      return await StepModel.deleteAllSteps(userId);
    } catch (error) {
      // Fallback to in-memory data if database fails
      console.warn('Database unavailable, using in-memory fallback for deleteAllSteps');
      const userData = this.getUserData(userId);
      const count = Object.keys(userData.stepData).length;
      userData.stepData = {};
      return count;
    }
  }

  /**
   * Get comprehensive step statistics for a user
   * 
   * Calculates various metrics including totals, averages, and activity patterns.
   * Used for dashboard summaries and progress tracking.
   * 
   * @param {number} userId - The user's ID
   * @param {string|null} startDate - Optional start date filter (YYYY-MM-DD)
   * @param {string|null} endDate - Optional end date filter (YYYY-MM-DD)
   * @returns {Object} Statistics object with various metrics
   */
  async getStepStats(userId, startDate = null, endDate = null) {
    try {
      return await StepModel.getStepStats(userId, startDate, endDate);
    } catch (error) {
      // Fallback to in-memory calculation if database fails
      console.warn('Database unavailable, calculating stats from in-memory data');
      const dataToAnalyze = await this.getAllSteps(userId, startDate, endDate);
      const stepValues = Object.values(dataToAnalyze);
      
      // Handle empty dataset
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
      
      // Calculate statistics from step values
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

  /**
   * Regenerate sample data for a specific user
   * 
   * Used for development and testing. Creates fresh sample data
   * for a user, replacing any existing data.
   * 
   * @param {number} userId - The user's ID
   * @returns {number} Number of days of sample data generated
   */
  regenerateData(userId) {
    const userData = this.getUserData(userId);
    userData.stepData = this.generateSampleStepData();
    return Object.keys(userData.stepData).length;
  }

  /**
   * Get step statistics for specific time periods (weekly, monthly)
   * 
   * Calculates step totals for the last 7 days and last 30 days.
   * Used for dashboard summaries and progress tracking.
   * 
   * @param {number} userId - The user's ID
   * @returns {Object} Object with weeklySteps and monthlySteps
   */
  async getStepStats(userId) {
    try {
      const StepModel = require('../models/Step');
      
      // Calculate date ranges for different periods
      const today = new Date();
      const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
      
      // Format dates for database query (YYYY-MM-DD)
      const todayStr = today.toISOString().split('T')[0];
      const weekAgoStr = oneWeekAgo.toISOString().split('T')[0];
      const monthAgoStr = oneMonthAgo.toISOString().split('T')[0];
      
      console.log(`Calculating stats for user ${userId}:`);
      console.log(`Today: ${todayStr}`);
      console.log(`Week ago: ${weekAgoStr}`);
      console.log(`Month ago: ${monthAgoStr}`);
      
      // Get weekly steps (last 7 days)
      const weeklySteps = await StepModel.getStepsSumInRange(userId, weekAgoStr, todayStr);
      console.log(`Weekly steps: ${weeklySteps}`);
      
      // Get monthly steps (last 30 days)
      const monthlySteps = await StepModel.getStepsSumInRange(userId, monthAgoStr, todayStr);
      console.log(`Monthly steps: ${monthlySteps}`);
      
      return {
        weeklySteps,
        monthlySteps
      };
    } catch (error) {
      console.error('Error calculating step stats:', error);
      return {
        weeklySteps: 0,
        monthlySteps: 0
      };
    }
  }

  /**
   * Validate date format
   * 
   * Ensures dates are in the correct YYYY-MM-DD format before processing.
   * 
   * @param {string} date - Date string to validate
   * @returns {boolean} True if date format is valid
   */
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