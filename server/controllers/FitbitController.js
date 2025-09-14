const FitbitService = require("../services/FitbitService");
const UserModel = require("../models/User");
const {pool} = require('../db');

// Simple sync tracker
const activeSyncs = new Set();
const syncProgress = new Map(); // Track sync progress for each user
const rateLimitCooldowns = new Map(); // Track rate limit cooldowns: userId -> { until: timestamp, reason: string }

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
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const jan1 = new Date(today.getFullYear(), 0, 1);
    
    const [rows] = await pool.query(
      'SELECT date FROM steps WHERE user_id = ?', [userId]
    );
    const existingDates = new Set(rows.map(r => r.date.toISOString().split('T')[0]));
    
    // Check if we're missing any days from Jan 1st to yesterday (not including today)
    for (let d = new Date(yesterday); d >= jan1; d.setDate(d.getDate() - 1)) {
      const dateStr = d.toISOString().split('T')[0];
      if (!existingDates.has(dateStr)) {
        return true;
      }
    }
    
    // Always check if we need to sync the last 3 days
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3); // 3 days ago to yesterday
    
    // Check if any of the last 3 days are missing or need fresh Fitbit data
    for (let d = new Date(yesterday); d >= threeDaysAgo; d.setDate(d.getDate() - 1)) {
      const dateStr = d.toISOString().split('T')[0];
      
      // Check if this day exists in the database
      const [rows] = await pool.query(
        `SELECT COALESCE(inputted_steps, 0) as inputted_steps, COALESCE(fitbit_steps, 0) as fitbit_steps,
                COALESCE(inputted_steps, 0) + COALESCE(fitbit_steps, 0) as total_steps 
         FROM steps 
         WHERE user_id = ? AND date = ?`,
        [userId, dateStr]
      );
      
      if (rows.length === 0) {
        // Day doesn't exist at all
        console.log(`Sync needed: ${dateStr} - missing from database`);
        return true;
      } else {
        const row = rows[0];
        // Check if day has 0 total steps OR has inputted steps but no Fitbit data
        if (row.total_steps === 0 || (row.inputted_steps > 0 && row.fitbit_steps === 0)) {
          console.log(`Sync needed: ${dateStr} - total=${row.total_steps}, inputted=${row.inputted_steps}, fitbit=${row.fitbit_steps}`);
          return true;
        }
      }
    }
    
    return false;
  }

  static async startSync(userId) {
    if (activeSyncs.has(userId)) {
      return; // Already syncing
    }
    
    // Check if user is in rate limit cooldown
    const cooldown = rateLimitCooldowns.get(userId);
    if (cooldown && Date.now() < cooldown.until) {
      const remainingMinutes = Math.ceil((cooldown.until - Date.now()) / (60 * 1000));
      console.log(`User ${userId} is in rate limit cooldown for ${remainingMinutes} more minutes. Reason: ${cooldown.reason}`);
      
      // Update sync progress to show rate limit status
      syncProgress.set(userId, {
        total: 0,
        completed: 0,
        current: null,
        status: 'rate_limited',
        cooldownUntil: cooldown.until,
        reason: cooldown.reason
      });
      return;
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

      // Proactively refresh token if it's getting old
      try {
        await FitbitController.ensureFreshTokens(userId, fitbitService);
      } catch (error) {
        console.log(`Could not refresh token proactively for user ${userId}, will handle on-demand`);
      }

      // Get missing dates and recent days with 0 steps
      const today = new Date();
      const jan1 = new Date(today.getFullYear(), 0, 1);
      
      const [rows] = await pool.query(
        'SELECT date FROM steps WHERE user_id = ?', [userId]
      );
      const existingDates = new Set(rows.map(r => r.date.toISOString().split('T')[0]));
      
      const daysToSync = [];
      
      // Check for missing dates from Jan 1st to yesterday (not including today)
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      for (let d = new Date(yesterday); d >= jan1; d.setDate(d.getDate() - 1)) {
        const dateStr = d.toISOString().split('T')[0];
        if (!existingDates.has(dateStr)) {
          daysToSync.push(new Date(d));
        }
      }
      
      // Always sync the last 3 days to ensure fresh Fitbit data
      // This ensures that recent days are always updated with the latest Fitbit data
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      // Force sync of the last 3 days regardless of current state
      for (let d = new Date(yesterday); d >= threeDaysAgo; d.setDate(d.getDate() - 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const dateObj = new Date(d);
        
        // Check if this day already exists in our sync list
        const alreadyInList = daysToSync.some(day => day.toISOString().split('T')[0] === dateStr);
        if (!alreadyInList) {
          daysToSync.push(dateObj);
          console.log(`📅 Force adding ${dateStr} to sync (last 3 days)`);
        }
      }

      if (daysToSync.length === 0) {
        console.log(`All days already synced`);
        return;
      }

      console.log(`Syncing ${daysToSync.length} days (missing or with 0 steps)`);
      
      // Initialize sync progress
      syncProgress.set(userId, {
        total: daysToSync.length,
        completed: 0,
        current: null,
        status: 'syncing'
      });
      
      let synced = 0;
      for (const day of daysToSync) {
        // Check if Fitbit is still connected before each batch
        const currentUser = await UserModel.findById(userId);
        if (!currentUser?.fitbit_connected || !currentUser?.fitbit_access_token) {
          console.log(`Fitbit disconnected during sync, stopping`);
          return;
        }
        
        try {
          // Update progress
          syncProgress.set(userId, {
            total: daysToSync.length,
            completed: synced,
            current: day.toISOString().split('T')[0],
            status: 'syncing'
          });
          
          const stepData = await fitbitService.getStepData(day);
          const StepModel = require('../models/Step');
          // Convert Date object to YYYY-MM-DD string for database
          const dateStr = day.toISOString().split('T')[0];
          console.log(`📅 Syncing ${dateStr}: ${stepData.steps || 0} steps from Fitbit`);
          await StepModel.updateFitbitSteps(userId, dateStr, stepData.steps || 0);
          synced++;
          
          // Update progress after successful sync
          syncProgress.set(userId, {
            total: daysToSync.length,
            completed: synced,
            current: null,
            status: 'syncing'
          });
          
          // Progress every 5 days for more frequent updates
          if (synced % 5 === 0) {
            console.log(`${synced}/${daysToSync.length} days synced`);
          }
          
          // Rate limit protection: 150 requests per hour = ~24 seconds between requests
          // But we'll be more aggressive: 1 request every 2.5 seconds (144 requests/hour)
          await new Promise(resolve => setTimeout(resolve, 2500));
          
        } catch (error) {
          console.error(`Error syncing ${day.toISOString().split('T')[0]}:`, error.message);
          
          if (error.message.includes('429') || error.message.includes('rate limit')) {
            console.log(`Rate limit hit. Stopping sync and setting 60-minute cooldown...`);
            activeSyncs.delete(userId); // Stop current sync immediately
            
            // Set rate limit cooldown
            const cooldownUntil = Date.now() + (60 * 60 * 1000); // 60 minutes from now
            rateLimitCooldowns.set(userId, {
              until: cooldownUntil,
              reason: 'Fitbit API rate limit exceeded'
            });
            
            // Update sync progress to show rate limit status
            syncProgress.set(userId, {
              total: daysToSync.length,
              completed: synced,
              current: null,
              status: 'rate_limited',
              cooldownUntil: cooldownUntil,
              reason: 'Fitbit API rate limit exceeded'
            });
            
            // Set timeout to clear cooldown and potentially resume
            setTimeout(async () => {
              rateLimitCooldowns.delete(userId);
              console.log(`Rate limit cooldown expired for user ${userId}`);
              
              // Check if Fitbit is still connected and if sync is still needed
              const currentUser = await UserModel.findById(userId);
              if (currentUser?.fitbit_connected && currentUser?.fitbit_access_token) {
                const stillNeedsSync = await FitbitController.userNeedsSync(userId);
                if (stillNeedsSync) {
                  console.log(`Resuming sync after rate limit cooldown...`);
                  FitbitController.startSync(userId);
                } else {
                  console.log(`No sync needed after cooldown for user ${userId}`);
                }
              } else {
                console.log(`Fitbit disconnected during cooldown, not resuming sync`);
              }
            }, 60 * 60 * 1000);
            return; // Exit the sync loop
          }
          
          // For other errors, retry once with exponential backoff
          if (!error.retried) {
            console.log(`Retrying ${day.toISOString().split('T')[0]} after error...`);
            try {
              await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
              const stepData = await fitbitService.getStepData(day);
              const StepModel = require('../models/Step');
              // Convert Date object to YYYY-MM-DD string for database
              const dateStr = day.toISOString().split('T')[0];
              await StepModel.updateFitbitSteps(userId, dateStr, stepData.steps || 0);
              synced++;
              console.log(`✅ Retry successful for ${day.toISOString().split('T')[0]}`);
            } catch (retryError) {
              console.error(`Retry failed for ${day.toISOString().split('T')[0]}:`, retryError.message);
              // Continue to next day instead of skipping
            }
          } else {
            console.error(`Final failure for ${day.toISOString().split('T')[0]} - skipping`);
          }
          
          // Handle expired token
          if (error.code === 'FITBIT_EXPIRED_TOKEN') {
            console.log(`Access token expired for user ${userId}, refreshing...`);
            try {
              const newTokens = await fitbitService.refreshAccessToken();
              
              // Update user with new tokens
              await UserModel.updateUser(userId, {
                fitbit_access_token: newTokens.access_token,
                fitbit_refresh_token: newTokens.refresh_token
              });
              
              console.log(`Token refreshed successfully for user ${userId}`);
              
              // Update service with new tokens
              fitbitService.setCredentials({
                access_token: newTokens.access_token,
                refresh_token: newTokens.refresh_token
              });
              
              // Retry the same day
              const stepData = await fitbitService.getStepData(day);
              const StepModel = require('../models/Step');
              // Convert Date object to YYYY-MM-DD string for database
              const dateStr = day.toISOString().split('T')[0];
              await StepModel.updateFitbitSteps(userId, dateStr, stepData.steps || 0);
              synced++;
              
              if (synced % 20 === 0) {
                console.log(`${synced}/${daysToSync.length} days synced`);
              }
              
              await new Promise(resolve => setTimeout(resolve, 3000));
              
            } catch (refreshError) {
              console.error(`Failed to refresh token for user ${userId}:`, refreshError.message);
              console.log(`Disconnecting Fitbit for user ${userId} due to refresh failure`);
              
              // Disconnect user's Fitbit if refresh fails
              await UserModel.updateUser(userId, {
                fitbit_access_token: null,
                fitbit_refresh_token: null,
                fitbit_connected: false
              });
              
              return; // Stop sync
            }
          } else {
            console.error(`Error syncing ${day.toISOString().split('T')[0]}:`, error.message);
          }
        }
      }
      
      console.log(`Sync complete - ${synced} days synced`);
      
      // Mark sync as completed
      syncProgress.set(userId, {
        total: daysToSync.length,
        completed: synced,
        current: null,
        status: 'completed'
      });
      
      // Clear progress after 30 seconds
      setTimeout(() => {
        syncProgress.delete(userId);
      }, 30000);
      
    } catch (error) {
      console.error(`Sync failed:`, error.message);
      
      // Mark sync as failed
      syncProgress.set(userId, {
        total: daysToSync.length,
        completed: synced,
        current: null,
        status: 'failed'
      });
      
      // Clear progress after 30 seconds
      setTimeout(() => {
        syncProgress.delete(userId);
      }, 30000);
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
      
      // Auto-sync trigger: check if sync is needed when dashboard is refreshed
      if (user?.fitbit_connected && user?.fitbit_access_token && !activeSyncs.has(userId)) {
        // Check if user is in rate limit cooldown
        const cooldown = rateLimitCooldowns.get(userId);
        if (cooldown && Date.now() < cooldown.until) {
          const remainingMinutes = Math.ceil((cooldown.until - Date.now()) / (60 * 1000));
          console.log(`Auto-sync blocked: User ${userId} in rate limit cooldown for ${remainingMinutes} more minutes`);
          
          // Update sync progress to show rate limit status
          syncProgress.set(userId, {
            total: 0,
            completed: 0,
            current: null,
            status: 'rate_limited',
            cooldownUntil: cooldown.until,
            reason: cooldown.reason
          });
        } else {
          // Run sync check in background to avoid blocking the response
          setImmediate(async () => {
            const needsSync = await FitbitController.userNeedsSync(userId);
            if (needsSync) {
              console.log('Auto-sync triggered from dashboard - historical sync needed');
              await FitbitController.startSync(userId);
            } else {
              console.log('Auto-sync check: No sync needed');
            }
          });
        }
      } else if (activeSyncs.has(userId)) {
        console.log('Sync already in progress, skipping auto-sync');
      }

      res.json({
        steps: localSteps,
        source: 'database',
        syncProgress: syncProgress.get(userId) || null
      });
    } catch (error) {
      console.error('Graph data error:', error);
      res.status(500).json({ message: "Error fetching step data", error: error.message });
    }
  }

  // Get sync progress for a user
  static async getSyncProgress(req, res) {
    try {
      const userId = req.user.sub;
      const progress = syncProgress.get(userId);
      
      res.json({
        progress: progress || null,
        isActive: activeSyncs.has(userId)
      });
    } catch (error) {
      console.error('Sync progress error:', error);
      res.status(500).json({ error: error.message });
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

  // Helper method to ensure tokens are fresh before sync operations
  static async ensureFreshTokens(userId, fitbitService) {
    try {
      const user = await UserModel.findById(userId);
      if (!user?.fitbit_connected || !user?.fitbit_access_token) {
        throw new Error('User not connected to Fitbit');
      }

      // Fitbit tokens expire after 8 hours
      // Check if token was issued more than 7 hours ago to proactively refresh
      const tokenAge = user.fitbit_connected_at ? 
        Date.now() - new Date(user.fitbit_connected_at).getTime() : 
        Infinity;
      
      const sevenHours = 7 * 60 * 60 * 1000;
      
      if (tokenAge > sevenHours) {
        console.log(`Token for user ${userId} is ${Math.round(tokenAge / (60 * 60 * 1000))} hours old, refreshing...`);
        
        fitbitService.setCredentials({
          access_token: user.fitbit_access_token,
          refresh_token: user.fitbit_refresh_token
        });
        
        const newTokens = await fitbitService.refreshAccessToken();
        
        await UserModel.updateUser(userId, {
          fitbit_access_token: newTokens.access_token,
          fitbit_refresh_token: newTokens.refresh_token,
          fitbit_connected_at: new Date()
        });
        
        fitbitService.setCredentials({
          access_token: newTokens.access_token,
          refresh_token: newTokens.refresh_token
        });
        
        console.log(`Proactively refreshed token for user ${userId}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Error ensuring fresh tokens for user ${userId}:`, error.message);
      throw error;
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

      // Proactively refresh token if it's getting old
      try {
        await FitbitController.ensureFreshTokens(userId, fitbitService);
      } catch (error) {
        console.log(`Could not refresh token proactively for user ${userId} during cron, will handle on-demand`);
      }

      let syncedCount = 0;
      for (const day of daysArray) {
        try {
          const stepData = await fitbitService.getStepData(day);
          const StepModel = require('../models/Step');
          // Convert Date object to YYYY-MM-DD string for database
          const dateStr = day.toISOString().split('T')[0];
          await StepModel.updateFitbitSteps(userId, dateStr, stepData.steps || 0);
          syncedCount++;
          
          // Conservative delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          if (error.message.includes('429')) {
            console.log(`Rate limit hit during specific days sync for user ${userId}`);
            break;
          }
          
          // Handle expired token
          if (error.code === 'FITBIT_EXPIRED_TOKEN') {
            console.log(`Access token expired for user ${userId} during cron sync, refreshing...`);
            try {
              const newTokens = await fitbitService.refreshAccessToken();
              
              // Update user with new tokens
              await UserModel.updateUser(userId, {
                fitbit_access_token: newTokens.access_token,
                fitbit_refresh_token: newTokens.refresh_token
              });
              
              console.log(`Token refreshed for user ${userId} during cron sync`);
              
              // Update service with new tokens
              fitbitService.setCredentials({
                access_token: newTokens.access_token,
                refresh_token: newTokens.refresh_token
              });
              
              // Retry the same day
              const stepData = await fitbitService.getStepData(day);
              const StepModel = require('../models/Step');
              const dateStr = day.toISOString().split('T')[0];
              await StepModel.updateFitbitSteps(userId, dateStr, stepData.steps || 0);
              syncedCount++;
              
              await new Promise(resolve => setTimeout(resolve, 2000));
              
            } catch (refreshError) {
              console.error(`Failed to refresh token for user ${userId} during cron:`, refreshError.message);
              console.log(`Disconnecting Fitbit for user ${userId} due to refresh failure`);
              
              // Disconnect user's Fitbit if refresh fails
              await UserModel.updateUser(userId, {
                fitbit_access_token: null,
                fitbit_refresh_token: null,
                fitbit_connected: false
              });
              
              break; // Stop syncing for this user
            }
          } else {
            console.error(`Error syncing ${day.toISOString().split('T')[0]} for user ${userId}:`, error.message);
          }
        }
      }
      
      console.log(`Completed specific days sync for user ${userId}: ${syncedCount}/${daysArray.length} days`);
    } finally {
      activeSyncs.delete(userId);
    }
  }
}

module.exports = FitbitController;