const FitbitService = require("../services/FitbitService");
const UserModel = require("../models/User");

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
        const minSyncInterval = 5 * 60 * 1000; // 5 minutes
        
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

      // Get step data for last 7 days, starting with most recent
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      
      const stepData = {};
      let totalStepsSynced = 0;
      let rateLimitHit = false;

      // Create array of days to fetch, starting with most recent
      const daysToFetch = [];
      for (let d = new Date(endDate); d >= startDate; d.setDate(d.getDate() - 1)) {
        daysToFetch.push(new Date(d));
      }

      // Fetch steps starting from most recent days
      for (const day of daysToFetch) {
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
          
          // Add delay between API calls to respect rate limits
          if (day !== daysToFetch[daysToFetch.length - 1]) {
            await new Promise(resolve => setTimeout(resolve, 400)); // 400ms delay
          }
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
              // small delay after refresh to be safe
              await new Promise(resolve => setTimeout(resolve, 300));
              continue; // proceed to next day
            } catch (refreshErr) {
              console.error('❌ Fitbit token refresh failed:', refreshErr);
            }
          }

          // If we hit rate limit, stop and return what we have
          if (dayError.message && dayError.message.includes('429')) {
            console.log('🚫 Rate limit hit, stopping sync early');
            rateLimitHit = true;
            break;
          }

          // For other errors, continue but log them
          console.log(`⚠️ Continuing despite error for ${day.toISOString().split('T')[0]}`);
        }
      }

      // Save step data to database using StepModel
      const StepModel = require('../models/Step');
      for (const [date, steps] of Object.entries(stepData)) {
        if (steps > 0) {
          await StepModel.updateFitbitSteps(userId, date, steps);
        }
      }

      // Update last sync timestamp
      await UserModel.updateUser(userId, {
        fitbit_last_sync: new Date()
      });

      res.json({
        message: rateLimitHit 
          ? `Steps synced partially (rate limit reached). Got ${totalStepsSynced} days.` 
          : "Steps synced successfully",
        stepsSynced: totalStepsSynced,
        stepData,
        rateLimitHit,
        message: rateLimitHit 
          ? `Partial sync: ${totalStepsSynced} days synced before hitting rate limit. Recent days prioritized.` 
          : `Full sync: ${totalStepsSynced} days synced successfully.`
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