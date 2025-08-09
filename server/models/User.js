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
      'SELECT id, username, email, display_name, bio, avatar FROM users WHERE id = ?',
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
}

module.exports = UserModel;