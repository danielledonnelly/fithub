const FitbitService = require("../services/FitbitService");
const UserModel = require("../models/User");
const {pool} = require('../db');

class FitbitController {
  // Get OAuth URL for user to authorize Fitbit
  static async getAuthUrl(req, res) {
    try {
      const userId = req.user.sub; // Get user ID from authenticated request
      console.log('🔗 Generating Fitbit auth URL for user', userId);
      
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
      
      console.log('🔗 Fitbit callback for user', userId);

      if (!code) {
        return res.status(400).json({
          error: "Authorization code is required",
        });
      }

      const fitbitService = new FitbitService();
      const tokens = await fitbitService.getTokensFromCode(code);
      

      // Store tokens in user's record
      const updateResult = await UserModel.updateUser(userId, {
        fitbit_access_token: tokens.access_token,
        fitbit_refresh_token: tokens.refresh_token,
        fitbit_token_expiry: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
        fitbit_connected: true,
        fitbit_connected_at: new Date(),
      });
      

      // Check if user needs historical sync and trigger background sync
      const StepModel = require('../models/Step');
      const needsHistoricalSync = await StepModel.userNeedsHistoricalSync(userId);
      
      if (needsHistoricalSync) {
        console.log('Auto-sync triggered for new connection');
        
        // Trigger sync in background (don't await it)
        const syncReq = { user: { sub: userId } };
        const syncRes = {
          json: (data) => {
            console.log(`✅ Auto-sync completed: ${data.stepsSynced} days`);
          },
          status: (code) => ({
            json: (data) => {
              console.log(`❌ Auto-sync failed: ${data.message}`);
            }
          })
        };
        
        FitbitController.syncSteps(syncReq, syncRes).catch(error => {
          console.error('❌ Auto-sync error:', error);
        });
      }
      

      res.json({
        message: "Fitbit connected successfully. Historical step data will be synced automatically.",
        connected: true,
        backgroundSyncTriggered: needsHistoricalSync
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
      console.log('🔄 Starting Fitbit sync for user', userId);
      
      if (!user?.fitbit_connected || !user?.fitbit_access_token) {
        console.log('❌ Fitbit not connected');
        return res.status(400).json({
          error: "Fitbit not connected",
          message: "Please connect your Fitbit account first",
        });
      }

      // Check if we're syncing too frequently (rate limiting)
      const lastSync = user.fitbit_last_sync;
      if (lastSync) {
        const timeSinceLastSync = Date.now() - new Date(lastSync).getTime();
        const minSyncInterval = 3 * 60 * 1000; // 3 minutes (temporarily reduced for testing)
        
        if (timeSinceLastSync < minSyncInterval) {
          const remainingTime = Math.ceil((minSyncInterval - timeSinceLastSync) / 1000 / 60);
          return res.status(429).json({
            error: "Sync too frequent",
            message: `Please wait ${remainingTime} minutes before syncing again. Fitbit has rate limits.`,
          });
        }
      }

      const fitbitService = new FitbitService();

      // Set credentials
      fitbitService.setCredentials({
        access_token: user.fitbit_access_token,
        refresh_token: user.fitbit_refresh_token,
      });

      // SIMPLE USER-FOCUSED SYNC: Start from today, work backwards until Jan 1st or rate limit
      const StepModel = require('../models/Step');
      
      const today = new Date();
      const currentYear = today.getFullYear();
      const januaryFirst = new Date(currentYear, 0, 1); // January 1st of current year
      
      // Check what days we've already attempted to sync (any record exists)
      const [existingRows] = await pool.query(
        'SELECT date FROM steps WHERE user_id = ?',
        [userId]
      );
      const existingDates = new Set(existingRows.map(row => row.date));
      
      console.log(`🔄 Starting sync from today, working backwards to Jan 1st`);
      console.log(`📊 Already have data for ${existingDates.size} days`);
      
      const stepData = {};
      let totalStepsSynced = 0;
      let rateLimitHit = false;

      // Create array of days to fetch: today working backwards to Jan 1st
      // Skip days we already have data for
      const daysToFetch = [];
      for (let d = new Date(today); d >= januaryFirst; d.setDate(d.getDate() - 1)) {
        const dateStr = d.toISOString().split('T')[0];
        if (!existingDates.has(dateStr)) {
          daysToFetch.push(new Date(d));
        }
      }
      
      console.log(`📅 Need to fetch ${daysToFetch.length} missing days`);
      if (daysToFetch.length === 0) {
        console.log(`✅ All days up to Jan 1st already synced!`);
        return res.json({
          message: 'All available days already synced',
          stepsSynced: 0,
          totalDaysRequested: 0,
          syncType: 'complete',
          rateLimitHit: false
        });
      }

      console.log(`🚀 Processing ${daysToFetch.length} days...`);
      
      // Optimize batch settings based on how many days we need to fetch
      const isFirstSync = existingDates.size === 0;
      const isLargeSync = daysToFetch.length > 50;
      
      let BATCH_SIZE, BATCH_DELAY;
      // Conservative batching to respect 150 requests/hour limit (2.5 requests/minute max)
      if (isFirstSync) {
        BATCH_SIZE = 3; // First sync: 3 concurrent
        BATCH_DELAY = 5000; // 5s delays
      } else if (isLargeSync) {
        BATCH_SIZE = 4; // Large sync: 4 concurrent
        BATCH_DELAY = 4000; // 4s delays
      } else {
        BATCH_SIZE = 2; // Small sync: 2 concurrent
        BATCH_DELAY = 6000; // 6s delays
      }
      
      for (let i = 0; i < daysToFetch.length; i += BATCH_SIZE) {
        if (rateLimitHit) {
          console.log('🚫 Rate limit hit, stopping batch processing');
          break;
        }
        
        const batch = daysToFetch.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i/BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(daysToFetch.length / BATCH_SIZE);
        const progressPercent = Math.round((i / daysToFetch.length) * 100);
        
        if (batchNumber % 10 === 0 || batchNumber === 1) {
          console.log(`📦 Batch ${batchNumber}/${totalBatches} (${progressPercent}%)`);
        }
        
        // Process batch in parallel
        const batchPromises = batch.map(async (day) => {
          try {
            const dayData = await fitbitService.getStepData(day);
            // Always record the sync attempt, even if 0 steps
            stepData[dayData.date] = dayData.steps;
            if (dayData.steps > 0) {
              totalStepsSynced++;
            }
            return { success: true, date: day.toISOString().split('T')[0] };
          } catch (dayError) {
            console.error(`❌ Error fetching steps for ${day.toISOString().split('T')[0]}:`, dayError);

            // Handle expired token by refreshing once, persisting, and retrying this day
            if (dayError?.code === 'FITBIT_EXPIRED_TOKEN' || (dayError?.message && dayError.message.includes('expired_token'))) {
              try {
                const refreshed = await fitbitService.refreshAccessToken();
                // Persist new tokens to user
                await UserModel.updateUser(userId, {
                  fitbit_access_token: refreshed.access_token,
                  fitbit_refresh_token: refreshed.refresh_token || user.fitbit_refresh_token,
                  fitbit_token_expiry: refreshed.expires_in ? new Date(Date.now() + refreshed.expires_in * 1000) : null,
                });
                // Update in-memory credentials
                fitbitService.setCredentials({
                  access_token: refreshed.access_token,
                  refresh_token: refreshed.refresh_token || user.fitbit_refresh_token,
                });
                // Retry once for this day
                const retryData = await fitbitService.getStepData(day);
                // Always record the retry attempt, even if 0 steps
                stepData[retryData.date] = retryData.steps;
                if (retryData.steps > 0) {
                  totalStepsSynced++;
                }
                return { success: true, date: day.toISOString().split('T')[0], retried: true };
              } catch (refreshErr) {
                console.error('❌ Fitbit token refresh failed:', refreshErr);
                return { success: false, date: day.toISOString().split('T')[0], error: refreshErr };
              }
            }

            // Check for rate limit
            if (dayError.message && dayError.message.includes('429')) {
              console.log('🚫 Rate limit hit in batch');
              rateLimitHit = true;
              return { success: false, date: day.toISOString().split('T')[0], rateLimit: true };
            }

            // For other errors, continue silently
            return { success: false, date: day.toISOString().split('T')[0], error: dayError };
          }
        });

        // Wait for all requests in this batch to complete
        const batchResults = await Promise.all(batchPromises);
        
        // Check if any request hit rate limit
        if (batchResults.some(result => result.rateLimit)) {
          rateLimitHit = true;
          break;
        }
        
        // Add delay between batches to respect rate limits (except for the last batch)
        if (i + BATCH_SIZE < daysToFetch.length && !rateLimitHit) {
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
        }
      }

      // Save step data to database using StepModel
      // Always save records, even for 0 steps, to mark that we've attempted sync
      for (const [date, steps] of Object.entries(stepData)) {
        await StepModel.updateFitbitSteps(userId, date, steps);
      }

      // Update last sync timestamp
      await UserModel.updateUser(userId, {
        fitbit_last_sync: new Date()
      });

      // Calculate sync statistics
      const totalDaysRequested = daysToFetch.length;
      const syncType = isFirstSync ? 'first' : 'incremental';
      const syncRange = daysToFetch.length > 0 
        ? `${daysToFetch[daysToFetch.length-1].toISOString().split('T')[0]} to ${daysToFetch[0].toISOString().split('T')[0]}`
        : 'no days to sync';
      
      // If we hit rate limit, always schedule auto-resume
      if (rateLimitHit) {
        console.log(`⏳ Rate limit hit. Auto-resuming sync in 65 minutes...`);
        
        setTimeout(() => {
          console.log(`🔄 Auto-resuming Fitbit sync after rate limit cooldown...`);
          
          // Create a mock request/response for the resume
          const resumeReq = { user: { sub: userId } };
          const resumeRes = {
            json: (data) => {
              if (data.rateLimitHit) {
                console.log(`⏳ Rate limit hit. Auto-resuming sync in 65 minutes...`);
              } else {
                console.log(`✅ Auto-resume completed: ${data.stepsSynced} total days synced`);
              }
            },
            status: (code) => ({
              json: (data) => {
                console.log(`❌ Auto-resume failed: ${data.message}`);
              }
            })
          };
          
          // Resume the sync
          FitbitController.syncSteps(resumeReq, resumeRes).catch(error => {
            console.error('❌ Auto-resume error:', error);
          });
        }, 65 * 60 * 1000); // Wait 65 minutes (Fitbit rate limit is 60 minutes)
      }
      
      res.json({
        message: rateLimitHit 
          ? `Partial ${syncType} sync: ${totalStepsSynced}/${totalDaysRequested} days synced before hitting rate limit. Will auto-resume in 65 minutes.` 
          : `Complete ${syncType} sync: ${totalStepsSynced}/${totalDaysRequested} days synced successfully.`,
        stepsSynced: totalStepsSynced,
        totalDaysRequested,
        syncType,
        syncRange,
        stepData,
        rateLimitHit,
        isFirstSync,
        autoResumeScheduled: rateLimitHit,
        message: rateLimitHit 
          ? `Partial ${syncType} sync: ${totalStepsSynced}/${totalDaysRequested} days synced before hitting rate limit. Range: ${syncRange}. Will auto-resume in 65 minutes.` 
          : `Complete ${syncType} sync: ${totalStepsSynced}/${totalDaysRequested} days synced successfully. Range: ${syncRange}`
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
      
      console.log('Fitbit status check:', {
        userId,
        fitbitConnected: user?.fitbit_connected,
        hasAccessToken: !!user?.fitbit_access_token,
        userFields: user ? Object.keys(user) : 'No user found'
      });

      res.json({
        connected: user?.fitbit_connected || false,
        connectedAt: user?.fitbit_connected_at,
        lastSync: user?.fitbit_last_sync,
        debug: {
          hasAccessToken: !!user?.fitbit_access_token,
          hasRefreshToken: !!user?.fitbit_refresh_token,
          userFields: user ? Object.keys(user) : []
        }
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
          // Check if we've synced recently to avoid API spam
          const lastSync = user.fitbit_last_sync;
          if (lastSync) {
            const timeSinceLastSync = Date.now() - new Date(lastSync).getTime();
            const maxAgeForFitbitData = 24 * 60 * 60 * 1000; // 24 hours
            
            if (timeSinceLastSync < maxAgeForFitbitData) {
              // Use cached Fitbit data from database instead of making new API calls
              res.json({
                steps: localSteps,
                source: 'local_with_cached_fitbit'
              });
              return;
            }
          }
          
          // Only make API calls if we haven't synced recently
          const fitbitService = new FitbitService();
          fitbitService.setCredentials({
            access_token: user.fitbit_access_token,
            refresh_token: user.fitbit_refresh_token,
          });
          
          // Get last 30 days of data (reduced from 365 to avoid rate limits)
          const endDate = new Date();
          const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
          
          const fitbitSteps = {};
          let apiCallsMade = 0;
          const maxApiCalls = 10; // Limit to 10 API calls max
          
          for (let d = new Date(startDate); d <= endDate && apiCallsMade < maxApiCalls; d.setDate(d.getDate() + 1)) {
            try {
              const dayData = await fitbitService.getStepData(new Date(d));
              if (dayData.steps > 0) {
                fitbitSteps[dayData.date] = dayData.steps;
              }
              apiCallsMade++;
              
              // Add delay between API calls
              if (apiCallsMade < maxApiCalls) {
                await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
              }
            } catch (dayError) {
              console.error(`Error fetching Fitbit data for ${d.toISOString().split('T')[0]}:`, dayError);
              // Handle expired token by refreshing once, persisting, and retrying this date
              if (dayError?.code === 'FITBIT_EXPIRED_TOKEN' || (dayError?.message && dayError.message.includes('expired_token'))) {
                try {
                  const refreshed = await fitbitService.refreshAccessToken();
                  await UserModel.updateUser(userId, {
                    fitbit_access_token: refreshed.access_token,
                    fitbit_refresh_token: refreshed.refresh_token || user.fitbit_refresh_token,
                    fitbit_token_expiry: refreshed.expires_in ? new Date(Date.now() + refreshed.expires_in * 1000) : null,
                  });
                  fitbitService.setCredentials({
                    access_token: refreshed.access_token,
                    refresh_token: refreshed.refresh_token || user.fitbit_refresh_token,
                  });
                  const retryData = await fitbitService.getStepData(new Date(d));
                  if (retryData.steps > 0) {
                    fitbitSteps[retryData.date] = retryData.steps;
                  }
                  apiCallsMade++;
                  if (apiCallsMade < maxApiCalls) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                  }
                  continue;
                } catch (refreshErr) {
                  console.error('Fitbit token refresh failed (graph fetch):', refreshErr);
                }
              }
              if (dayError.message && dayError.message.includes('429')) {
                console.log('Rate limit hit in graph data fetch, stopping early');
                break;
              }
              // Continue for other errors
            }
          }
          
          // Merge data (Fitbit takes precedence for overlapping dates)
          const mergedSteps = { ...localSteps, ...fitbitSteps };
          
          res.json({
            steps: mergedSteps,
            source: 'combined',
            apiCallsMade
          });
        } catch (fitbitError) {
          console.error('Fitbit error in graph fetch, falling back to local data:', fitbitError);
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