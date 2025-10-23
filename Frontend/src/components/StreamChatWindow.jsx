/**
 * StreamChatWindow Component
 * Unified Stream.io Chat + Video solution for HealthPath
 * Replaces Socket.io chat and Jitsi video with Stream SDK
 * FIXED: Added incoming video call notifications for callee
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StreamChat } from 'stream-chat';
import {
    Chat,
    Channel,
    ChannelHeader,
    MessageList,
    MessageInput,
    Thread,
    Window,
    useChannelStateContext,
    useMessageContext
} from 'stream-chat-react';
import {
    StreamVideoClient,
    StreamVideo,
    StreamCall,
    CallControls,
    SpeakerLayout,
    useCallStateHooks
} from '@stream-io/video-react-sdk';
import { Video, VideoOff, Phone, PhoneOff, X, MessageSquare, Loader2, PhoneIncoming } from 'lucide-react';
import { initStreamChatChannel, initStreamVideoCall } from '../services/api';
import 'stream-chat-react/dist/css/v2/index.css';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import '../styles/streamChat.css';

// Custom Video Call Button Component
const VideoCallButton = ({ onStartCall, isLoading }) => {
    return (
        <button
            onClick={onStartCall}
            disabled={isLoading}
            className="stream-video-btn flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all shadow-lg disabled:opacity-50"
            title="Start Video Call"
        >
            {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
                <Video className="w-5 h-5" />
            )}
            <span className="hidden sm:inline font-medium">Video Call</span>
        </button>
    );
};

// Custom Channel Header with Video Call
const CustomChannelHeader = ({ partner, onStartCall, isLoadingCall }) => {
    const { channel } = useChannelStateContext();
    const memberCount = Object.keys(channel?.state?.members || {}).length;
    const isOnline = partner?.online || false;

    return (
        <div className="stream-header px-6 py-4 bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-600 flex justify-between items-center relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
            
            <div className="flex items-center space-x-3 relative z-10">
                <div className="relative">
                    <img 
                        src={partner?.image || "https://cdn-icons-png.flaticon.com/512/377/377429.png"} 
                        alt={partner?.name} 
                        className="w-12 h-12 rounded-xl border-2 border-white/30 object-cover shadow-lg" 
                    />
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${isOnline ? 'bg-emerald-400' : 'bg-gray-400'}`}></span>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white leading-tight">{partner?.name || 'Chat'}</h3>
                    <span className="text-xs text-sky-200 font-medium flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-gray-400'}`}></span>
                        {isOnline ? 'Online' : 'Offline'}
                    </span>
                </div>
            </div>
            
            <div className="flex gap-2 relative z-10">
                <VideoCallButton onStartCall={onStartCall} isLoading={isLoadingCall} />
            </div>
        </div>
    );
};

// Video Call Modal Component
const VideoCallModal = ({ call, client, onEnd }) => {
    const [isJoined, setIsJoined] = useState(false);

    const handleJoin = async () => {
        try {
            await call.join({ create: true });
            setIsJoined(true);
        } catch (err) {
            console.error('Failed to join call:', err);
        }
    };

    const handleEnd = async () => {
        try {
            await call.leave();
        } catch (err) {
            console.error('Error leaving call:', err);
        }
        onEnd();
    };

    return (
        <div className="absolute inset-0 z-50 bg-black flex flex-col">
            <StreamVideo client={client}>
                <StreamCall call={call}>
                    {!isJoined ? (
                        // Pre-join screen
                        <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white">
                            <div className="w-24 h-24 bg-gradient-to-br from-sky-500 to-cyan-600 rounded-full flex items-center justify-center mb-6 shadow-2xl">
                                <Video className="w-12 h-12" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Ready to join?</h2>
                            <p className="text-gray-400 mb-8">Start your video consultation</p>
                            <div className="flex gap-4">
                                <button
                                    onClick={onEnd}
                                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleJoin}
                                    className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 rounded-xl font-bold transition-all shadow-lg"
                                >
                                    Join Call
                                </button>
                            </div>
                        </div>
                    ) : (
                        // Active call
                        <div className="flex-1 flex flex-col">
                            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white shrink-0">
                                <span className="font-bold flex items-center gap-2 text-sm">
                                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                                    Live Consultation
                                </span>
                                <button 
                                    onClick={handleEnd} 
                                    className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2"
                                >
                                    <PhoneOff className="w-4 h-4" />
                                    End Call
                                </button>
                            </div>
                            <div className="flex-1 bg-gray-900">
                                <SpeakerLayout />
                            </div>
                            <div className="p-4 bg-gray-900/90 backdrop-blur-sm">
                                <CallControls onLeave={handleEnd} />
                            </div>
                        </div>
                    )}
                </StreamCall>
            </StreamVideo>
        </div>
    );
};

// Incoming Call Notification Component
const IncomingCallNotification = ({ callerName, onAccept, onDecline }) => {
    return (
        <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl border border-gray-700/50">
                <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse shadow-lg shadow-green-500/30">
                        <PhoneIncoming className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">Incoming Video Call</h3>
                    <p className="text-gray-400 mb-6">{callerName || 'Someone'} is calling...</p>
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={onDecline}
                            className="w-14 h-14 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center hover:from-red-600 hover:to-rose-700 transition-all shadow-lg shadow-red-500/30"
                        >
                            <PhoneOff className="w-6 h-6 text-white" />
                        </button>
                        <button
                            onClick={onAccept}
                            className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/30 animate-bounce"
                        >
                            <Phone className="w-6 h-6 text-white" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main StreamChatWindow Component
const StreamChatWindow = ({ partner, currentUser, userType, doctorId, patientId, onEndChat }) => {
    const [chatClient, setChatClient] = useState(null);
    const [videoClient, setVideoClient] = useState(null);
    const [channel, setChannel] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Video call state
    const [activeCall, setActiveCall] = useState(null);
    const [isLoadingCall, setIsLoadingCall] = useState(false);
    const [channelId, setChannelId] = useState(null);
    
    // Incoming call state
    const [incomingCall, setIncomingCall] = useState(null);
    const [incomingCallerName, setIncomingCallerName] = useState('');
    
    // Refs to fix stale closure in useEffect cleanup
    const chatClientRef = useRef(null);
    const videoClientRef = useRef(null);

    // Initialize Stream clients and channel
    useEffect(() => {
        let mounted = true;
        
        const initializeStream = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Get channel data from backend
                const response = await initStreamChatChannel(doctorId, patientId);
                const { apiKey, channelId: chanId, doctor, patient } = response.data;
                
                if (!mounted) return;
                
                setChannelId(chanId);

                // Determine which user data to use based on userType
                const myData = userType === 'doctor' ? doctor : patient;

                // Initialize chat client
                const chat = StreamChat.getInstance(apiKey);
                await chat.connectUser(
                    {
                        id: myData.id,
                        name: myData.name,
                        image: myData.image
                    },
                    myData.token
                );

                // Connect to the channel
                const chatChannel = chat.channel('messaging', chanId);
                await chatChannel.watch();

                if (!mounted) return;

                // Initialize video client
                const video = new StreamVideoClient({
                    apiKey,
                    user: {
                        id: myData.id,
                        name: myData.name,
                        image: myData.image
                    },
                    token: myData.token
                });

                // Store in refs for cleanup
                chatClientRef.current = chat;
                videoClientRef.current = video;
                
                setChatClient(chat);
                setVideoClient(video);
                setChannel(chatChannel);
                setIsLoading(false);

            } catch (err) {
                console.error('Failed to initialize Stream:', err);
                if (mounted) {
                    setError(err.message || 'Failed to connect to chat');
                    setIsLoading(false);
                }
            }
        };

        initializeStream();

        return () => {
            mounted = false;
            // Use refs for cleanup to avoid stale closure
            if (chatClientRef.current) {
                chatClientRef.current.disconnectUser();
            }
            if (videoClientRef.current) {
                videoClientRef.current.disconnectUser();
            }
        };
    }, [doctorId, patientId, userType]);

    // Listen for incoming video calls via channel custom events
    useEffect(() => {
        if (!channel) return;

        const handleCustomEvent = (event) => {
            if (event?.type === 'custom' && event?.custom?.type === 'video_call_invite') {
                const callId = event.custom.callId;
                const callerName = event.custom.callerName || partner?.name || 'Unknown';
                
                // Don't show notification if we already have an active call
                if (activeCall) return;
                
                setIncomingCallerName(callerName);
                
                // Create the call object for the callee
                if (videoClient) {
                    const call = videoClient.call('default', callId);
                    call.getOrCreate().then(() => {
                        setIncomingCall(call);
                    }).catch(err => {
                        console.error('Failed to get incoming call:', err);
                    });
                }
            }
        };

        channel.on('custom', handleCustomEvent);
        
        // Also listen for video_call messages in the channel
        const handleNewMessage = (event) => {
            if (event?.message?.custom?.type === 'video_call' && event?.message?.user?.id !== (userType === 'doctor' ? `doctor_${doctorId}` : `patient_${patientId}`)) {
                const callId = event.message.custom.callId;
                if (!activeCall && videoClient && callId) {
                    const call = videoClient.call('default', callId);
                    call.getOrCreate().then(() => {
                        setIncomingCall(call);
                        setIncomingCallerName(event.message.user?.name || partner?.name || 'Unknown');
                    }).catch(err => {
                        console.error('Failed to get incoming call from message:', err);
                    });
                }
            }
        };

        channel.on('message.new', handleNewMessage);

        return () => {
            channel.off('custom', handleCustomEvent);
            channel.off('message.new', handleNewMessage);
        };
    }, [channel, videoClient, activeCall, partner, userType, doctorId, patientId]);

    // Accept incoming call
    const handleAcceptCall = async () => {
        if (incomingCall) {
            try {
                await incomingCall.join();
                setActiveCall(incomingCall);
                setIncomingCall(null);
                setIncomingCallerName('');
            } catch (err) {
                console.error('Failed to join incoming call:', err);
            }
        }
    };

    // Decline incoming call
    const handleDeclineCall = () => {
        if (incomingCall) {
            incomingCall.leave().catch(() => {});
        }
        setIncomingCall(null);
        setIncomingCallerName('');
    };

    // Start video call
    const handleStartVideoCall = async () => {
        if (!videoClient || !channelId) return;

        try {
            setIsLoadingCall(true);

            // Initialize video call via backend
            const response = await initStreamVideoCall(channelId, doctorId, patientId);
            const { callId, apiKey } = response.data;

            // Create call object
            const call = videoClient.call('default', callId);
            
            // Get or create the call
            await call.getOrCreate();

            setActiveCall(call);

            // Send a message about the video call with callId for the other party
            if (channel) {
                await channel.sendMessage({
                    text: 'ðŸ“¹ Video call started - click to join!',
                    custom: {
                        type: 'video_call',
                        callId: callId
                    }
                });

                // Also send a custom event for real-time notification
                await channel.sendEvent({
                    type: 'custom',
                    custom: {
                        type: 'video_call_invite',
                        callId: callId,
                        callerName: currentUser?.name || (userType === 'doctor' ? 'Doctor' : 'Patient')
                    }
                });
            }

        } catch (err) {
            console.error('Failed to start video call:', err);
            alert('Failed to start video call. Please try again.');
        } finally {
            setIsLoadingCall(false);
        }
    };

    // End video call
    const handleEndVideoCall = () => {
        setActiveCall(null);
    };

    // Handle end chat
    const handleEndChat = () => {
        if (chatClientRef.current) {
            chatClientRef.current.disconnectUser();
        }
        if (videoClientRef.current) {
            videoClientRef.current.disconnectUser();
        }
        if (onEndChat) {
            onEndChat();
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex flex-col h-full bg-white rounded-3xl shadow-xl border border-gray-100 items-center justify-center">
                <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-4 animate-pulse">
                    <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <p className="text-gray-600 font-medium">Connecting to chat...</p>
                <div className="mt-4">
                    <Loader2 className="w-6 h-6 text-sky-600 animate-spin" />
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex flex-col h-full bg-white rounded-3xl shadow-xl border border-gray-100 items-center justify-center p-8">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
                    <X className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Connection Failed</h3>
                <p className="text-gray-600 text-center mb-4">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-all font-medium"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!chatClient || !channel) {
        return null;
    }

    return (
        <div className="stream-chat-window flex flex-col h-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden relative">
            {/* Incoming Call Notification */}
            {incomingCall && !activeCall && (
                <IncomingCallNotification
                    callerName={incomingCallerName}
                    onAccept={handleAcceptCall}
                    onDecline={handleDeclineCall}
                />
            )}

            {/* Video Call Modal */}
            {activeCall && videoClient && (
                <VideoCallModal
                    call={activeCall}
                    client={videoClient}
                    onEnd={handleEndVideoCall}
                />
            )}

            {/* Stream Chat UI */}
            <Chat client={chatClient} theme="str-chat__theme-light">
                <Channel channel={channel}>
                    <Window>
                        <CustomChannelHeader 
                            partner={partner}
                            onStartCall={handleStartVideoCall}
                            isLoadingCall={isLoadingCall}
                        />
                        <MessageList />
                        <MessageInput focus />
                    </Window>
                    <Thread />
                </Channel>
            </Chat>

            {/* End Chat Button - Floating */}
            <button
                onClick={handleEndChat}
                className="absolute top-4 right-4 z-20 p-2.5 bg-red-500/90 backdrop-blur-sm text-white rounded-xl hover:bg-red-600 transition shadow-lg"
                title="End Chat"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
    );
};

export default StreamChatWindow;



