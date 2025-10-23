/**
 * useStreamClient Hook
 * Manages Stream.io video client initialization and cleanup
 */

import { useState, useEffect, useCallback } from 'react';
import { StreamVideoClient } from '@stream-io/video-react-sdk';
import api from '../services/api';

// Store client instance outside component to persist across re-renders
let streamClientInstance = null;

export const useStreamClient = () => {
    const [client, setClient] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userInfo, setUserInfo] = useState(null);

    const initializeClient = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Clean up existing client if any
            if (streamClientInstance) {
                await streamClientInstance.disconnectUser();
                streamClientInstance = null;
            }

            // Get Stream token from backend
            const response = await api.get('/video/token');
            
            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to get video token');
            }

            const { token, apiKey, userId, userName, userImage } = response.data;

            // Create Stream Video Client
            const user = {
                id: userId,
                name: userName,
                image: userImage
            };

            streamClientInstance = new StreamVideoClient({
                apiKey,
                user,
                token
            });

            setClient(streamClientInstance);
            setUserInfo(user);
            console.log('✅ Stream Video Client initialized for:', userName);

        } catch (err) {
            console.error('❌ Stream Client Error:', err);
            setError(err.message || 'Failed to initialize video client');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const disconnectClient = useCallback(async () => {
        try {
            if (streamClientInstance) {
                await streamClientInstance.disconnectUser();
                streamClientInstance = null;
                setClient(null);
                setUserInfo(null);
                console.log('✅ Stream Client disconnected');
            }
        } catch (err) {
            console.error('❌ Disconnect Error:', err);
        }
    }, []);

    useEffect(() => {
        initializeClient();

        return () => {
            // Cleanup on unmount
            disconnectClient();
        };
    }, []);

    return {
        client,
        isLoading,
        error,
        userInfo,
        initializeClient,
        disconnectClient
    };
};

export default useStreamClient;
