const FitbitController = require('../controllers/FitbitController');
const UserModel = require('../models/User');

class CronService {
  // Background sync that keeps recent data fresh for all users
  static async syncRecentDaysForAllUsers() {
    try {
      console.log('Cron: Starting recent days sync for all users');
      
      // Get all users with active Fitbit connections
      const connectedUsers = await UserModel.getAllFitbitConnectedUsers();
      
      if (connectedUsers.length === 0) {
        console.log('Cron: No users with Fitbit connections found');
        return;
      }
      
      console.log(`Cron: Found ${connectedUsers.length} users with Fitbit connections`);
      
      let successCount = 0;
      let failureCount = 0;
      
      // Process each user individually to avoid overwhelming the API
      for (const user of connectedUsers) {
        try {
          await CronService.syncRecentDaysForUser(user.id);
          successCount++;
          
          // Delay between users to be respectful to Fitbit's API
          await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (error) {
          failureCount++;
          console.error(`Cron: Failed to sync user ${user.id}:`, error.message);
        }
      }
      
      console.log(`Cron: Recent days sync completed - Success: ${successCount}, Failed: ${failureCount}`);
    } catch (error) {
      console.error('Cron: Failed to run recent days sync:', error);
    }
  }

  // Sync the last 3 days for a specific user to catch any missed data
  static async syncRecentDaysForUser(userId) {
    const today = new Date();
    const daysToSync = [];
    
    // Get today, yesterday, and day before yesterday
    for (let i = 0; i < 3; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      daysToSync.push(date);
    }
    
    console.log(`Cron: Syncing last 3 days for user ${userId}`);
    
    // Use the specific days sync method to update these days
    await FitbitController.syncSpecificDays(userId, daysToSync);
  }
}

module.exports = CronService;
