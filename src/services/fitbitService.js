import axios from 'axios';

const FITBIT_AUTH_URL = 'https://www.fitbit.com/oauth2/authorize';
const FITBIT_TOKEN_URL = 'https://api.fitbit.com/oauth2/token';
const FITBIT_API_BASE_URL = 'https://api.fitbit.com/1/user/-';

// Helper function to encode in base64 (browser-safe)
const btoa = (str) => window.btoa(unescape(encodeURIComponent(str)));

class FitbitService {
    constructor() {
        this.clientId = process.env.REACT_APP_FITBIT_CLIENT_ID;
        this.clientSecret = process.env.REACT_APP_FITBIT_CLIENT_SECRET;
        this.redirectUri = process.env.REACT_APP_FITBIT_REDIRECT_URI;
        this.scope = process.env.REACT_APP_FITBIT_SCOPE || 'activity heartrate profile';

        // Validate required environment variables
        if (!this.clientId) throw new Error('REACT_APP_FITBIT_CLIENT_ID is required');
        if (!this.clientSecret) throw new Error('REACT_APP_FITBIT_CLIENT_SECRET is required');
        if (!this.redirectUri) throw new Error('REACT_APP_FITBIT_REDIRECT_URI is required');

        console.log('FitbitService initialized with:', {
            clientId: this.clientId,
            redirectUri: this.redirectUri,
            scope: this.scope
        });
    }

    getAuthUrl() {
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            scope: this.scope,
            expires_in: '31536000' // Request a year-long token
        });
        const url = `${FITBIT_AUTH_URL}?${params.toString()}`;
        console.log('Generated Auth URL:', url);
        return url;
    }

    async getAccessToken(code) {
        console.log('Getting access token with code:', code);
        
        const params = new URLSearchParams();
        params.append('client_id', this.clientId);
        params.append('grant_type', 'authorization_code');
        params.append('redirect_uri', this.redirectUri);
        params.append('code', code);

        const auth = btoa(`${this.clientId}:${this.clientSecret}`);

        try {
            console.log('Token request:', {
                url: FITBIT_TOKEN_URL,
                params: params.toString(),
                clientId: this.clientId,
                redirectUri: this.redirectUri
            });

            const response = await axios.post(FITBIT_TOKEN_URL, params, {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            console.log('Token response:', {
                status: response.status,
                data: response.data
            });

            return response.data;
        } catch (error) {
            console.error('Token request failed:', {
                status: error.response?.status,
                data: error.response?.data,
                error: error.message
            });
            throw error;
        }
    }

    async getActivityData(date, accessToken) {
        try {
            const response = await axios.get(`${FITBIT_API_BASE_URL}/activities/date/${date}.json`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching activity data:', error.response?.data || error);
            throw error;
        }
    }

    async getHeartRateData(date, accessToken) {
        try {
            const response = await axios.get(`${FITBIT_API_BASE_URL}/activities/heart/date/${date}/1d.json`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching heart rate data:', error.response?.data || error);
            throw error;
        }
    }

    async getProfile(accessToken) {
        try {
            const response = await axios.get(`${FITBIT_API_BASE_URL}/profile.json`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching profile:', error.response?.data || error);
            throw error;
        }
    }
}

const service = new FitbitService();
export default service; 