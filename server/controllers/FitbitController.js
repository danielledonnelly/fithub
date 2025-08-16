const FitbitService = require("../services/FitbitService");
const UserModel = require("../models/User");

class FitbitController {
  // Get OAuth URL for user to authorize Fitbit
  static async getAuthUrl(req, res) {
    try {
      console.log('Request user object:', req.user);
      console.log('Request user sub:', req.user?.sub);
      
      const userId = req.user.sub; // Get user ID from authenticated request
      console.log('Extracted userId:', userId);
      
      const fitbitService = new FitbitService();
      const authUrl = fitbitService.getAuthUrl(userId);
      
      res.json({
        authUrl,
        message: 'Fitbit authorization URL generated'
      });
    } catch (error) {
      console.error("Error generating auth URL:", error);
      res.status(500).json({
        error: "Failed to generate authorization URL",
        message: error.message,
      });
    }
  }

  // Handle OAuth callback and store tokens
  static async handleCallback(req, res) {
    try {
      const { code, state } = req.query;
      const userId = state; // Get user ID from state parameter

      if (!code) {
        return res.status(400).json({
          error: "Authorization code is required",
        });
      }

      const fitbitService = new FitbitService();
      const tokens = await fitbitService.getTokensFromCode(code);

      // Store tokens in user's record
      await UserModel.updateUser(userId, {
        fitbit_access_token: tokens.access_token,
        fitbit_refresh_token: tokens.refresh_token,
        fitbit_token_expiry: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
        fitbit_connected: true,
        fitbit_connected_at: new Date(),
      });

      res.json({
        message: "Fitbit connected successfully",
        connected: true,
      });
    } catch (error) {
      console.error("Error handling OAuth callback:", error);
      res.status(500).json({
        error: "Failed to connect Fitbit",
        message: error.message,
      });
    }
  }

  // Sync steps from Fitbit
  static async syncSteps(req, res) {
    try {
      const userId = req.user.sub;

      // Get user's Fitbit tokens
      const user = await UserModel.findById(userId);
      if (!user.fitbit_connected || !user.fitbit_access_token) {
        return res.status(400).json({
          error: "Fitbit not connected",
          message: "Please connect your Fitbit account first",
        });
      }

      const fitbitService = new FitbitService();

      // Set credentials
      fitbitService.setCredentials({
        access_token: user.fitbit_access_token,
        refresh_token: user.fitbit_refresh_token,
      });

      // Get step data for last 30 days
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      
      const stepData = {};
      let totalStepsSynced = 0;

      // Fetch steps for each day in the range
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        try {
          const dayData = await fitbitService.getStepData(new Date(d));
          if (dayData.steps > 0) {
            stepData[dayData.date] = dayData.steps;
            totalStepsSynced++;
          }
        } catch (dayError) {
          console.error(`Error fetching steps for ${d.toISOString().split('T')[0]}:`, dayError);
          // Continue with other days
        }
      }

      // Save step data to database using StepModel
      const StepModel = require('../models/Step');
      for (const [date, steps] of Object.entries(stepData)) {
        if (steps > 0) {
          await StepModel.updateSteps(userId, date, steps);
        }
      }

      // Update last sync timestamp
      await UserModel.updateUser(userId, {
        fitbit_last_sync: new Date()
      });

      res.json({
        message: "Steps synced successfully",
        stepsSynced: totalStepsSynced,
        stepData,
      });
    } catch (error) {
      console.error("Error syncing steps:", error);
      res.status(500).json({
        error: "Failed to sync steps",
        message: error.message,
      });
    }
  }

  // Disconnect Fitbit
  static async disconnect(req, res) {
    try {
      const userId = req.user.sub;

      await UserModel.updateUser(userId, {
        fitbit_access_token: null,
        fitbit_refresh_token: null,
        fitbit_token_expiry: null,
        fitbit_connected: false,
        fitbit_connected_at: null,
      });

      res.json({
        message: "Fitbit disconnected successfully",
        connected: false,
      });
    } catch (error) {
      console.error("Error disconnecting Fitbit:", error);
      res.status(500).json({
        error: "Failed to disconnect Fitbit",
        message: error.message,
      });
    }
  }

  // Get connection status
  static async getConnectionStatus(req, res) {
    try {
      const userId = req.user.sub;
      const user = await UserModel.findById(userId);

      res.json({
        connected: user.fitbit_connected || false,
        connectedAt: user.fitbit_connected_at,
        lastSync: user.fitbit_last_sync,
      });
    } catch (error) {
      console.error("Error getting connection status:", error);
      res.status(500).json({
        error: "Failed to get connection status",
        message: error.message,
      });
    }
  }

  // Get steps for contribution graph (combines local and Fitbit data)
  static async getStepsForGraph(req, res) {
    try {
      const userId = req.user.sub;
      const user = await UserModel.findById(userId);
      
      // Get local step data
      const StepModel = require('../models/Step');
      const localSteps = await StepModel.getAllSteps(userId);
      
      // If Fitbit is connected, try to get additional data
      if (user.fitbit_connected && user.fitbit_access_token) {
        try {
          const fitbitService = new FitbitService();
          fitbitService.setCredentials({
            access_token: user.fitbit_access_token,
            refresh_token: user.fitbit_refresh_token,
          });
          
          // Get last 365 days of data for the graph
          const endDate = new Date();
          const startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);
          
          const fitbitSteps = {};
          for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            try {
              const dayData = await fitbitService.getStepData(new Date(d));
              if (dayData.steps > 0) {
                fitbitSteps[dayData.date] = dayData.steps;
              }
            } catch (dayError) {
              // Skip days with errors
              continue;
            }
          }
          
          // Merge data (Fitbit takes precedence for overlapping dates)
          const mergedSteps = { ...localSteps, ...fitbitSteps };
          
          res.json({
            steps: mergedSteps,
            source: 'combined'
          });
        } catch (fitbitError) {
          console.error('Fitbit error, falling back to local data:', fitbitError);
          res.json({
            steps: localSteps,
            source: 'local_only'
          });
        }
      } else {
        res.json({
          steps: localSteps,
          source: 'local_only'
        });
      }
    } catch (error) {
      console.error("Error getting steps for graph:", error);
      res.status(500).json({
        error: "Failed to get steps data",
        message: error.message,
      });
    }
  }
}

module.exports = FitbitController;
