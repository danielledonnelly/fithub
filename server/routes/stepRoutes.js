const express = require('express');
const router = express.Router(); // this creates a nested router 
const StepController = require('../controllers/StepController');
const upload = require('../middleware/upload');
const { authenticateToken } = require('../middleware/auth');
router.use(authenticateToken);

// Get all step data with optional date filtering
// The bodies for each function can live as controller - controller class can be called with request and response
// All this has to do is route from a path to a controller  - stepController.getSteps
router.get('/', StepController.getAllSteps);

// Get step statistics with optional date filtering
router.get('/stats/summary', StepController.getStepStats);

// Get step statistics (weekly, monthly)
router.get('/stats', StepController.getStepStats);

// Get total statistics (all-time total steps and active days)
router.get('/total-stats', StepController.getTotalStats);

// Test route to see if the controller is working
router.get('/test', (req, res) => {
  res.json({ message: 'StepController is working' });
});

// Regenerate sample data (for development)
router.post('/regenerate', StepController.regenerateData);

// Upload screenshot for step extraction
router.post('/upload-screenshot', upload.single('screenshot'), StepController.uploadScreenshot);

// Get step data for a specific date
router.get('/:date', StepController.getStepsByDate);

// Update step data for a specific date
router.put('/:date', StepController.updateSteps);

// Delete step data for a specific date
router.delete('/:date', StepController.deleteSteps);

module.exports = router;