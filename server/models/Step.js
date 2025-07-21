const mysql = require('mysql2/promise');
require('dotenv').config();

// Use the same connection pool as User model
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'fithub',
  dateStrings: true // Ensures DATE columns are returned as strings
});

class StepModel {
  // Get all steps for a user with optional date filtering
  static async getAllSteps(userId, startDate = null, endDate = null) {
    let query = 'SELECT date, steps FROM steps WHERE user_id = ?';
    const params = [userId];
    
    if (startDate) {
      query += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND date <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY date';
    
    const [rows] = await pool.query(query, params);
    
    // Convert to the format expected by frontend
    const stepData = {};
    rows.forEach(row => {
      // row.date is now a string in 'YYYY-MM-DD' format
      stepData[row.date] = row.steps;
    });
    
    return stepData;
  }

  // Get steps for a specific date
  static async getStepsByDate(userId, date) {
    const [rows] = await pool.query(
      'SELECT steps FROM steps WHERE user_id = ? AND date = ?',
      [userId, date]
    );
    return rows.length > 0 ? rows[0].steps : 0;
  }

  // Update or insert steps for a specific date
  static async updateSteps(userId, date, steps) {
    // Fetch current steps for this user/date
    const [rows] = await pool.query(
      'SELECT steps FROM steps WHERE user_id = ? AND date = ?',
      [userId, date]
    );
    console.log('Updating steps:', { userId, date, steps, found: rows.length > 0, current: rows[0]?.steps });
    let newTotal = steps;
    if (rows.length > 0) {
      newTotal += rows[0].steps;
    }
    const [result] = await pool.query(
      'INSERT INTO steps (user_id, date, steps) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE steps = ?',
      [userId, date, newTotal, newTotal]
    );
    return { date, steps: newTotal };
  }

  // Delete steps for a specific date
  static async deleteSteps(userId, date) {
    const [result] = await pool.query(
      'DELETE FROM steps WHERE user_id = ? AND date = ?',
      [userId, date]
    );
    return result.affectedRows > 0;
  }

  // Get step statistics
  static async getStepStats(userId, startDate = null, endDate = null) {
    let query = 'SELECT COUNT(*) as totalDays, SUM(steps) as totalSteps, COUNT(CASE WHEN steps > 0 THEN 1 END) as activeDays, AVG(steps) as avgSteps, MAX(steps) as maxSteps, MIN(steps) as minSteps FROM steps WHERE user_id = ?';
    const params = [userId];
    
    if (startDate) {
      query += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND date <= ?';
      params.push(endDate);
    }
    
    const [rows] = await pool.query(query, params);
    const stats = rows[0];
    
    return {
      totalSteps: stats.totalSteps || 0,
      activeDays: stats.activeDays || 0,
      totalDays: stats.totalDays || 0,
      averageSteps: Math.round(stats.avgSteps || 0),
      maxSteps: stats.maxSteps || 0,
      minSteps: stats.minSteps || 0
    };
  }
}

module.exports = StepModel;