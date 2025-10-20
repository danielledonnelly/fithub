const axios = require('axios');
const querystring = require('querystring');

class FitbitService {
  constructor() {
    this.clientId = process.env.FITBIT_CLIENT_ID;
    this.clientSecret = process.env.FITBIT_CLIENT_SECRET;
    this.redirectUri = process.env.FITBIT_REDIRECT_URI;
    this.scopes = ['activity']; // Add more scopes if needed
    this.tokenUrl = 'https://api.fitbit.com/oauth2/token';
    this.apiBaseUrl = 'https://api.fitbit.com';
    this.accessToken = null;
    this.refreshToken = null;
  }

  // Generate OAuth URL for user to authorize
  getAuthUrl(state) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scopes.join(' '),
      state
    });
    return `https://www.fitbit.com/oauth2/authorize?${params.toString()}`;
  }

  // Exchange authorization code for tokens
  async getTokensFromCode(code) {
    try {
      console.log('=== FITBIT TOKEN EXCHANGE ===');
      console.log('Client ID:', this.clientId ? '✅ Set' : '❌ Missing');
      console.log('Client Secret:', this.clientSecret ? '✅ Set' : '❌ Missing');
      console.log('Redirect URI:', this.redirectUri ? '✅ Set' : '❌ Missing');
      console.log('Code:', code ? '✅ Present' : '❌ Missing');
      
      const authHeader = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      console.log('Auth header generated:', !!authHeader);

      const requestBody = querystring.stringify({
        client_id: this.clientId,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
        code
      });
      
      console.log('Request body:', requestBody);
      console.log('Token URL:', this.tokenUrl);

      const { data } = await axios.post(
        this.tokenUrl,
        requestBody,
        {
          headers: {
            Authorization: `Basic ${authHeader}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      console.log('✅ Token exchange successful!');
      console.log('Response data keys:', Object.keys(data));
      console.log('Has access_token:', !!data.access_token);
      console.log('Has refresh_token:', !!data.refresh_token);
      console.log('===============================');

      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      return data;
    } catch (error) {
      console.error('❌ Error getting Fitbit tokens:', error.response?.data || error.message);
      console.error('Full error:', error);
      throw new Error('Failed to get access tokens');
    }
  }

  // Set credentials for API calls
  setCredentials(tokens) {
    this.accessToken = tokens.access_token;
    this.refreshToken = tokens.refresh_token;
  }

  // Fetch step data from Fitbit
  async getStepData(date = new Date()) {
    try {
      // Use local date formatting instead of UTC
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`; // YYYY-MM-DD
      const { data } = await axios.get(
        `${this.apiBaseUrl}/1/user/-/activities/date/${dateStr}.json`,
        {
          headers: { Authorization: `Bearer ${this.accessToken}` }
        }
      );
      return {
        date: dateStr,
        steps: data.summary?.steps || 0
      };
    } catch (error) {
      const status = error.response?.status;
      const fitbitErrors = error.response?.data?.errors;
      console.error('Error fetching Fitbit step data:', error.response?.data || error.message);

      // Detect expired token from Fitbit error payload
      if (Array.isArray(fitbitErrors) && fitbitErrors.some(e => e?.errorType === 'expired_token')) {
        const expiredErr = new Error('FITBIT_EXPIRED_TOKEN');
        expiredErr.code = 'FITBIT_EXPIRED_TOKEN';
        expiredErr.status = status;
        expiredErr.fitbit = fitbitErrors;
        throw expiredErr;
      }

      // Surface rate limit explicitly so callers can handle it
      if (status === 429) {
        const rateErr = new Error('429 Too Many Requests');
        rateErr.code = 'FITBIT_RATE_LIMIT';
        rateErr.status = 429;
        throw rateErr;
      }

      throw new Error('Failed to fetch step data from Fitbit');
    }
  }

  // Refresh access token if expired
  async refreshAccessToken() {
    try {
      const authHeader = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const { data } = await axios.post(
        this.tokenUrl,
        querystring.stringify({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken
        }),
        {
          headers: {
            Authorization: `Basic ${authHeader}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      return data;
    } catch (error) {
      console.error('Error refreshing Fitbit token:', error.response?.data || error.message);
      throw new Error('Failed to refresh access token');
    }
  }

  // Get user's Fitbit profile
  async getUserProfile() {
    try {
      const { data } = await axios.get(`${this.apiBaseUrl}/1/user/-/profile.json`, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
      return data.user;
    } catch (error) {
      console.error('Error getting Fitbit profile:', error.response?.data || error.message);
      throw new Error('Failed to get Fitbit profile');
    }
  }
}

module.exports = FitbitService;