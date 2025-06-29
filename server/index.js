require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Import routes
const stepRoutes = require('./routes/stepRoutes');

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
    message: 'FitHub Steps API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Routes
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
  console.log(`🚀 FitHub Steps API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`👟 Steps endpoint: http://localhost:${PORT}/api/steps`);
  console.log(`📈 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET    /api/health`);
  console.log(`  GET    /api/steps`);
  console.log(`  GET    /api/steps/:date`);
  console.log(`  PUT    /api/steps/:date`);
  console.log(`  DELETE /api/steps/:date`);
  console.log(`  GET    /api/steps/stats/summary`);
  console.log(`  POST   /api/steps/regenerate`);
}); 