const express = require('express');
const router = express.Router();
const stepService = require('../services/stepService');

// Get all step data with optional date filtering
router.get('/', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const data = stepService.getAllSteps(startDate, endDate);
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get step data for a specific date
router.get('/:date', (req, res) => {
  try {
    const { date } = req.params;
    const steps = stepService.getStepsByDate(date);
    res.json({ date, steps });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update step data for a specific date
router.put('/:date', (req, res) => {
  try {
    const { date } = req.params;
    const { steps } = req.body;
    const result = stepService.updateSteps(date, steps);
    res.json({ 
      message: 'Steps updated successfully',
      ...result
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete step data for a specific date
router.delete('/:date', (req, res) => {
  try {
    const { date } = req.params;
    const deleted = stepService.deleteSteps(date);
    
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
router.get('/stats/summary', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const stats = stepService.getStepStats(startDate, endDate);
    res.json(stats);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Regenerate sample data (for development)
router.post('/regenerate', (req, res) => {
  try {
    const totalDays = stepService.regenerateData();
    res.json({ 
      message: 'Step data regenerated successfully',
      totalDays
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 