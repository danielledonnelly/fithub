const express = require('express');
const router = express.Router();

// In-memory storage
const workouts = [];
let workoutId = 1;

// Get all workouts
router.get('/', (req, res) => {
  const { type, startDate, endDate } = req.query;
  let filteredWorkouts = [...workouts];

  if (type) {
    filteredWorkouts = filteredWorkouts.filter(w => w.type === type);
  }
  if (startDate) {
    filteredWorkouts = filteredWorkouts.filter(w => new Date(w.date) >= new Date(startDate));
  }
  if (endDate) {
    filteredWorkouts = filteredWorkouts.filter(w => new Date(w.date) <= new Date(endDate));
  }

  res.json(filteredWorkouts);
});

// Get workout by ID
router.get('/:id', (req, res) => {
  const workout = workouts.find(w => w.id === parseInt(req.params.id));
  if (!workout) {
    return res.status(404).json({ error: 'Workout not found' });
  }
  res.json(workout);
});

// Create new workout
router.post('/', (req, res) => {
  const workout = {
    id: workoutId++,
    ...req.body,
    date: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  workouts.push(workout);
  res.status(201).json(workout);
});

// Update workout
router.put('/:id', (req, res) => {
  const index = workouts.findIndex(w => w.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Workout not found' });
  }

  workouts[index] = {
    ...workouts[index],
    ...req.body,
    updatedAt: new Date()
  };

  res.json(workouts[index]);
});

// Delete workout
router.delete('/:id', (req, res) => {
  const index = workouts.findIndex(w => w.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Workout not found' });
  }

  workouts.splice(index, 1);
  res.json({ message: 'Workout deleted successfully' });
});

// Get workout statistics
router.get('/stats/summary', (req, res) => {
  const { startDate, endDate } = req.query;
  let filteredWorkouts = [...workouts];

  if (startDate || endDate) {
    if (startDate) {
      filteredWorkouts = filteredWorkouts.filter(w => new Date(w.date) >= new Date(startDate));
    }
    if (endDate) {
      filteredWorkouts = filteredWorkouts.filter(w => new Date(w.date) <= new Date(endDate));
    }
  }

  const stats = {
    totalWorkouts: filteredWorkouts.length,
    totalDuration: filteredWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0),
    totalCalories: filteredWorkouts.reduce((sum, w) => sum + (w.calories || 0), 0),
    avgDuration: filteredWorkouts.length 
      ? filteredWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0) / filteredWorkouts.length 
      : 0,
    workoutsByType: filteredWorkouts.reduce((acc, w) => {
      acc[w.type] = (acc[w.type] || 0) + 1;
      return acc;
    }, {})
  };

  res.json(stats);
});

module.exports = router; 