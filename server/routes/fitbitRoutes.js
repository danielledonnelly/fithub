const express = require('express');
const router = express.Router();
const FitbitController = require('../controllers/FitbitController');
const { authenticateToken } = require('../middleware/auth');

// Public route - no auth required for OAuth callback
router.get('/callback', FitbitController.handleCallback);

// Protected routes - require authentication
router.use(authenticateToken);

// Get OAuth authorization URL
router.get('/auth-url', FitbitController.getAuthUrl);

// Sync steps from Fitbit
router.post('/sync', FitbitController.syncSteps);

// Get connection status
router.get('/status', FitbitController.getConnectionStatus);

// Get sync status (whether sync is currently running)
router.get('/sync-status', FitbitController.getSyncStatus);

// Disconnect Fitbit
router.post('/disconnect', FitbitController.disconnect);

// Get steps for contribution graph
router.get('/steps-for-graph', FitbitController.getStepsForGraph);

// Get sync progress
router.get('/sync-progress', FitbitController.getSyncProgress);

module.exports = router;
