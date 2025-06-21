require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 5001;

// In-memory storage for development
const workouts = [];
let workoutId = 1;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev')); // HTTP request logger

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running'
  });
});

// Workout Routes
app.get('/api/workouts', (req, res) => {
  res.json(workouts);
});

app.post('/api/workouts', (req, res) => {
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

app.get('/api/workouts/:id', (req, res) => {
  const workout = workouts.find(w => w.id === parseInt(req.params.id));
  if (!workout) {
    return res.status(404).json({ error: 'Workout not found' });
  }
  res.json(workout);
});

app.put('/api/workouts/:id', (req, res) => {
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

app.delete('/api/workouts/:id', (req, res) => {
  const index = workouts.findIndex(w => w.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Workout not found' });
  }
  workouts.splice(index, 1);
  res.json({ message: 'Workout deleted successfully' });
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