const express = require('express');
const router = express.Router();
const StepService = require('../services/StepService');
const { authenticateToken } = require('../middleware/auth');

// Get all step data with optional date filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user.sub;
    const data = await StepService.getAllSteps(userId, startDate, endDate);
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get step data for a specific date
router.get('/:date', authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;
    const userId = req.user.sub;
    const steps = await StepService.getStepsByDate(userId, date);
    res.json({ date, steps });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update step data for a specific date
router.put('/:date', authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;
    const { steps } = req.body;
    const userId = req.user.sub;
    const result = await StepService.updateSteps(userId, date, steps);
    res.json({ 
      message: 'Steps updated successfully',
      ...result
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete step data for a specific date
router.delete('/:date', authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;
    const userId = req.user.sub;
    const deleted = await StepService.deleteSteps(userId, date);
    
    if (deleted) {
      res.json({ message: 'Step data deleted successfully', date });
    } else {
      res.status(404).json({ error: 'No step data found for this date' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get step statistics with optional date filtering
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user.sub;
    const stats = await StepService.getStepStats(userId, startDate, endDate);
    res.json(stats);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Regenerate sample data (for development)
router.post('/regenerate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub;
    const totalDays = await StepService.regenerateData(userId);
    res.json({ 
      message: 'Step data regenerated successfully',
      totalDays
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;