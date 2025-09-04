const FitbitService = require("../services/FitbitService");
const UserModel = require("../models/User");
const {pool} = require('../db');

class FitbitController {
  // Get OAuth URL for user to authorize Fitbit
  static async getAuthUrl(req, res) {
    try {
      console.log('=== FITBIT AUTH URL REQUEST ===');
      console.log('Request user object:', req.user);
      console.log('Request user sub:', req.user?.sub);
      
      const userId = req.user.sub; // Get user ID from authenticated request
      console.log('Extracted userId:', userId);
      
      const fitbitService = new FitbitService();
      const authUrl = fitbitService.getAuthUrl(userId);
      
      console.log('Generated auth URL:', authUrl);
      console.log('===============================');
      
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
      console.log('=== FITBIT OAUTH CALLBACK RECEIVED ===');
      console.log('Query params:', req.query);
      console.log('Full URL:', req.url);
      
      const { code, state } = req.query;
      const userId = state; // Get user ID from state parameter
      
      console.log('Code:', code ? '✅ Present' : '❌ Missing');
      console.log('State (userId):', userId);

      if (!code) {
        console.log('❌ No authorization code received');
        return res.status(400).json({
          error: "Authorization code is required",
        });
      }

      const fitbitService = new FitbitService();
      const tokens = await fitbitService.getTokensFromCode(code);
      
      console.log('=== FITBIT OAUTH CALLBACK DEBUG ===');
      console.log('User ID:', userId);
      console.log('Tokens received:', {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiresIn: tokens.expires_in,
        tokenFields: Object.keys(tokens)
      });

      // Store tokens in user's record
      const updateResult = await UserModel.updateUser(userId, {
        fitbit_access_token: tokens.access_token,
        fitbit_refresh_token: tokens.refresh_token,
        fitbit_token_expiry: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
        fitbit_connected: true,
        fitbit_connected_at: new Date(),
      });
      
      console.log('Update result:', updateResult);
      console.log('=====================================');

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
      console.log('=== FITBIT SYNC DEBUG ===');
      console.log('User ID:', userId);
      console.log('User object:', user);
      console.log('User fields:', user ? Object.keys(user) : 'No user found');
      console.log('Fitbit connected:', user?.fitbit_connected);
      console.log('Fitbit access token exists:', !!user?.fitbit_access_token);
      console.log('========================');
      
      if (!user?.fitbit_connected || !user?.fitbit_access_token) {
        console.log('❌ Fitbit sync failed - not connected or no access token');
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

      // INCREMENTAL SYNC LOGIC: Find the oldest date with Fitbit data and go back 7 more days
      const StepModel = require('../models/Step');
      
      // Define today at the top level so it's available throughout the function
      const today = new Date();
      const currentYear = today.getFullYear();
      const januaryFirst = new Date(currentYear, 0, 1); // January 1st of current year
      
      // Find the oldest date that has Fitbit steps for this user
      const [oldestRows] = await pool.query(
        'SELECT MIN(date) as oldest_date FROM steps WHERE user_id = ? AND fitbit_steps > 0',
        [userId]
      );
      
      let startDate, endDate;
      
      if (oldestRows[0].oldest_date) {
        // INCREMENTAL SYNC: Smart sync strategy
        const oldestDate = new Date(oldestRows[0].oldest_date);
        
        // Strategy: Get today's data + everything from oldest date back to Jan 1st
        const todayString = today.toISOString().split('T')[0];
        const oldestString = oldestDate.toISOString().split('T')[0];
        
        if (oldestString === todayString) {
          // Only have today's data - go back to Jan 1st
          endDate = new Date(oldestDate.getTime() - 24 * 60 * 60 * 1000); // Day before oldest
          startDate = januaryFirst;
          console.log(`🔄 INCREMENTAL SYNC: Only have today's data, syncing from Jan 1st to yesterday (${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]})`);
        } else {
          // Have historical data - get today + go back from oldest to Jan 1st
          endDate = new Date(oldestDate.getTime() - 24 * 60 * 60 * 1000); // Day before oldest
          startDate = januaryFirst;
          console.log(`🔄 INCREMENTAL SYNC: Found existing data from ${oldestRows[0].oldest_date}, syncing from Jan 1st to day before oldest (${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]})`);
          console.log(`📅 Also will refresh today's data (${todayString}) in case it updated`);
        }
      } else {
        // FIRST SYNC: No existing data - try to get 6 months of historical data (180 days)
        // This is aggressive but will give users a complete picture from day one
        endDate = new Date();
        startDate = new Date(endDate.getTime() - 179 * 24 * 60 * 60 * 1000); // 180 days ago
        console.log(`🆕 FIRST SYNC: No existing Fitbit data, attempting to sync 6 months of historical data (${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]})`);
        console.log(`📊 This may take 2-3 minutes but will give you complete historical data!`);
      }
      
      const stepData = {};
      let totalStepsSynced = 0;
      let rateLimitHit = false;

      // Create array of days to fetch, starting with most recent
      const daysToFetch = [];
      for (let d = new Date(endDate); d >= startDate; d.setDate(d.getDate() - 1)) {
        daysToFetch.push(new Date(d));
      }
      
      // For incremental syncs with historical data, also add today's date to refresh it
      if (oldestRows[0].oldest_date && oldestRows[0].oldest_date !== today.toISOString().split('T')[0]) {
        const todayString = today.toISOString().split('T')[0];
        const endDateString = endDate.toISOString().split('T')[0];
        
        // Only add today if it's not already in our range
        if (todayString !== endDateString) {
          daysToFetch.unshift(today); // Add today at the beginning (most recent)
          console.log(`📅 Added today's date (${todayString}) to refresh in case steps updated`);
        }
      }

      // PARALLEL PROCESSING: Process days in batches to maximize throughput while respecting rate limits
      console.log(`🚀 PARALLEL SYNC: Processing ${daysToFetch.length} days with controlled concurrency...`);
      
      // Optimize batch settings based on sync type and data range
      const isFirstSync = !oldestRows[0].oldest_date;
      const isLargeIncrementalSync = !isFirstSync && daysToFetch.length > 50; // Going back to Jan 1st
      
      let BATCH_SIZE, BATCH_DELAY;
      if (isFirstSync) {
        BATCH_SIZE = 8; // First sync: 8 concurrent
        BATCH_DELAY = 1500; // 1.5s delays
      } else if (isLargeIncrementalSync) {
        BATCH_SIZE = 10; // Large incremental: 10 concurrent (going back to Jan 1st)
        BATCH_DELAY = 1200; // 1.2s delays (faster for large syncs)
      } else {
        BATCH_SIZE = 5; // Small incremental: 5 concurrent
        BATCH_DELAY = 2000; // 2s delays
      }
      
      const syncMode = isFirstSync ? 'FIRST SYNC' : (isLargeIncrementalSync ? 'LARGE INCREMENTAL SYNC' : 'SMALL INCREMENTAL SYNC');
      console.log(`⚡ ${syncMode} mode: ${BATCH_SIZE} concurrent requests, ${BATCH_DELAY}ms delays`);
      
      if (isFirstSync || isLargeIncrementalSync) {
        console.log(`⏱️  Estimated time: ${Math.ceil(daysToFetch.length / BATCH_SIZE) * (BATCH_DELAY / 1000)} seconds`);
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
        
        console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${progressPercent}%): ${batch.length} days (${batch[0].toISOString().split('T')[0]} to ${batch[batch.length-1].toISOString().split('T')[0]})`);
        
        if (isFirstSync && batchNumber % 5 === 0) {
          console.log(`📊 Progress: ${totalStepsSynced} days synced so far, ${Math.round((totalBatches - batchNumber) * (BATCH_DELAY / 1000))} seconds remaining`);
        }
        
        // Process batch in parallel
        const batchPromises = batch.map(async (day) => {
          try {
            console.log(`📅 Fetching steps for ${day.toISOString().split('T')[0]}...`);
            const dayData = await fitbitService.getStepData(day);
            if (dayData.steps > 0) {
              stepData[dayData.date] = dayData.steps;
              totalStepsSynced++;
              console.log(`✅ ${dayData.date}: ${dayData.steps} steps`);
            } else {
              console.log(`📊 ${dayData.date}: 0 steps`);
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
                if (retryData.steps > 0) {
                  stepData[retryData.date] = retryData.steps;
                  totalStepsSynced++;
                  console.log(`✅ (after refresh) ${retryData.date}: ${retryData.steps} steps`);
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

            // For other errors, continue but log them
            console.log(`⚠️ Continuing despite error for ${day.toISOString().split('T')[0]}`);
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
          console.log(`⏳ Waiting ${BATCH_DELAY}ms before next batch...`);
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
        }
      }

      // Save step data to database using StepModel
      for (const [date, steps] of Object.entries(stepData)) {
        if (steps > 0) {
          await StepModel.updateFitbitSteps(userId, date, steps);
        }
      }

      // Update last sync timestamp
      await UserModel.updateUser(userId, {
        fitbit_last_sync: new Date()
      });

      // Calculate sync statistics
      const totalDaysRequested = daysToFetch.length;
      const syncType = isFirstSync ? 'first' : 'incremental';
      const syncRange = `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`;
      
      res.json({
        message: rateLimitHit 
          ? `Partial ${syncType} sync: ${totalStepsSynced}/${totalDaysRequested} days synced before hitting rate limit.` 
          : `Complete ${syncType} sync: ${totalStepsSynced}/${totalDaysRequested} days synced successfully.`,
        stepsSynced: totalStepsSynced,
        totalDaysRequested,
        syncType,
        syncRange,
        stepData,
        rateLimitHit,
        isFirstSync,
        message: rateLimitHit 
          ? `Partial ${syncType} sync: ${totalStepsSynced}/${totalDaysRequested} days synced before hitting rate limit. Range: ${syncRange}` 
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
              console.log('Using cached Fitbit data (synced within 24 hours)');
              res.json({
                steps: localSteps,
                source: 'local_with_cached_fitbit'
              });
              return;
            }
          }
          
          // Only make API calls if we haven't synced recently
          console.log('Fetching fresh Fitbit data for graph');
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