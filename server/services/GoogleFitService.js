const { google } = require('googleapis');
const axios = require('axios');

class GoogleFitService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    this.scopes = [
      'https://www.googleapis.com/auth/fitness.activity.read',
      'https://www.googleapis.com/auth/fitness.body.read',
      'https://www.googleapis.com/auth/fitness.location.read'
    ];
  }

  // Generate OAuth URL for user to authorize
  getAuthUrl(userId) {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.scopes,
      prompt: 'consent',
      state: userId
    });
  }

  // Exchange authorization code for tokens
  async getTokensFromCode(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      return tokens;
    } catch (error) {
      console.error('Error getting tokens:', error);
      throw new Error('Failed to get access tokens');
    }
  }

  // Set credentials for API calls
  setCredentials(tokens) {
    this.oauth2Client.setCredentials(tokens);
  }

  // Fetch step data from Google Fit
  async getStepData(startTime, endTime) {
    try {
      const fitness = google.fitness('v1');
      
      const response = await fitness.users.dataset.aggregate({
        auth: this.oauth2Client,
        userId: 'me',
        requestBody: {
          aggregateBy: [{
            dataTypeName: 'com.google.step_count.delta',
            dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps'
          }],
          bucketByTime: {
            durationMillis: '86400000' // 24 hours
          },
          startTimeMillis: startTime,
          endTimeMillis: endTime
        }
      });

      return this.parseStepData(response.data);
    } catch (error) {
      console.error('Error fetching step data:', error);
      throw new Error('Failed to fetch step data from Google Fit');
    }
  }

  // Parse Google Fit response into usable format
  parseStepData(data) {
    const steps = {};
    
    if (data.bucket) {
      data.bucket.forEach(bucket => {
        const date = new Date(parseInt(bucket.startTimeMillis));
        const dateString = date.toISOString().split('T')[0];
        
        let stepCount = 0;
        if (bucket.dataset && bucket.dataset[0] && bucket.dataset[0].point) {
          bucket.dataset[0].point.forEach(point => {
            stepCount += parseInt(point.value[0].intVal || 0);
          });
        }
        
        steps[dateString] = stepCount;
      });
    }
    
    return steps;
  }

  // Refresh access token if expired
  async refreshAccessToken(refreshToken) {
    try {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken
      });
      
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      return credentials;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  // Get user's Google Fit profile
  async getUserProfile() {
    try {
      const fitness = google.fitness('v1');
      const response = await fitness.users.profile.get({
        auth: this.oauth2Client,
        userId: 'me'
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw new Error('Failed to get Google Fit profile');
    }
  }
}

module.exports = GoogleFitService;
