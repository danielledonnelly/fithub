// Handles all authentication business logic including login, register, token validation, and refresh
// Separates authentication logic from data operations (UserModel) and HTTP handling (routes)
const UserModel = require('../models/User');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';

// Define token generation functions locally to avoid circular dependency
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

class AuthService {
  // Login user
  static async login(email, password) {
    // Get user (without password)
    // UserModel methods are async (they query the database), so we must await them
    // Without await, we get a Promise object instead of the actual user data
    const user = await UserModel.findByEmail(email);
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
    // Create new user in database
    const user = await UserModel.createUser(userData);
    
    // Generate tokens for new user
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    
    return { user, token, refreshToken };
  }

  // Check if user is authenticated (verify token and get user)
  static async checkAuth(token) {
    try {
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';
      
      // Verify token and decode payload
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Database queries are asynchronous operations that return Promises
      // We must await to get the actual user data from the database
      const user = await UserModel.findById(decoded.sub);
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
      const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';
      
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, JWT_SECRET);
      
      // Check if it's actually a refresh token (not an access token)
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid refresh token');
      }
      
      // UserModel.findById performs a database query which is async
      // await ensures we get the user data before proceeding with token generation
      const user = await UserModel.findById(decoded.sub);
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

  // Get user profile
static async getProfile(userId) {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  return {
    name: user.display_name || user.username,
    bio: user.bio || '',
    avatar: user.avatar || ''
  };
}

  // Update user profile
  static async updateProfile(userId, updates) {
  const updatedUser = await UserModel.updateUser(userId, updates);
  
  return {
    name: updatedUser.display_name || updatedUser.username,
    bio: updatedUser.bio || '',
    avatar: updatedUser.avatar || ''
  };
}

static async deleteUser(userId) {
  const deletedUser = await UserModel.deleteUser(userId);
  return deletedUser;
}

}

module.exports = AuthService;