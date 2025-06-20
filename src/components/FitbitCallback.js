import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFitbit } from '../context/FitbitContext';

const FitbitCallback = () => {
    const navigate = useNavigate();
    const { handleCallback } = useFitbit();

    useEffect(() => {
        const handleOAuthCallback = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            
            if (code) {
                await handleCallback(code);
                navigate('/');
            } else {
                console.error('No code found in URL');
                navigate('/');
            }
        };

        handleOAuthCallback();
    }, [handleCallback, navigate]);

    return (
        <div className="container">
            <div className="main-content">
                <h1 className="text-2xl font-bold text-center">
                    Connecting to Fitbit...
                </h1>
            </div>
        </div>
    );
};

export default FitbitCallback; 