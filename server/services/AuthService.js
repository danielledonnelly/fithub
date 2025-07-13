// server/services/AuthService.js
// Handles all authentication business logic including login, register, token validation, and refresh
// Separates authentication logic from data operations (UserModel) and HTTP handling (routes)
const UserModel = require('../models/User');
const { generateToken, generateRefreshToken } = require('../middleware/auth');

class AuthService {
  // Login user
  static async login(email, password) {
    // Get user (without password)
    const user = UserModel.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Validate password (this method handles the hashed comparison)
    const isValidPassword = await UserModel.validatePassword(user, password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate tokens for authenticated session
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    return {
      user,
      token,
      refreshToken
    };
  }

  // Register new user
  static async register(userData) {
    const { user, token, refreshToken } = await AuthService.register({ username, email, password });

    return {
      user,
      token,
      refreshToken
    };
  }

  // Check if user is authenticated (verify token and get user)
  static async checkAuth(token) {
    try {
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
      
      // Verify token and decode payload
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Get user from database using sub claim
      const user = UserModel.findById(decoded.sub);
      if (!user) {
        throw new Error('User not found');
      }
      
      return user;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Refresh access token using refresh token
  static async refreshToken(refreshToken) {
    try {
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
      
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, JWT_SECRET);
      
      // Check if it's actually a refresh token (not an access token)
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid refresh token');
      }
      
      // Get user from database using sub claim
      const user = UserModel.findById(decoded.sub);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate new tokens for continued session
      const newToken = generateToken(user);
      const newRefreshToken = generateRefreshToken(user);

      return {
        token: newToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }
}

module.exports = AuthService;