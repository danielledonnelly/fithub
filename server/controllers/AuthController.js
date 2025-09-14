const { z } = require('zod');
const AuthService = require('../services/AuthService');
const UserModel = require('../models/User');

// Zod schemas for validation (moved from routes)
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

class AuthController {
  // Register new user
  static async register(req, res) {
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
  }

  // Login user
  static async login(req, res) {
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
        user,
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
  }

  // Refresh token
  static async refreshToken(req, res) {
    try {
      const result = refreshSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: result.error.errors
        });
      }

      const { refreshToken } = result.data;

      // Use AuthService to handle refresh token validation and new token generation
      // This centralizes all authentication logic in AuthService instead of doing it manually
      const { token: newToken, refreshToken: newRefreshToken } = await AuthService.refreshToken(refreshToken);

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
  }

  // Get user profile
  static async getProfile(req, res) {
    try {
      const userId = req.user.sub;
      
      // Use AuthService to get profile (no direct UserModel calls)
      const profile = await AuthService.getProfile(userId);

      res.json({
        profile
      });
    } catch (error) {
      console.error('Profile fetch error:', error);
      res.status(500).json({
        error: 'Profile fetch failed',
        message: 'Unable to fetch user profile'
      });
    }
  }

  // Update user profile
  static async updateProfile(req, res) {
    try {
      const userId = req.user.sub;
      const { name, bio, avatar } = req.body;
      
      // Validate input
      if (name && typeof name !== 'string') {
        return res.status(400).json({
          error: 'Invalid name format'
        });
      }
      
      if (bio && typeof bio !== 'string') {
        return res.status(400).json({
          error: 'Invalid bio format'
        });
      }
      
      if (avatar && typeof avatar !== 'string') {
        return res.status(400).json({
          error: 'Invalid avatar format'
        });
      }

      // Use AuthService to update profile (no direct UserModel calls)
      const profile = await AuthService.updateProfile(userId, { name, bio, avatar });

      res.json({
        message: 'Profile updated successfully',
        profile
      });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(400).json({
        error: 'Profile update failed',
        message: error.message
      });
    }
  }

  // Logout (client-side token removal, but we can log it)
  static async logout(req, res) {
    // In a real app, you'd want to blacklist the token
    // For now, we'll just return success
    res.json({
      message: 'Logout successful'
    });
  }

  // Upload avatar
  static async uploadAvatar(req, res) {
    try {
      const userId = req.user.sub;
      
      if (!req.file) {
        return res.status(400).json({
          error: 'No file uploaded'
        });
      }
      
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      
      // Update user's avatar in database
      const profile = await AuthService.updateProfile(userId, { avatar: avatarUrl });
      
      res.json({
        message: 'Avatar uploaded successfully',
        avatarUrl: avatarUrl,
        profile
      });
    } catch (error) {
      console.error('Avatar upload error:', error);
      res.status(400).json({
        error: 'Avatar upload failed',
        message: error.message
      });
    }
  }

  // Verify token endpoint
  static async verifyToken(req, res) {
    res.json({
      message: 'Token is valid',
      user: req.user
    });
  }

  // Get user goals
  static async getGoals(req, res) {
    try {
      const userId = req.user.sub;
      
      // Get user with goal data
      const user = await UserModel.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      res.json({
        daily_goal: user.daily_goal,
        weekly_goal: user.weekly_goal,
        monthly_goal: user.monthly_goal
      });
    } catch (error) {
      console.error('Get goals error:', error);
      res.status(400).json({
        error: 'Failed to fetch goals',
        message: error.message
      });
    }
  }

  // Update user goals
  static async updateGoals(req, res) {
    try {
      const userId = req.user.sub;
      const { daily_goal, weekly_goal, monthly_goal } = req.body;
      
      // Validate input
      if (daily_goal !== undefined && (typeof daily_goal !== 'number' || daily_goal < 0)) {
        return res.status(400).json({
          error: 'Invalid daily goal format'
        });
      }
      
      if (weekly_goal !== undefined && (typeof weekly_goal !== 'number' || weekly_goal < 0)) {
        return res.status(400).json({
          error: 'Invalid weekly goal format'
        });
      }
      
      if (monthly_goal !== undefined && (typeof monthly_goal !== 'number' || monthly_goal < 0)) {
        return res.status(400).json({
          error: 'Invalid monthly goal format'
        });
      }

      // Update user goals
      const user = await UserModel.updateUser(userId, {
        daily_goal,
        weekly_goal,
        monthly_goal
      });

      res.json({
        message: 'Goals updated successfully',
        goals: {
          daily_goal: user.daily_goal,
          weekly_goal: user.weekly_goal,
          monthly_goal: user.monthly_goal
        }
      });
    } catch (error) {
      console.error('Update goals error:', error);
      res.status(400).json({
        error: 'Failed to update goals',
        message: error.message
      });
    }
  }
}

module.exports = AuthController;