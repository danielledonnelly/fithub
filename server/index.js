require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 5001;

// In-memory storage for development
const workouts = [];
let workoutId = 1;

// Step data storage
let stepData = {};

// Generate sample step data
const generateSampleStepData = () => {
  const data = {};
  const today = new Date();
  const startDate = new Date(today);
  startDate.setFullYear(startDate.getFullYear() - 1);
  startDate.setDate(startDate.getDate() + 1);
  
  for (let i = 0; i < 365; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateString = date.toISOString().split('T')[0];
    
    // Random step data between 0 and 10000
    const random = Math.random();
    if (random > 0.2) { // 80% chance of having steps
      data[dateString] = Math.floor(random * 10000);
    }
  }
  
  return data;
};

// Initialize with sample data
stepData = generateSampleStepData();

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

// Step Data Routes
app.get('/api/steps', (req, res) => {
  res.json(stepData);
});

app.post('/api/steps/regenerate', (req, res) => {
  stepData = generateSampleStepData();
  res.json({ 
    message: 'Step data regenerated successfully',
    data: stepData 
  });
});

app.put('/api/steps/:date', (req, res) => {
  const { date } = req.params;
  const { steps } = req.body;
  
  if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
  }
  
  if (typeof steps !== 'number' || steps < 0) {
    return res.status(400).json({ error: 'Steps must be a non-negative number' });
  }
  
  stepData[date] = steps;
  res.json({ 
    message: 'Steps updated successfully',
    date,
    steps
  });
});

app.delete('/api/steps/:date', (req, res) => {
  const { date } = req.params;
  
  if (stepData[date] !== undefined) {
    delete stepData[date];
    res.json({ message: 'Step data deleted successfully', date });
  } else {
    res.status(404).json({ error: 'No step data found for this date' });
  }
});

// Get step statistics
app.get('/api/steps/stats', (req, res) => {
  const totalSteps = Object.values(stepData).reduce((sum, steps) => sum + steps, 0);
  const activeDays = Object.values(stepData).filter(steps => steps > 0).length;
  const averageSteps = activeDays > 0 ? Math.round(totalSteps / activeDays) : 0;
  
  res.json({
    totalSteps,
    activeDays,
    averageSteps,
    totalDays: Object.keys(stepData).length
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
  console.log(`Step data available at http://localhost:${PORT}/api/steps`);
}); 