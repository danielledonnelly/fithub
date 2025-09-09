const mysql = require('mysql2/promise');
const {pool} = require('../db');

class StepModel {
  // Get all steps for a user with optional date filtering
  static async getAllSteps(userId, startDate = null, endDate = null) {
    let query = 'SELECT date, inputted_steps, fitbit_steps, (inputted_steps + fitbit_steps) as total_steps FROM steps WHERE user_id = ?';
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
      stepData[row.date] = row.total_steps;
    });
    
    return stepData;
  }

  // Get steps for a specific date
  static async getStepsByDate(userId, date) {
    const [rows] = await pool.query(
      'SELECT inputted_steps, fitbit_steps, (inputted_steps + fitbit_steps) as total_steps FROM steps WHERE user_id = ? AND date = ?',
      [userId, date]
    );
    return rows.length > 0 ? rows[0].total_steps : 0;
  }

  // Update or insert inputted steps for a specific date
  static async updateSteps(userId, date, steps) {
    console.log('Updating inputted steps:', { userId, date, steps });
    const [result] = await pool.query(
      'INSERT INTO steps (user_id, date, inputted_steps) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE inputted_steps = ?',
      [userId, date, steps, steps]
    );
    return { date, steps };
  }

  // Update or insert Fitbit steps for a specific date (overwrites existing Fitbit steps)
  static async updateFitbitSteps(userId, date, steps) {
    console.log('Updating Fitbit steps:', { userId, date, steps });
    const [result] = await pool.query(
      'INSERT INTO steps (user_id, date, fitbit_steps) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE fitbit_steps = ?',
      [userId, date, steps, steps]
    );
    return { date, steps };
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
    let query = 'SELECT COUNT(*) as totalDays, SUM(inputted_steps + fitbit_steps) as totalSteps, COUNT(CASE WHEN (inputted_steps + fitbit_steps) > 0 THEN 1 END) as activeDays, AVG(inputted_steps + fitbit_steps) as avgSteps, MAX(inputted_steps + fitbit_steps) as maxSteps, MIN(inputted_steps + fitbit_steps) as minSteps FROM steps WHERE user_id = ?';
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

  // Check if user has zero total steps across all time
  static async userHasZeroSteps(userId) {
    const [rows] = await pool.query(
      'SELECT SUM(inputted_steps + fitbit_steps) as totalSteps FROM steps WHERE user_id = ?',
      [userId]
    );
    return (rows[0].totalSteps || 0) === 0;
  }

  // Check if user needs to complete sync to January 1st
  static async userNeedsHistoricalSync(userId) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const januaryFirst = new Date(currentYear, 0, 1);
    
    // Get all dates we've attempted to sync (any record exists)
    const [rows] = await pool.query(
      'SELECT date FROM steps WHERE user_id = ?',
      [userId]
    );
    
    const existingDates = new Set(rows.map(row => row.date));
    
    // Check if we're missing any days from Jan 1st to today
    for (let d = new Date(today); d >= januaryFirst; d.setDate(d.getDate() - 1)) {
      const dateStr = d.toISOString().split('T')[0];
      if (!existingDates.has(dateStr)) {
        return true; // Missing at least one day
      }
    }
    
    return false; // Have all days from Jan 1st to today
  }
}

module.exports = StepModel;