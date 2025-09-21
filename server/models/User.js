const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const {pool} = require('../db');

// 
class UserModel {
  // Create user
  static async createUser(userData) {
    const { username, email, password } = userData;
    
    // Check if user already exists
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }
    
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Model should only do line 30-34 - rest is business logic that belongs in service 
    // Hashing goes beyond the scope of model, belongs in service. application is a collection of services put together
    // Keep model as just database code

    // Insert user into database with profile fields
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password, display_name, bio, avatar) VALUES (?, ?, ?, ?, ?, ?)',
      [username, email.toLowerCase(), hashedPassword, username, '', '']
    );
    
    // Return user without password
    return {
      id: result.insertId,
      username,
      email: email.toLowerCase(),
      display_name: username,
      bio: '',
      avatar: ''
    };
  }

  // Get user by ID
  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, username, email, display_name, bio, avatar, daily_goal, weekly_goal, monthly_goal, google_fit_connected, google_fit_connected_at, google_fit_last_sync, fitbit_connected, fitbit_connected_at, fitbit_last_sync, fitbit_access_token, fitbit_refresh_token FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  // Get user by email
  static async findByEmail(email) {
    const [rows] = await pool.query(
      'SELECT id, username, email, display_name, bio, avatar FROM users WHERE email = ?',
      [email.toLowerCase()]
    );
    return rows[0] || null;
  }

  // Get user by username
  static async findByUsername(username) {
    const [rows] = await pool.query(
      'SELECT id, username, email, display_name, bio, avatar, daily_goal, weekly_goal, monthly_goal FROM users WHERE username = ?',
      [username]
    );
    return rows[0] || null;
  }

  // Search users by username
  static async searchUsers(query, limit = 10) {
    const [rows] = await pool.query(
      'SELECT id, username, display_name, bio, avatar FROM users WHERE username LIKE ? OR display_name LIKE ? ORDER BY username LIMIT ?',
      [`%${query}%`, `%${query}%`, limit]
    );
    return rows;
  }

  // Get all users for leaderboards (with step data)
  static async getAllUsersForLeaderboard() {
    // Calculate date ranges to match the dashboard/Profile component logic
    const today = new Date();
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    
    // Format dates for MySQL query (YYYY-MM-DD)
    const todayStr = today.toISOString().split('T')[0];
    const weekAgoStr = oneWeekAgo.toISOString().split('T')[0];
    const monthAgoStr = oneMonthAgo.toISOString().split('T')[0];

    const [rows] = await pool.query(`
      SELECT 
        u.id, 
        u.username, 
        u.display_name, 
        u.bio, 
        u.avatar,
        COALESCE(SUM(CASE WHEN DATE(s.date) = ? THEN (s.inputted_steps + s.fitbit_steps) ELSE 0 END), 0) as daily_steps,
        COALESCE(SUM(CASE WHEN s.date >= ? THEN (s.inputted_steps + s.fitbit_steps) ELSE 0 END), 0) as weekly_steps,
        COALESCE(SUM(CASE WHEN s.date >= ? THEN (s.inputted_steps + s.fitbit_steps) ELSE 0 END), 0) as monthly_steps
      FROM users u
      LEFT JOIN steps s ON u.id = s.user_id
      GROUP BY u.id, u.username, u.display_name, u.bio, u.avatar
      ORDER BY u.username
    `, [todayStr, weekAgoStr, monthAgoStr]);
    return rows;
  }

  // Update user
  static async updateUser(id, updates) {
    // Build dynamic update query
    const fields = [];
    const values = [];
    
    if (updates.username) {
      fields.push('username = ?');
      values.push(updates.username);
    }
    if (updates.email) {
      fields.push('email = ?');
      values.push(updates.email.toLowerCase());
    }
    if (updates.display_name !== undefined) {
      fields.push('display_name = ?');
      values.push(updates.display_name);
    }
    if (updates.bio !== undefined) {
      fields.push('bio = ?');
      values.push(updates.bio);
    }
    if (updates.avatar !== undefined) {
      fields.push('avatar = ?');
      values.push(updates.avatar);
    }
    
    // Goal fields
    if (updates.daily_goal !== undefined) {
      fields.push('daily_goal = ?');
      values.push(updates.daily_goal);
    }
    if (updates.weekly_goal !== undefined) {
      fields.push('weekly_goal = ?');
      values.push(updates.weekly_goal);
    }
    if (updates.monthly_goal !== undefined) {
      fields.push('monthly_goal = ?');
      values.push(updates.monthly_goal);
    }
    
    // Google Fit fields
    if (updates.google_fit_access_token !== undefined) {
      fields.push('google_fit_access_token = ?');
      values.push(updates.google_fit_access_token);
    }
    if (updates.google_fit_refresh_token !== undefined) {
      fields.push('google_fit_refresh_token = ?');
      values.push(updates.google_fit_refresh_token);
    }
    if (updates.google_fit_token_expiry !== undefined) {
      fields.push('google_fit_token_expiry = ?');
      values.push(updates.google_fit_token_expiry);
    }
    if (updates.google_fit_connected !== undefined) {
      fields.push('google_fit_connected = ?');
      values.push(updates.google_fit_connected);
    }
    if (updates.google_fit_connected_at !== undefined) {
      fields.push('google_fit_connected_at = ?');
      values.push(updates.google_fit_connected_at);
    }
    if (updates.google_fit_last_sync !== undefined) {
      fields.push('google_fit_last_sync = ?');
      values.push(updates.google_fit_last_sync);
    }
    
    // Fitbit fields
    if (updates.fitbit_access_token !== undefined) {
      fields.push('fitbit_access_token = ?');
      values.push(updates.fitbit_access_token);
    }
    if (updates.fitbit_refresh_token !== undefined) {
      fields.push('fitbit_refresh_token = ?');
      values.push(updates.fitbit_refresh_token);
    }
    if (updates.fitbit_token_expiry !== undefined) {
      fields.push('fitbit_token_expiry = ?');
      values.push(updates.fitbit_token_expiry);
    }
    if (updates.fitbit_connected !== undefined) {
      fields.push('fitbit_connected = ?');
      values.push(updates.fitbit_connected);
    }
    if (updates.fitbit_connected_at !== undefined) {
      fields.push('fitbit_connected_at = ?');
      values.push(updates.fitbit_connected_at);
    }
    if (updates.fitbit_last_sync !== undefined) {
      fields.push('fitbit_last_sync = ?');
      values.push(updates.fitbit_last_sync);
    }
    
    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }
    
    values.push(id);
    
    const [result] = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    if (result.affectedRows === 0) {
      throw new Error('User not found');
    }
    
    return await this.findById(id);
  }

  // Delete user
  static async deleteUser(id) {
    const [result] = await pool.query(
      'DELETE FROM users WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      throw new Error('User not found');
    }
    
    return { id };
  }

  // Get all users with active Fitbit connections for batch operations
  static async getAllFitbitConnectedUsers() {
    try {
      const [rows] = await pool.query(
        'SELECT id FROM users WHERE fitbit_connected = 1 AND fitbit_access_token IS NOT NULL'
      );
      return rows;
    } catch (error) {
      console.error('Error getting Fitbit connected users:', error);
      throw error;
    }
  }

  // Validate password (internal method)
  static async validatePassword(user, password) {
    const [rows] = await pool.query(
      // this belongs
      'SELECT password FROM users WHERE id = ?',
      [user.id]
    );
    
    if (rows.length === 0) return false;
    
    // Compare provided password with stored hash
    // this does not belong in user, belongs in service
    return bcrypt.compare(password, rows[0].password);
  }
}

module.exports = UserModel;