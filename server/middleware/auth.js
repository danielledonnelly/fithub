const jwt = require('jsonwebtoken');
const UserModel = require('../models/User');
const AuthService = require('../services/AuthService');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      message: 'Please login to access this resource' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        error: 'Invalid or expired token',
        message: 'Please login again' 
      });
    }
    
    // Attach user info to request
    req.user = user;
    next();
  });
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      req.user = null;
    } else {
      req.user = user;
    }
    next();
  });
};

// Generate access token (short-lived, allows resource access, automatically sent with every API request)
const generateToken = (user) => {
  return jwt.sign(
    { 
      sub: user.id, 
      username: user.username, 
      email: user.email 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Generate refresh token (longer lived, allows you to obtain new access tokens; When access token expires, you use the refresh token to get a new access token)
const generateRefreshToken = (user) => {
  return jwt.sign(
    { 
      sub: user.id, 
      username: user.username, 
      email: user.email,
      type: 'refresh'
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid refresh token');
    }
    return decoded;
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  JWT_SECRET
}; 