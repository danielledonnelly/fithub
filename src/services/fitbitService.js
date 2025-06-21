import axios from 'axios';

const FITBIT_AUTH_URL = 'https://www.fitbit.com/oauth2/authorize';
const API_BASE_URL = '/api'; // Our backend proxy

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
        try {
            const response = await axios.post(`${API_BASE_URL}/fitbit/token`, { code });
            return response.data;
        } catch (error) {
            console.error('Error getting access token:', error);
            throw error;
        }
    }

    async getActivityData(date, accessToken) {
        try {
            const response = await axios.get(`${API_BASE_URL}/fitbit/activities/${date}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching activity data:', error);
            throw error;
        }
    }

    async getHeartRateData(date, accessToken) {
        try {
            const response = await axios.get(`${API_BASE_URL}/fitbit/heartrate/${date}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching heart rate data:', error);
            throw error;
        }
    }

    async getProfile(accessToken) {
        try {
            const response = await axios.get(`${API_BASE_URL}/fitbit/profile`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching profile:', error);
            throw error;
        }
    }
}

const service = new FitbitService();
export default service; 