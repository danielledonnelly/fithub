import axios from 'axios';

const FITBIT_AUTH_URL = 'https://www.fitbit.com/oauth2/authorize';
const FITBIT_TOKEN_URL = 'https://api.fitbit.com/oauth2/token';
const FITBIT_API_BASE_URL = 'https://api.fitbit.com/1/user/-';

class FitbitService {
    constructor() {
        this.clientId = process.env.REACT_APP_FITBIT_CLIENT_ID;
        this.clientSecret = process.env.REACT_APP_FITBIT_CLIENT_SECRET;
        this.redirectUri = process.env.REACT_APP_FITBIT_REDIRECT_URI;
        this.scope = process.env.REACT_APP_FITBIT_SCOPE;
    }

    getAuthUrl() {
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            scope: this.scope,
        });
        return `${FITBIT_AUTH_URL}?${params.toString()}`;
    }

    async getAccessToken(code) {
        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: this.redirectUri,
        });

        const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

        try {
            const response = await axios.post(FITBIT_TOKEN_URL, params, {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error getting access token:', error);
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
            console.error('Error fetching activity data:', error);
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
            console.error('Error fetching heart rate data:', error);
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
            console.error('Error fetching profile:', error);
            throw error;
        }
    }
}

export default new FitbitService(); 