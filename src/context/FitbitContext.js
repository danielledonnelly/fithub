import React, { createContext, useState, useContext, useEffect } from 'react';
import fitbitService from '../services/fitbitService';

const FitbitContext = createContext(null);

export const FitbitProvider = ({ children }) => {
    const [accessToken, setAccessToken] = useState(null);
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('fitbit_token');
        if (token) {
            setAccessToken(token);
            loadProfile(token);
        } else {
            setIsLoading(false);
        }
    }, []);

    const loadProfile = async (token) => {
        try {
            const profileData = await fitbitService.getProfile(token);
            setProfile(profileData.user);
            setIsLoading(false);
        } catch (error) {
            console.error('Error loading profile:', error);
            logout();
            setIsLoading(false);
        }
    };

    const login = () => {
        window.location.href = fitbitService.getAuthUrl();
    };

    const handleCallback = async (code) => {
        try {
            const data = await fitbitService.getAccessToken(code);
            localStorage.setItem('fitbit_token', data.access_token);
            setAccessToken(data.access_token);
            await loadProfile(data.access_token);
        } catch (error) {
            console.error('Error handling callback:', error);
            logout();
        }
    };

    const logout = () => {
        localStorage.removeItem('fitbit_token');
        setAccessToken(null);
        setProfile(null);
    };

    return (
        <FitbitContext.Provider
            value={{
                accessToken,
                profile,
                isLoading,
                login,
                logout,
                handleCallback,
            }}
        >
            {children}
        </FitbitContext.Provider>
    );
};

export const useFitbit = () => {
    const context = useContext(FitbitContext);
    if (!context) {
        throw new Error('useFitbit must be used within a FitbitProvider');
    }
    return context;
};

export default FitbitContext; 