const express = require('express');
const router = express.Router();
const axios = require('axios');

const FITBIT_API_BASE = 'https://api.fitbit.com/1/user/-';
const FITBIT_TOKEN_URL = 'https://api.fitbit.com/oauth2/token';

// Helper function to encode in base64
const btoa = (str) => Buffer.from(str).toString('base64');

// Exchange authorization code for access token
router.post('/token', async (req, res) => {
    try {
        const { code } = req.body;
        
        const params = new URLSearchParams();
        params.append('client_id', process.env.FITBIT_CLIENT_ID);
        params.append('grant_type', 'authorization_code');
        params.append('redirect_uri', process.env.FITBIT_REDIRECT_URI);
        params.append('code', code);

        const auth = btoa(`${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`);

        const response = await axios.post(FITBIT_TOKEN_URL, params, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Token exchange error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: 'Failed to exchange token',
            details: error.response?.data || error.message
        });
    }
});

// Get user's activities for a specific date
router.get('/activities/:date', async (req, res) => {
    try {
        const response = await axios.get(
            `${FITBIT_API_BASE}/activities/date/${req.params.date}.json`,
            {
                headers: {
                    'Authorization': req.headers.authorization
                }
            }
        );
        res.json(response.data);
    } catch (error) {
        console.error('Activity fetch error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: 'Failed to fetch activities',
            details: error.response?.data || error.message
        });
    }
});

// Get user's heart rate data for a specific date
router.get('/heartrate/:date', async (req, res) => {
    try {
        const response = await axios.get(
            `${FITBIT_API_BASE}/activities/heart/date/${req.params.date}/1d.json`,
            {
                headers: {
                    'Authorization': req.headers.authorization
                }
            }
        );
        res.json(response.data);
    } catch (error) {
        console.error('Heart rate fetch error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: 'Failed to fetch heart rate data',
            details: error.response?.data || error.message
        });
    }
});

// Get user's profile
router.get('/profile', async (req, res) => {
    try {
        const response = await axios.get(
            `${FITBIT_API_BASE}/profile.json`,
            {
                headers: {
                    'Authorization': req.headers.authorization
                }
            }
        );
        res.json(response.data);
    } catch (error) {
        console.error('Profile fetch error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: 'Failed to fetch profile',
            details: error.response?.data || error.message
        });
    }
});

module.exports = router; 