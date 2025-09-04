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
      'SELECT id, username, email, display_name, bio, avatar, google_fit_connected, google_fit_connected_at, google_fit_last_sync, fitbit_connected, fitbit_connected_at, fitbit_last_sync, fitbit_access_token, fitbit_refresh_token FROM users WHERE id = ?',
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

  // Auto-sync tracking methods
  static async markAutoSyncCompleted(userId) {
    const [result] = await pool.query(
      'UPDATE users SET fitbit_auto_sync_completed = 1, fitbit_auto_sync_last_attempt = NOW(), fitbit_auto_sync_failed_count = 0, fitbit_last_sync = NOW() WHERE id = ?',
      [userId]
    );
    return result.affectedRows > 0;
  }

  static async markAutoSyncFailed(userId, nextAttemptMinutes = 60) {
    const nextAttempt = new Date(Date.now() + nextAttemptMinutes * 60 * 1000);
    const [result] = await pool.query(
      'UPDATE users SET fitbit_auto_sync_last_attempt = NOW(), fitbit_auto_sync_next_attempt = ?, fitbit_auto_sync_failed_count = fitbit_auto_sync_failed_count + 1 WHERE id = ?',
      [nextAttempt, userId]
    );
    return result.affectedRows > 0;
  }

  static async hasCompletedAutoSync(userId) {
    const [rows] = await pool.query(
      'SELECT fitbit_auto_sync_completed FROM users WHERE id = ?',
      [userId]
    );
    return rows.length > 0 && rows[0].fitbit_auto_sync_completed === 1;
  }

  static async getUsersNeedingAutoSync() {
    const [rows] = await pool.query(
      'SELECT id, fitbit_access_token, fitbit_refresh_token, fitbit_auto_sync_failed_count FROM users WHERE fitbit_connected = 1 AND fitbit_auto_sync_enabled = 1 AND (fitbit_auto_sync_next_attempt IS NULL OR fitbit_auto_sync_next_attempt <= NOW()) AND fitbit_auto_sync_failed_count < 5',
      []
    );
    return rows;
  }

  static async updateAutoSyncStatus(userId, status) {
    const updates = [];
    const values = [];
    
    if (status.completed !== undefined) {
      updates.push('fitbit_auto_sync_completed = ?');
      values.push(status.completed ? 1 : 0);
    }
    if (status.nextAttempt !== undefined) {
      updates.push('fitbit_auto_sync_next_attempt = ?');
      values.push(status.nextAttempt);
    }
    if (status.failedCount !== undefined) {
      updates.push('fitbit_auto_sync_failed_count = ?');
      values.push(status.failedCount);
    }
    
    if (updates.length === 0) return false;
    
    values.push(userId);
    const [result] = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }
}

module.exports = UserModel;