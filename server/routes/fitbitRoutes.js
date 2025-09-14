const express = require('express');
const router = express.Router();
const FitbitController = require('../controllers/FitbitController');
const { authenticateToken } = require('../middleware/auth');

// Public route - no auth required for OAuth callback
router.get('/callback', FitbitController.handleCallback);

// Simple cron test without authentication (for debugging)
router.get('/test-cron-simple', async (req, res) => {
  try {
    console.log('Simple cron test triggered at:', new Date().toISOString());
    const CronService = require('../services/CronService');
    await CronService.syncRecentDaysForAllUsers();
    res.json({ 
      success: true, 
      message: 'Simple cron test completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Simple cron test failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Simple cron test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Protected routes - require authentication
router.use(authenticateToken);

// Get OAuth authorization URL
router.get('/auth-url', FitbitController.getAuthUrl);

// Sync steps from Fitbit
router.post('/sync', FitbitController.syncSteps);

// Get connection status
router.get('/status', FitbitController.getConnectionStatus);

// Test cron service manually (for debugging)
router.post('/test-cron', async (req, res) => {
  try {
    console.log('Manual cron test triggered at:', new Date().toISOString());
    const CronService = require('../services/CronService');
    await CronService.syncRecentDaysForAllUsers();
    res.json({ 
      success: true, 
      message: 'Cron test completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Manual cron test failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Cron test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get sync status (whether sync is currently running)
router.get('/sync-status', FitbitController.getSyncStatus);

// Disconnect Fitbit
router.post('/disconnect', FitbitController.disconnect);

// Get steps for contribution graph
router.get('/steps-for-graph', FitbitController.getStepsForGraph);

// Get sync progress
router.get('/sync-progress', FitbitController.getSyncProgress);

module.exports = router;
