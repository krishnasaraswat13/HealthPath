/**
 * VideoCallUI Component
 * Renders the video call interface using Stream.io SDK
 */

import React, { useState } from 'react';
import {
    StreamVideo,
    StreamCall,
    CallControls,
    SpeakerLayout,
    StreamTheme,
    useCallStateHooks
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import '../styles/videoCall.css'; // Custom overrides for dark theme
import { MessageSquare, Users, Wifi, WifiOff, Loader2 } from 'lucide-react';

// Call Status Component
const CallStatus = () => {
    const { useCallCallingState, useParticipantCount } = useCallStateHooks();
    const callingState = useCallCallingState();
    const participantCount = useParticipantCount();

    const isConnected = callingState === 'joined';

    return (
        <div className="absolute top-4 left-4 flex items-center gap-4 z-10">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                <span className="text-sm font-medium">
                    {callingState === 'joined' ? 'Connected' : callingState === 'joining' ? 'Connecting...' : callingState}
                </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-700/50 text-gray-300">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">{participantCount}</span>
            </div>
        </div>
    );
};

// Main Video Call UI
const VideoCallUI = ({ client, call, onLeave, appointmentInfo }) => {
    const [showChat, setShowChat] = useState(false);

    if (!client || !call) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-sky-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Initializing video call...</p>
                </div>
            </div>
        );
    }

    const handleLeave = async () => {
        try {
            await call.leave();
            if (onLeave) onLeave();
        } catch (err) {
            console.error('Error leaving call:', err);
            if (onLeave) onLeave();
        }
    };

    return (
        <StreamVideo client={client}>
            <StreamTheme>
                <StreamCall call={call}>
                    <div className="h-screen bg-gray-900 relative flex">
                        {/* Main Video Area */}
                        <div className={`flex-1 relative transition-all duration-300 ${showChat ? 'mr-80' : ''}`}>
                            {/* Call Status Overlay */}
                            <CallStatus />

                            {/* Appointment Info */}
                            {appointmentInfo && (
                                <div className="absolute top-4 right-4 z-10 bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-xl">
                                    <p className="text-white text-sm font-medium">
                                        {appointmentInfo.doctorName || appointmentInfo.patientName}
                                    </p>
                                    <p className="text-gray-400 text-xs">
                                        {appointmentInfo.timeSlot}
                                    </p>
                                </div>
                            )}

                            {/* Video Layout */}
                            <div className="h-full pt-16 pb-24">
                                <SpeakerLayout participantsBarPosition="bottom" />
                            </div>

                            {/* Controls */}
                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-gray-900/90 to-transparent">
                                <div className="flex items-center justify-center gap-4">
                                    <CallControls onLeave={handleLeave} />
                                    
                                    {/* Chat Toggle Button */}
                                    <button
                                        onClick={() => setShowChat(!showChat)}
                                        className={`p-4 rounded-full transition-colors ${
                                            showChat 
                                                ? 'bg-sky-600 text-white' 
                                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                    >
                                        <MessageSquare className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Chat Sidebar (using existing Socket.io chat) */}
                        {showChat && (
                            <div className="absolute right-0 top-0 bottom-0 w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
                                <div className="p-4 border-b border-gray-700">
                                    <h3 className="text-white font-semibold flex items-center gap-2">
                                        <MessageSquare className="w-5 h-5" />
                                        Chat
                                    </h3>
                                </div>
                                <div className="flex-1 p-4 overflow-y-auto">
                                    <p className="text-gray-400 text-sm text-center">
                                        Chat messages will appear here.
                                        <br />
                                        <span className="text-xs">
                                            (Using existing Socket.io chat)
                                        </span>
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </StreamCall>
            </StreamTheme>
        </StreamVideo>
    );
};

export default VideoCallUI;

