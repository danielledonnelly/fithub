// server/controllers/StepController.js
const StepService = require('../services/StepService');

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
        message: 'Steps updated successfully',
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
        message: 'Screenshot uploaded and steps updated successfully',
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
}

console.log('StepController methods:', Object.getOwnPropertyNames(StepController));
console.log('uploadScreenshot method exists:', typeof StepController.uploadScreenshot);

module.exports = StepController;