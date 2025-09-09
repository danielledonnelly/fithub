const cron = require('node-cron');
const CronService = require('../services/CronService');

// Schedule recent days sync every 6 hours (Newfoundland time)
// Cron pattern: '0 0,6,12,18 * * *' means at 00:00, 06:00, 12:00, 18:00 local time
cron.schedule('0 0,6,12,18 * * *', async () => {
  console.log('Cron: Starting scheduled recent days sync...');
  try {
    await CronService.syncRecentDaysForAllUsers();
  } catch (error) {
    console.error('Cron: Scheduled sync failed:', error);
  }
});

console.log('Cron scheduler initialized - recent days sync every 6 hours (00:00, 06:00, 12:00, 18:00)');
