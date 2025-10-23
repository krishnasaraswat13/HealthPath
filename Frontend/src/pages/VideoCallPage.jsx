/**
 * VideoCallPage
 * Main page for doctor-patient video consultations using Stream.io
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { StreamVideoClient } from '@stream-io/video-react-sdk';
import VideoCallUI from '../components/VideoCallUI';
import api from '../services/api';
import { 
    Video, 
    VideoOff, 
    Mic, 
    MicOff, 
    Loader2, 
    AlertCircle, 
    ArrowLeft,
    Phone
} from 'lucide-react';

const VideoCallPage = () => {
    const navigate = useNavigate();
    const { appointmentId } = useParams();
    const location = useLocation();
    
    // State
    const [client, setClient] = useState(null);
    const [call, setCall] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stage, setStage] = useState('loading'); // loading, preview, call, ended
    
    // Preview controls
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isMicOn, setIsMicOn] = useState(true);
    
    // Appointment info from navigation state
    const appointmentInfo = location.state?.appointmentInfo || {};
    const user = JSON.parse(localStorage.getItem('user'));
    const userRole = user?.role;

    // Initialize Stream client and create/join call
    useEffect(() => {
        let mounted = true;
        let streamClient = null;

        const initializeCall = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Step 1: Get Stream token
                const tokenResponse = await api.get('/video/token');
                if (!tokenResponse.data.success) {
                    throw new Error(tokenResponse.data.message || 'Failed to get video token');
                }

                const { token, apiKey, userId, userName, userImage } = tokenResponse.data;

                // Step 2: Initialize call via backend
                const callResponse = await api.post('/video/call/init', { appointmentId });
                if (!callResponse.data.success) {
                    throw new Error(callResponse.data.message || 'Failed to initialize call');
                }

                const { callId } = callResponse.data;

                // Step 3: Create Stream Video Client
                streamClient = new StreamVideoClient({
                    apiKey,
                    user: { id: userId, name: userName, image: userImage },
                    token
                });

                if (!mounted) return;

                // Step 4: Create call instance
                const videoCall = streamClient.call('default', callId);

                setClient(streamClient);
                setCall(videoCall);
                setStage('preview');
                console.log('âœ… Video call ready:', callId);

            } catch (err) {
                console.error('âŒ Video Init Error:', err);
                if (mounted) {
                    setError(err.response?.data?.message || err.message || 'Failed to initialize video call');
                }
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        if (appointmentId) {
            initializeCall();
        } else {
            setError('No appointment ID provided');
            setIsLoading(false);
        }

        // Cleanup
        return () => {
            mounted = false;
            if (streamClient) {
                streamClient.disconnectUser().catch(console.error);
            }
        };
    }, [appointmentId]);

    // Join the call
    const handleJoinCall = async () => {
        try {
            setIsLoading(true);
            
            await call.join({ create: true });
            
            // Apply initial A/V settings
            if (!isCameraOn) {
                await call.camera.disable();
            }
            if (!isMicOn) {
                await call.microphone.disable();
            }
            
            setStage('call');
        } catch (err) {
            console.error('âŒ Join Error:', err);
            setError('Failed to join the call. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Leave the call
    const handleLeaveCall = async () => {
        try {
            // Notify backend
            await api.post('/video/call/end', { appointmentId });
        } catch (err) {
            console.error('End call notification failed:', err);
        }

        // Navigate back based on role
        if (userRole === 'doctor') {
            navigate('/doctor/dashboard');
        } else {
            navigate('/patient/dashboard');
        }
    };

    // Go back
    const handleGoBack = () => {
        if (userRole === 'doctor') {
            navigate('/doctor/dashboard');
        } else {
            navigate('/patient/dashboard');
        }
    };

    // Loading state
    if (isLoading && stage === 'loading') {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-16 h-16 text-sky-500 animate-spin mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-white mb-2">Setting up your call...</h2>
                    <p className="text-gray-400">Please wait while we connect you</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">Unable to Start Call</h2>
                    <p className="text-gray-400 mb-8">{error}</p>
                    <button
                        onClick={handleGoBack}
                        className="px-6 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition flex items-center gap-2 mx-auto"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    // Preview stage
    if (stage === 'preview') {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <div className="max-w-lg w-full">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">Ready to Join?</h1>
                        <p className="text-gray-400">
                            {appointmentInfo.doctorName 
                                ? `Video consultation with Dr. ${appointmentInfo.doctorName}`
                                : appointmentInfo.patientName
                                    ? `Video consultation with ${appointmentInfo.patientName}`
                                    : 'Video Consultation'
                            }
                        </p>
                    </div>

                    {/* Preview Card */}
                    <div className="bg-gray-800 rounded-3xl p-6 mb-6">
                        {/* Video Preview Area */}
                        <div className="aspect-video bg-gray-900 rounded-2xl mb-6 flex items-center justify-center overflow-hidden relative">
                            {isCameraOn ? (
                                <div className="text-center">
                                    <div className="w-24 h-24 bg-sky-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-3xl font-bold text-white">
                                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                    <p className="text-gray-400 text-sm">Camera preview will appear during call</p>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <VideoOff className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                    <p className="text-gray-500">Camera is off</p>
                                </div>
                            )}
                        </div>

                        {/* A/V Controls */}
                        <div className="flex justify-center gap-4 mb-6">
                            <button
                                onClick={() => setIsMicOn(!isMicOn)}
                                className={`p-4 rounded-full transition-colors ${
                                    isMicOn 
                                        ? 'bg-gray-700 text-white hover:bg-gray-600' 
                                        : 'bg-red-600 text-white hover:bg-red-500'
                                }`}
                            >
                                {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                            </button>
                            <button
                                onClick={() => setIsCameraOn(!isCameraOn)}
                                className={`p-4 rounded-full transition-colors ${
                                    isCameraOn 
                                        ? 'bg-gray-700 text-white hover:bg-gray-600' 
                                        : 'bg-red-600 text-white hover:bg-red-500'
                                }`}
                            >
                                {isCameraOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                            </button>
                        </div>

                        {/* Join Button */}
                        <button
                            onClick={handleJoinCall}
                            disabled={isLoading}
                            className="w-full py-4 bg-gradient-to-r from-sky-600 to-cyan-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    Joining...
                                </>
                            ) : (
                                <>
                                    <Phone className="w-6 h-6" />
                                    Join Call
                                </>
                            )}
                        </button>
                    </div>

                    {/* Cancel Button */}
                    <button
                        onClick={handleGoBack}
                        className="w-full py-3 text-gray-400 hover:text-white transition flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Cancel and Go Back
                    </button>
                </div>
            </div>
        );
    }

    // Active call stage
    if (stage === 'call') {
        return (
            <VideoCallUI
                client={client}
                call={call}
                onLeave={handleLeaveCall}
                appointmentInfo={appointmentInfo}
            />
        );
    }

    return null;
};

export default VideoCallPage;

