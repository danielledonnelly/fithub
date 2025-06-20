import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFitbit } from '../context/FitbitContext';

const FitbitCallback = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { handleCallback } = useFitbit();

    useEffect(() => {
        const handleOAuthCallback = async () => {
            // Log full URL for debugging
            console.log('Callback URL:', window.location.href);
            
            const params = new URLSearchParams(location.search);
            const code = params.get('code');
            const error = params.get('error');
            const errorDescription = params.get('error_description');
            
            if (error) {
                console.error('Fitbit OAuth error:', error, errorDescription);
                navigate('/', { 
                    state: { 
                        error: `Fitbit authentication error: ${errorDescription || error}` 
                    } 
                });
                return;
            }
            
            if (!code) {
                console.error('No code found in URL. Search params:', location.search);
                navigate('/', { 
                    state: { 
                        error: 'Authorization code missing from callback URL' 
                    } 
                });
                return;
            }

            try {
                await handleCallback(code);
                navigate('/');
            } catch (error) {
                console.error('Error during callback handling:', error);
                const errorMessage = error.response?.data?.errors?.[0]?.message 
                    || error.response?.data?.message 
                    || error.message 
                    || 'Failed to complete Fitbit authentication';
                    
                navigate('/', { 
                    state: { 
                        error: `Authentication failed: ${errorMessage}. Please try again.` 
                    } 
                });
            }
        };

        handleOAuthCallback();
    }, [handleCallback, navigate, location]);

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-md mx-auto bg-[#21262d] rounded-lg shadow-lg p-6">
                <h1 className="text-2xl font-bold text-[#f0f6fc] text-center mb-4">
                    Connecting to Fitbit...
                </h1>
                <p className="text-[#8b949e] text-center">
                    Please wait while we complete your authentication.
                </p>
            </div>
        </div>
    );
};

export default FitbitCallback; 