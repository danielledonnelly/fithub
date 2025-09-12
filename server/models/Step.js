const mysql = require('mysql2/promise');
const {pool} = require('../db');

// StepModel - Database operations for step tracking data. This model handles all database interactions for step data, including:
// - Manual step entries (inputted_steps)
// - Fitbit API data (fitbit_steps) 
// - Combined totals and statistics
// - Historical sync validation

class StepModel {
  // Get all step data for a user with optional date filtering
  // 
  // @param {number} userId - The user's ID
  // @param {string|null} startDate - Optional start date filter (YYYY-MM-DD)
  // @param {string|null} endDate - Optional end date filter (YYYY-MM-DD)
  // @returns {Object} Object with date keys and total step values
  // 
  // Example return: { "2025-09-11": 8500, "2025-09-10": 1358 }
  static async getAllSteps(userId, startDate = null, endDate = null) {
    // Base query: get all step data for user, combining both sources
    let query = 'SELECT date, inputted_steps, fitbit_steps, (inputted_steps + fitbit_steps) as total_steps FROM steps WHERE user_id = ?';
    const params = [userId];
    
    // Add date filtering
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
      // row.date is a string in 'YYYY-MM-DD' format
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

  // Update or insert manually inputted steps for a specific date
  
  // This is used when users manually log steps through the UI.
  // Uses UPSERT pattern to handle both new records and updates.

  // @param {number} userId - The user's ID
  // @param {string} date - Date in YYYY-MM-DD format
  // @param {number} steps - Number of steps to record
  // @returns {Object} Confirmation object with date and steps
  static async updateSteps(userId, date, steps) {
    console.log('Adding inputted steps:', { userId, date, steps });
    
    // UPSERT: Insert new record or ADD to existing inputted_steps
    // ON DUPLICATE KEY UPDATE adds to existing inputted_steps instead of replacing
    const [result] = await pool.query(
      'INSERT INTO steps (user_id, date, inputted_steps) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE inputted_steps = inputted_steps + ?',
      [userId, date, steps, steps]
    );
    return { date, steps };
  }
  
  // Update or insert Fitbit steps for a specific date
  
  // This method is used during Fitbit API syncs. It always updates with
  // the latest Fitbit data to ensure data freshness and accuracy.
  
  // @param {number} userId - The user's ID
  // @param {string} date - Date in YYYY-MM-DD format
  // @param {number} steps - Number of steps from Fitbit API
  // @returns {Object} Confirmation object with date and steps
  static async updateFitbitSteps(userId, date, steps) {
    console.log('Updating Fitbit steps:', { userId, date, steps });
    
    // UPSERT: Always update with latest Fitbit data
    // Fitbit API is the source of truth for step data
    const [result] = await pool.query(
      `INSERT INTO steps (user_id, date, fitbit_steps) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE fitbit_steps = ?`,
      [userId, date, steps, steps]
    );
    
    // Logging results
    if (result.affectedRows === 0) {
      console.log(`⚠️  No rows affected for ${date}`);

    } else {
      console.log(`✅ Updated ${date} with ${steps} steps from Fitbit`);
    }
    
    return { date, steps };
  }

  // Delete all step data for a specific date
  // 
  // @param {number} userId - The user's ID
  // @param {string} date - Date in YYYY-MM-DD format
  // @returns {boolean} True if any records were deleted
  static async deleteSteps(userId, date) {
    const [result] = await pool.query(
      'DELETE FROM steps WHERE user_id = ? AND date = ?',
      [userId, date]
    );
    return result.affectedRows > 0;
  }

  // Delete all step data for a user
  // 
  // @param {number} userId - The user's ID
  // @returns {number} Number of records deleted
  static async deleteAllSteps(userId) {
    const [result] = await pool.query(
      'DELETE FROM steps WHERE user_id = ?',
      [userId]
    );
    return result.affectedRows;
  }

  // Get comprehensive step statistics for a user
  // 
  // Calculates various metrics including totals, averages, and activity patterns.
  // Used for dashboard summaries and progress tracking.
  // 
  // @param {number} userId - The user's ID
  // @param {string|null} startDate - Optional start date filter (YYYY-MM-DD)
  // @param {string|null} endDate - Optional end date filter (YYYY-MM-DD)
  // @returns {Object} Statistics object with various metrics
  static async getStepStats(userId, startDate = null, endDate = null) {
    // Complex query to calculate multiple statistics in one go
    let query = 'SELECT COUNT(*) as totalDays, SUM(inputted_steps + fitbit_steps) as totalSteps, COUNT(CASE WHEN (inputted_steps + fitbit_steps) > 0 THEN 1 END) as activeDays, AVG(inputted_steps + fitbit_steps) as avgSteps, MAX(inputted_steps + fitbit_steps) as maxSteps, MIN(inputted_steps + fitbit_steps) as minSteps FROM steps WHERE user_id = ?';
    const params = [userId];
    
    // Add date filtering if provided
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
    
    // Return normalized statistics with fallbacks for null values
    return {
      totalSteps: stats.totalSteps || 0,      // Sum of all steps in period
      activeDays: stats.activeDays || 0,      // Days with steps > 0
      totalDays: stats.totalDays || 0,        // Total days in period
      averageSteps: Math.round(stats.avgSteps || 0), // Rounded average
      maxSteps: stats.maxSteps || 0,          // Highest single day
      minSteps: stats.minSteps || 0           // Lowest single day
    };
  }

  // Check if user has zero total steps across all time
  // 
  // Used to determine if a user is completely new or has no step data.
  // 
  // @param {number} userId - The user's ID
  // @returns {boolean} True if user has no steps at all
  static async userHasZeroSteps(userId) {
    const [rows] = await pool.query(
      'SELECT SUM(inputted_steps + fitbit_steps) as totalSteps FROM steps WHERE user_id = ?',
      [userId]
    );
    return (rows[0].totalSteps || 0) === 0;
  }

  // Check if user needs to complete historical sync to January 1st
  // 
  // This method validates that we have step data for every day from 
  // January 1st of the current year to today. Used to trigger full
  // historical syncs when data is missing.
  // 
  // @param {number} userId - The user's ID
  // @returns {boolean} True if historical sync is needed
  static async userNeedsHistoricalSync(userId) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const januaryFirst = new Date(currentYear, 0, 1);
    
    // Get all dates we've attempted to sync (any record exists)
    const [rows] = await pool.query(
      'SELECT date FROM steps WHERE user_id = ?',
      [userId]
    );
    
    // Convert database dates to string format for comparison
    const existingDates = new Set(rows.map(row => {
      // Handle both string and Date object formats from database
      const dateStr = row.date instanceof Date ? row.date.toISOString().split('T')[0] : row.date;
      return dateStr;
    }));
    
    console.log(`🔍 Checking historical sync for user ${userId}:`);
    console.log(`📅 Have ${existingDates.size} existing dates`);
    console.log(`📅 Checking from ${today.toISOString().split('T')[0]} back to ${januaryFirst.toISOString().split('T')[0]}`);
    
    let missingCount = 0;
    let firstMissingDate = null;
    
    // Check if we're missing any days from Jan 1st to today
    for (let d = new Date(today); d >= januaryFirst; d.setDate(d.getDate() - 1)) {
      const dateStr = d.toISOString().split('T')[0];
      if (!existingDates.has(dateStr)) {
        missingCount++;
        if (!firstMissingDate) {
          firstMissingDate = dateStr;
        }
      }
    }
    
    if (missingCount > 0) {
      console.log(`❌ Missing ${missingCount} days, first missing: ${firstMissingDate}`);
      return true;
    } else {
      console.log(`✅ All days from Jan 1st to today are synced`);
      return false;
    }
  }

  // Get sum of steps within a specific date range
  // 
  // Used for calculating weekly, monthly, or custom period totals.
  // 
  // @param {number} userId - The user's ID
  // @param {string} startDate - Start date in YYYY-MM-DD format
  // @param {string} endDate - End date in YYYY-MM-DD format
  // @returns {number} Total steps in the date range
  static async getStepsSumInRange(userId, startDate, endDate) {
    try {
      const [rows] = await pool.query(
        `SELECT SUM(COALESCE(inputted_steps, 0) + COALESCE(fitbit_steps, 0)) as totalSteps 
         FROM steps 
         WHERE user_id = ? AND date >= ? AND date <= ?`,
        [userId, startDate, endDate]
      );
      
      return rows[0]?.totalSteps || 0;
    } catch (error) {
      console.error('Error getting steps sum in range:', error);
      return 0;
    }
  }
}

module.exports = StepModel;