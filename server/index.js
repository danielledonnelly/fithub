require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Debug: Check if JWT secret is loaded
console.log('JWT Secret loaded:', process.env.JWT_SECRET ? 'Yes' : 'No');
console.log('JWT Secret length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);

// Import routes
const stepRoutes = require('./routes/stepRoutes');
const authRoutes = require('./routes/authRoutes');
const googleFitRoutes = require('./routes/googleFitRoutes');

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
app.use('/api/google-fit', googleFitRoutes);

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

// Start server
app.listen(PORT, () => {
  console.log(`FitHub API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Auth endpoints: http://localhost:${PORT}/api/auth`);
  console.log(`Steps endpoint: http://localhost:${PORT}/api/steps`);
  console.log(`Google Fit endpoints: http://localhost:${PORT}/api/google-fit`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}); 