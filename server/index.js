require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

// Debug: Check if JWT secret is loaded
console.log('JWT Secret loaded:', process.env.JWT_SECRET ? 'Yes' : 'No');
console.log('JWT Secret length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);

// Import routes
const stepRoutes = require('./routes/stepRoutes');
const authRoutes = require('./routes/authRoutes');
const fitbitRoutes = require('./routes/fitbitRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for base64 images
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // For form data
app.use(morgan('dev'));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'FitHub API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/steps', stepRoutes);
app.use('/api/fitbit', fitbitRoutes);
app.use('/api/upload', uploadRoutes);

// Temporary test endpoint for cron - remove after testing
app.get('/api/test-cron', async (req, res) => {
  try {
    const CronService = require('./services/CronService');
    console.log('Manual cron test triggered...');
    await CronService.syncRecentDaysForAllUsers();
    res.json({ message: 'Cron test completed - check terminal logs' });
  } catch (error) {
    console.error('Manual cron test failed:', error);
    res.status(500).json({ error: 'Cron test failed', message: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Start server - bind to all interfaces for nginx
app.listen(PORT, '0.0.0.0', () => {
  console.log(`FitHub API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Auth endpoints: http://localhost:${PORT}/api/auth`);
  console.log(`Steps endpoint: http://localhost:${PORT}/api/steps`);
  console.log(`Fitbit endpoints: http://localhost:${PORT}/api/fitbit`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Initialize cron jobs for background sync tasks
require('./cron/scheduler'); 