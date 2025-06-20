require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 5001; // Changed default port to 5001

// In-memory storage for development
const workouts = [];
let workoutId = 1;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev')); // HTTP request logger

// Temporary middleware for development - sets a mock user
app.use((req, res, next) => {
  req.user = { userId: 'dev-user-1' };
  next();
});

// Workout Routes
app.get('/api/workouts', (req, res) => {
  const userWorkouts = workouts.filter(w => w.userId === req.user.userId);
  res.json(userWorkouts);
});

app.get('/api/workouts/:id', (req, res) => {
  const workout = workouts.find(w => w.id === parseInt(req.params.id) && w.userId === req.user.userId);
  if (!workout) {
    return res.status(404).json({ error: 'Workout not found' });
  }
  res.json(workout);
});

app.post('/api/workouts', (req, res) => {
  const workout = {
    id: workoutId++,
    userId: req.user.userId,
    ...req.body,
    date: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  workouts.push(workout);
  res.status(201).json(workout);
});

app.put('/api/workouts/:id', (req, res) => {
  const index = workouts.findIndex(w => w.id === parseInt(req.params.id) && w.userId === req.user.userId);
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

app.delete('/api/workouts/:id', (req, res) => {
  const index = workouts.findIndex(w => w.id === parseInt(req.params.id) && w.userId === req.user.userId);
  if (index === -1) {
    return res.status(404).json({ error: 'Workout not found' });
  }
  workouts.splice(index, 1);
  res.json({ message: 'Workout deleted successfully' });
});

app.get('/api/workouts/stats', (req, res) => {
  const userWorkouts = workouts.filter(w => w.userId === req.user.userId);
  const stats = {
    totalWorkouts: userWorkouts.length,
    totalDuration: userWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0),
    totalCalories: userWorkouts.reduce((sum, w) => sum + (w.calories || 0), 0),
    avgDuration: userWorkouts.length ? userWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0) / userWorkouts.length : 0,
    workoutsByType: userWorkouts.reduce((acc, w) => {
      if (!acc[w.type]) acc[w.type] = 0;
      acc[w.type]++;
      return acc;
    }, {})
  };
  res.json(stats);
});

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    storage: 'in-memory'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/api/health`);
}); 