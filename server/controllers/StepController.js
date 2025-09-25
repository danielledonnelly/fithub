// server/controllers/StepController.js
const StepService = require('../services/stepService');
const UserModel = require('../models/User');

class StepController {
  // Get all step data with optional date filtering
  static async getAllSteps(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const userId = req.user.sub;
      
      const data = await StepService.getAllSteps(userId, startDate, endDate);
      res.json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get step data for a specific date
  static async getStepsByDate(req, res) {
    try {
      const { date } = req.params;
      const userId = req.user.sub;
      
      const steps = await StepService.getStepsByDate(userId, date);
      res.json({ date, steps });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Update step data for a specific date
  static async updateSteps(req, res) {
    try {
      const { date } = req.params;
      const { steps } = req.body;
      const userId = req.user.sub;
      
      const result = await StepService.updateSteps(userId, date, steps);
      res.json({ 
        message: 'Steps added successfully',
        ...result
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Delete step data for a specific date
  static async deleteSteps(req, res) {
    try {
      const { date } = req.params;
      const userId = req.user.sub;
      
      const deleted = await StepService.deleteSteps(userId, date);
      
      if (deleted) {
        res.json({ message: 'Step data deleted successfully', date });
      } else {
        res.status(404).json({ error: 'No step data found for this date' });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Delete all step data for a user
  static async deleteAllSteps(req, res) {
    try {
      const userId = req.user.sub;
      
      const deletedCount = await StepService.deleteAllSteps(userId);
      
      res.json({ 
        message: 'All step data deleted successfully', 
        deletedCount 
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get step statistics with optional date filtering
  static async getStepStats(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const userId = req.user.sub;
      
      const stats = await StepService.getStepStats(userId, startDate, endDate);
      res.json(stats);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Regenerate sample data (for development)
  static async regenerateData(req, res) {
    try {
      const userId = req.user.sub;
      
      const totalDays = await StepService.regenerateData(userId);
      res.json({ 
        message: 'Step data regenerated successfully',
        totalDays
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Upload screenshot for step extraction
  static async uploadScreenshot(req, res) {
    try {
      console.log('Upload request received:', req.file);
      
      if (!req.file) {
        return res.status(400).json({ error: 'No image file uploaded' });
      }

      const userId = req.user.sub;
      const imagePath = req.file.path;
      
      console.log('File uploaded to:', imagePath);
      
      // Import the StepParsingService
      const StepParsingService = require('../services/StepParsingService');
      
      // Extract step count from the image using OCR
      console.log('Processing image with OCR...');
      const extractedSteps = await StepParsingService.extractStepsFromImage(imagePath);
      
      console.log('Extracted steps:', extractedSteps);
      
      const today = new Date().toISOString().split('T')[0];
      
      console.log('Updating steps for user:', userId, 'date:', today, 'steps:', extractedSteps);
      
      // Update steps in database
      const result = await StepService.updateSteps(userId, today, extractedSteps);
      
      console.log('Steps updated:', result);
      
      res.json({
        message: 'Screenshot uploaded and steps added successfully',
        steps: extractedSteps,
        date: today,
        filePath: imagePath
      });
    } catch (error) {
      console.error('Screenshot upload error:', error);
      res.status(400).json({
        error: 'Failed to upload screenshot',
        message: error.message
      });
    }
  }

  // Get step statistics (weekly, monthly)
  static async getStepStats(req, res) {
    try {
      const userId = req.user.sub;
      
      const stats = await StepService.getStepStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Error getting step stats:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async getTotalStats(req, res) {
    try {
      const userId = req.user.sub;
      const {pool} = require('../db');
      const StepModel = require('../models/Step');
      
      // Calculate total steps (all-time)
      const totalSteps = await StepModel.getStepsSumInRange(userId, '2020-01-01', new Date().toISOString().split('T')[0]);
      
      // Count active days (days with steps > 0)
      const [rows] = await pool.query(
        `SELECT COUNT(*) as activeDays 
         FROM steps 
         WHERE user_id = ? AND (COALESCE(inputted_steps, 0) + COALESCE(fitbit_steps, 0)) > 0`,
        [userId]
      );
      
      const activeDays = rows[0]?.activeDays || 0;
      
      res.json({
        totalSteps,
        activeDays
      });
    } catch (error) {
      console.error('Error getting total stats:', error);
      res.status(400).json({ error: error.message });
    }
  }

  // Get step data for a user by username (for profile pages)
  static async getStepsForUser(req, res) {
    try {
      const { username } = req.params;
      
      if (!username) {
        return res.status(400).json({ error: 'Username is required' });
      }

      // First, find the user by username
      const user = await UserModel.findByUsername(username);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get step data for this user
      const stepData = await StepService.getAllSteps(user.id);
      
      // Return in the same format as other step endpoints
      res.json({ steps: stepData });
    } catch (error) {
      console.error('Error getting steps for user:', error);
      res.status(400).json({ error: error.message });
    }
  }
}

console.log('StepController methods:', Object.getOwnPropertyNames(StepController));
console.log('uploadScreenshot method exists:', typeof StepController.uploadScreenshot);

module.exports = StepController;