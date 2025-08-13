const GoogleFitService = require("../services/GoogleFitService");
const UserModel = require("../models/User");

class GoogleFitController {
  // Get OAuth URL for user to authorize Google Fit
  static async getAuthUrl(req, res) {
    try {
      console.log('Request user object:', req.user);
      console.log('Request user sub:', req.user?.sub);
      
      const userId = req.user.sub; // Get user ID from authenticated request
      console.log('Extracted userId:', userId);
      
      const googleFitService = new GoogleFitService();
      const authUrl = googleFitService.getAuthUrl(userId);
      
      res.json({
        authUrl,
        message: 'Google Fit authorization URL generated'
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

      const googleFitService = new GoogleFitService();
      const tokens = await googleFitService.getTokensFromCode(code);

      // Store tokens in user's record
      await UserModel.updateUser(userId, {
        google_fit_access_token: tokens.access_token,
        google_fit_refresh_token: tokens.refresh_token,
        google_fit_token_expiry: tokens.expiry_date,
        google_fit_connected: true,
        google_fit_connected_at: new Date(),
      });

      res.json({
        message: "Google Fit connected successfully",
        connected: true,
      });
    } catch (error) {
      console.error("Error handling OAuth callback:", error);
      res.status(500).json({
        error: "Failed to connect Google Fit",
        message: error.message,
      });
    }
  }

  // Sync steps from Google Fit
  static async syncSteps(req, res) {
    try {
      const userId = req.user.sub;

      // Get user's Google Fit tokens
      const user = await UserModel.findById(userId);
      if (!user.google_fit_connected || !user.google_fit_access_token) {
        return res.status(400).json({
          error: "Google Fit not connected",
          message: "Please connect your Google Fit account first",
        });
      }

      const googleFitService = new GoogleFitService();

      // Set credentials
      googleFitService.setCredentials({
        access_token: user.google_fit_access_token,
        refresh_token: user.google_fit_refresh_token,
      });

      // Get step data for last 30 days
      const endTime = new Date().getTime();
      const startTime = endTime - 30 * 24 * 60 * 60 * 1000; // 30 days ago

      const stepData = await googleFitService.getStepData(startTime, endTime);

      // Update user's step data in database
      // This would integrate with your existing StepService
      // For now, we'll just return the data

      res.json({
        message: "Steps synced successfully",
        stepsSynced: Object.keys(stepData).length,
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

  // Disconnect Google Fit
  static async disconnect(req, res) {
    try {
      const userId = req.user.sub;

      await UserModel.updateUser(userId, {
        google_fit_access_token: null,
        google_fit_refresh_token: null,
        google_fit_token_expiry: null,
        google_fit_connected: false,
        google_fit_connected_at: null,
      });

      res.json({
        message: "Google Fit disconnected successfully",
        connected: false,
      });
    } catch (error) {
      console.error("Error disconnecting Google Fit:", error);
      res.status(500).json({
        error: "Failed to disconnect Google Fit",
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
        connected: user.google_fit_connected || false,
        connectedAt: user.google_fit_connected_at,
        lastSync: user.google_fit_last_sync,
      });
    } catch (error) {
      console.error("Error getting connection status:", error);
      res.status(500).json({
        error: "Failed to get connection status",
        message: error.message,
      });
    }
  }
}

module.exports = GoogleFitController;
