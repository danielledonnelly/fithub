// Step data service - centralized step data management
// This will be replaced with database operations in the future

class StepService {
  constructor() {
    this.stepData = {};
    this.initializeData();
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

  // Initialize with sample data
  initializeData() {
    this.stepData = this.generateSampleStepData();
  }

  // Get all step data with optional date filtering
  getAllSteps(startDate = null, endDate = null) {
    if (!startDate && !endDate) {
      return this.stepData;
    }

    const filteredData = {};
    Object.keys(this.stepData).forEach(date => {
      const dateObj = new Date(date);
      let includeDate = true;
      
      if (startDate && dateObj < new Date(startDate)) {
        includeDate = false;
      }
      if (endDate && dateObj > new Date(endDate)) {
        includeDate = false;
      }
      
      if (includeDate) {
        filteredData[date] = this.stepData[date];
      }
    });

    return filteredData;
  }

  // Get step data for a specific date
  getStepsByDate(date) {
    if (!this.isValidDateFormat(date)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }
    return this.stepData[date] || 0;
  }

  // Update step data for a specific date
  updateSteps(date, steps) {
    if (!this.isValidDateFormat(date)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }
    
    if (typeof steps !== 'number' || steps < 0) {
      throw new Error('Steps must be a non-negative number');
    }
    
    this.stepData[date] = steps;
    return { date, steps };
  }

  // Delete step data for a specific date
  deleteSteps(date) {
    if (!this.isValidDateFormat(date)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }
    
    if (this.stepData[date] !== undefined) {
      delete this.stepData[date];
      return true;
    }
    return false;
  }

  // Get step statistics with optional date filtering
  getStepStats(startDate = null, endDate = null) {
    const dataToAnalyze = this.getAllSteps(startDate, endDate);
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

  // Regenerate sample data
  regenerateData() {
    this.stepData = this.generateSampleStepData();
    return Object.keys(this.stepData).length;
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