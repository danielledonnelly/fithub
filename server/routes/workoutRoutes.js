const express = require('express');
const router = express.Router();
const workoutController = require('../controllers/workoutController');

// Get workout statistics
router.get('/stats', workoutController.getStats);

// Get all workouts with filters
router.get('/', workoutController.getWorkouts);

// Get specific workout
router.get('/:id', workoutController.getWorkout);

// Create new workout
router.post('/', workoutController.createWorkout);

// Update workout
router.put('/:id', workoutController.updateWorkout);

// Delete workout
router.delete('/:id', workoutController.deleteWorkout);

module.exports = router; 