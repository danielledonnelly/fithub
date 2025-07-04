require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Import routes
const stepRoutes = require('./routes/stepRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

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
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableRoutes: [
      'GET /api/health',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'POST /api/auth/refresh',
      'GET /api/auth/profile',
      'PUT /api/auth/profile',
      'POST /api/auth/logout',
      'GET /api/auth/verify',
      'GET /api/steps',
      'GET /api/steps/:date',
      'PUT /api/steps/:date',
      'DELETE /api/steps/:date',
      'GET /api/steps/stats/summary',
      'POST /api/steps/regenerate'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 FitHub API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
  console.log(`👟 Steps endpoint: http://localhost:${PORT}/api/steps`);
  console.log(`📈 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET    /api/health`);
  console.log(`  POST   /api/auth/register`);
  console.log(`  POST   /api/auth/login`);
  console.log(`  POST   /api/auth/refresh`);
  console.log(`  GET    /api/auth/profile`);
  console.log(`  PUT    /api/auth/profile`);
  console.log(`  POST   /api/auth/logout`);
  console.log(`  GET    /api/auth/verify`);
  console.log(`  GET    /api/steps (requires auth)`);
  console.log(`  GET    /api/steps/:date (requires auth)`);
  console.log(`  PUT    /api/steps/:date (requires auth)`);
  console.log(`  DELETE /api/steps/:date (requires auth)`);
  console.log(`  GET    /api/steps/stats/summary (requires auth)`);
  console.log(`  POST   /api/steps/regenerate (requires auth)`);
  console.log(`\nDefault test user: admin@fithub.com / password`);
}); 