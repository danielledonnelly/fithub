const FitbitService = require("../services/FitbitService");
const UserModel = require("../models/User");
const {pool} = require('../db');

// Simple sync tracker
const activeSyncs = new Set();

class FitbitController {
  static async getAuthUrl(req, res) {
    try {
      const userId = req.user.sub;
      const fitbitService = new FitbitService();
      const authUrl = fitbitService.getAuthUrl(userId);
      
      res.json({
        authUrl: authUrl,
        message: "Redirect user to this URL to authorize Fitbit access"
      });
    } catch (error) {
      console.error('Auth URL error:', error);
      res.status(500).json({ message: "Error generating auth URL", error: error.message });
    }
  }

  static async handleCallback(req, res) {
    try {
      const { code, state } = req.query;
      const userId = parseInt(state);

      const fitbitService = new FitbitService();
      const tokenData = await fitbitService.getTokensFromCode(code);

      await UserModel.updateUser(userId, {
        fitbit_access_token: tokenData.access_token,
        fitbit_refresh_token: tokenData.refresh_token,
        fitbit_connected: true,
        fitbit_connected_at: new Date(),
      });

      // Sync will be triggered from dashboard load instead

      res.json({
        message: "Fitbit connected successfully",
        connected: true,
      });
    } catch (error) {
      console.error('Callback error:', error);
      res.status(500).json({ message: "Error connecting Fitbit", error: error.message });
    }
  }

  static async userNeedsSync(userId) {
    const today = new Date();
    const jan1 = new Date(today.getFullYear(), 0, 1);
    
    const [rows] = await pool.query(
      'SELECT date FROM steps WHERE user_id = ?', [userId]
    );
    const existingDates = new Set(rows.map(r => r.date.toISOString().split('T')[0]));
    
    // Check if we're missing any days from Jan 1st to today
    for (let d = new Date(today); d >= jan1; d.setDate(d.getDate() - 1)) {
      const dateStr = d.toISOString().split('T')[0];
      if (!existingDates.has(dateStr)) {
        return true;
      }
    }
    return false;
  }

  static async startSync(userId) {
    if (activeSyncs.has(userId)) {
      return; // Already syncing
    }
    
    activeSyncs.add(userId);
    console.log(`Starting sync for user ${userId}`);
    
    try {
      const user = await UserModel.findById(userId);
      
      // Check if Fitbit is still connected before starting
      if (!user?.fitbit_connected || !user?.fitbit_access_token) {
        console.log(`Fitbit disconnected for user ${userId}, stopping sync`);
        return;
      }
      
      const fitbitService = new FitbitService();
      fitbitService.setCredentials({
        access_token: user.fitbit_access_token,
        refresh_token: user.fitbit_refresh_token
      });

      // Get missing dates
      const today = new Date();
      const jan1 = new Date(today.getFullYear(), 0, 1);
      
      const [rows] = await pool.query(
        'SELECT date FROM steps WHERE user_id = ?', [userId]
      );
      const existingDates = new Set(rows.map(r => r.date.toISOString().split('T')[0]));
      
      const daysToSync = [];
      for (let d = new Date(today); d >= jan1; d.setDate(d.getDate() - 1)) {
        const dateStr = d.toISOString().split('T')[0];
        if (!existingDates.has(dateStr)) {
          daysToSync.push(new Date(d));
        }
      }

      if (daysToSync.length === 0) {
        console.log(`All days already synced`);
        return;
      }

      console.log(`Syncing ${daysToSync.length} missing days`);
      
      let synced = 0;
      for (const day of daysToSync) {
        // Check if Fitbit is still connected before each batch
        const currentUser = await UserModel.findById(userId);
        if (!currentUser?.fitbit_connected || !currentUser?.fitbit_access_token) {
          console.log(`Fitbit disconnected during sync, stopping`);
          return;
        }
        
        try {
          const stepData = await fitbitService.getStepData(day);
          const StepModel = require('../models/Step');
          await StepModel.updateFitbitSteps(userId, day, stepData.steps || 0);
          synced++;
          
          // Progress every 20 days
          if (synced % 20 === 0) {
            console.log(`${synced}/${daysToSync.length} days synced`);
          }
          
          // Rate limit protection: 1 request every 3 seconds
          await new Promise(resolve => setTimeout(resolve, 3000));
          
        } catch (error) {
          if (error.message.includes('429') || error.message.includes('rate limit')) {
            console.log(`Rate limit hit. Resuming in 65 minutes...`);
            setTimeout(async () => {
              // Check if Fitbit is still connected before resuming
              const currentUser = await UserModel.findById(userId);
              if (currentUser?.fitbit_connected && currentUser?.fitbit_access_token) {
                FitbitController.startSync(userId);
              } else {
                console.log(`Fitbit disconnected during cooldown, not resuming sync`);
                activeSyncs.delete(userId);
              }
            }, 65 * 60 * 1000);
            return; // Don't delete from activeSyncs - will resume later or be cleaned up
          }
          console.error(`Error syncing ${day.toISOString().split('T')[0]}:`, error.message);
        }
      }
      
      console.log(`Sync complete - ${synced} days synced`);
      
    } catch (error) {
      console.error(`Sync failed:`, error.message);
    } finally {
      activeSyncs.delete(userId);
    }
  }

  static async syncSteps(req, res) {
    try {
      const userId = req.user.sub;
      
      if (activeSyncs.has(userId)) {
        return res.status(409).json({ message: "Sync already in progress" });
      }

      // Start sync in background
      FitbitController.startSync(userId);
      
      res.json({ message: "Sync started" });
    } catch (error) {
      console.error('Manual sync error:', error);
      res.status(500).json({ message: "Error starting sync", error: error.message });
    }
  }

  static async getStepsForGraph(req, res) {
    try {
      const userId = req.user.sub;
      const user = await UserModel.findById(userId);
      
      // Get database steps
      const StepModel = require('../models/Step');
      const localSteps = await StepModel.getAllSteps(userId);
      
      // Auto-sync trigger: check if user has Fitbit connected and needs sync
      if (user?.fitbit_connected && user?.fitbit_access_token) {
        const needsSync = await FitbitController.userNeedsSync(userId);
        if (needsSync && !activeSyncs.has(userId)) {
          console.log('Auto-sync triggered from dashboard');
          FitbitController.startSync(userId);
        }
      }
      
      res.json({
        steps: localSteps,
        source: 'database'
      });
    } catch (error) {
      console.error('Graph data error:', error);
      res.status(500).json({ message: "Error fetching step data", error: error.message });
    }
  }

  static async getConnectionStatus(req, res) {
    try {
      const userId = req.user.sub;
      const user = await UserModel.findById(userId);
      
      res.json({
        connected: !!user.fitbit_connected,
        lastSync: user.fitbit_last_sync,
        hasAccessToken: !!user.fitbit_access_token
      });
    } catch (error) {
      console.error('Status error:', error);
      res.status(500).json({ message: "Error getting Fitbit status", error: error.message });
    }
  }

  // Check if sync is currently active for this user
  static async getSyncStatus(req, res) {
    try {
      const userId = req.user.sub;
      
      res.json({
        syncActive: activeSyncs.has(userId)
      });
    } catch (error) {
      console.error("Error getting sync status:", error);
      res.status(500).json({
        error: "Failed to get sync status",
        message: error.message,
      });
    }
  }

  static async disconnect(req, res) {
    try {
      const userId = req.user.sub;
      
      // KILL any active sync completely
      activeSyncs.delete(userId);
      
      // Clear Fitbit data
      await UserModel.updateUser(userId, {
        fitbit_access_token: null,
        fitbit_refresh_token: null,
        fitbit_connected: false,
        fitbit_connected_at: null,
        fitbit_last_sync: null
      });

      console.log(`Fitbit disconnected for user ${userId} - all syncs stopped`);
      res.json({ message: "Fitbit disconnected successfully" });
    } catch (error) {
      console.error('Disconnect error:', error);
      res.status(500).json({ message: "Error disconnecting Fitbit", error: error.message });
    }
  }

  // Sync specific days for a user (used by cron jobs and manual updates)
  static async syncSpecificDays(userId, daysArray) {
    // Prevent concurrent syncs for the same user
    if (activeSyncs.has(userId)) {
      console.log(`Sync already running for user ${userId}, skipping specific days sync`);
      return;
    }
    
    activeSyncs.add(userId);
    
    try {
      const user = await UserModel.findById(userId);
      if (!user?.fitbit_connected || !user?.fitbit_access_token) {
        console.log(`User ${userId} no longer has Fitbit connected, skipping sync`);
        return;
      }
      
      const fitbitService = new FitbitService();
      fitbitService.setCredentials({
        access_token: user.fitbit_access_token,
        refresh_token: user.fitbit_refresh_token
      });

      let syncedCount = 0;
      for (const day of daysArray) {
        try {
          const stepData = await fitbitService.getStepData(day);
          const StepModel = require('../models/Step');
          // Update existing record or create new one
          await StepModel.updateFitbitSteps(userId, day, stepData.steps || 0);
          syncedCount++;
          
          // Conservative delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          if (error.message.includes('429')) {
            console.log(`Rate limit hit during specific days sync for user ${userId}`);
            break;
          }
          console.error(`Error syncing ${day.toISOString().split('T')[0]} for user ${userId}:`, error.message);
        }
      }
      
      console.log(`Completed specific days sync for user ${userId}: ${syncedCount}/${daysArray.length} days`);
    } finally {
      activeSyncs.delete(userId);
    }
  }
}

module.exports = FitbitController;