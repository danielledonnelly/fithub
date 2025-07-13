const express = require('express');
const { z } = require('zod');
const router = express.Router();
const UserModel = require('../models/User');
const AuthService = require('../services/AuthService');
const { 
  authenticateToken, 
  generateToken, 
  generateRefreshToken, 
  verifyRefreshToken 
} = require('../middleware/auth');

// Zod schemas for validation
const registerSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters long')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string()
    .email('Please provide a valid email address')
    .transform(email => email.toLowerCase()),
  password: z.string()
    .min(6, 'Password must be at least 6 characters long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number')
});

const loginSchema = z.object({
  email: z.string()
    .email('Please provide a valid email address')
    .transform(email => email.toLowerCase()),
  password: z.string()
    .min(1, 'Password is required')
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

const profileUpdateSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters long')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .optional(),
  email: z.string()
    .email('Please provide a valid email address')
    .transform(email => email.toLowerCase())
    .optional()
});

// Register new user
router.post('/register', async (req, res) => {
  try {
    const result = registerSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.errors
      });
    }

    const { username, email, password } = result.data;

    // Use AuthService instead of direct UserModel calls
    // AuthService handles user creation AND token generation
    const { user, token, refreshToken } = await AuthService.register({ username, email, password });

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      error: 'Registration failed',
      message: error.message
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const result = loginSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.errors
      });
    }

    const { email, password } = result.data;

    // Use AuthService instead of manual user lookup and password validation
    // AuthService handles all authentication logic in one place
    const { user, token, refreshToken } = await AuthService.login(email, password); 

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'An error occurred during login'
    });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const result = refreshSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: result.error.errors
   });
  }

  const { refreshToken } = result.data;

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Find user
    const user = UserService.findById(decoded.sub);

    // Generate new tokens
    const { password: _, ...userWithoutPassword } = user;
    const newToken = generateToken(userWithoutPassword);
    const newRefreshToken = generateRefreshToken(userWithoutPassword);

    res.json({
      message: 'Token refreshed successfully',
      token: newToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      error: 'Token refresh failed',
      message: 'Invalid or expired refresh token'
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, (req, res) => {
  try {
    const user = UserService.findById(req.user.sub);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      error: 'Profile fetch failed',
      message: 'Unable to fetch user profile'
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const result = profileUpdateSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.errors
      });
    }

    const updates = result.data;
    const updatedUser = UserService.updateUser(req.user.sub, updates);

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(400).json({
      error: 'Profile update failed',
      message: error.message
    });
  }
});

// Logout (client-side token removal, but we can log it)
router.post('/logout', authenticateToken, (req, res) => {
  // In a real app, you'd want to blacklist the token
  // For now, we'll just return success
  res.json({
    message: 'Logout successful'
  });
});

// Verify token endpoint
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    message: 'Token is valid',
    user: req.user
  });
});

module.exports = router; 