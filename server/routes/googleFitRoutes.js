const express = require('express');
const router = express.Router();
const GoogleFitController = require('../controllers/GoogleFitController');
const { authenticateToken } = require('../middleware/auth');

// Public route - no auth required for OAuth callback
router.get('/callback', GoogleFitController.handleCallback);

// Protected routes - require authentication
router.use(authenticateToken);

// Get OAuth authorization URL
router.get('/auth-url', GoogleFitController.getAuthUrl);

// Sync steps from Google Fit
router.post('/sync', GoogleFitController.syncSteps);

// Get connection status
router.get('/status', GoogleFitController.getConnectionStatus);

// Disconnect Google Fit
router.post('/disconnect', GoogleFitController.disconnect);

module.exports = router;
