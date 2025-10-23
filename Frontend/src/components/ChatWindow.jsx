import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Paperclip, Video, FileText, PhoneIncoming, PhoneOff, CheckCheck } from 'lucide-react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';

const getChatRoomId = (id1, id2) => {
    const sortedIds = [String(id1), String(id2)].sort();
    return `${sortedIds[0]}-${sortedIds[1]}`;
};

const ChatWindow = ({ partner, onEndChat, userRole }) => {
    const { socket, isConnected } = useSocket();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    
    // --- VIDEO CALL STATE ---
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [videoRoomId, setVideoRoomId] = useState(null);
    const [incomingVideoCall, setIncomingVideoCall] = useState(null);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const currentUser = JSON.parse(localStorage.getItem('user'));
    const currentUserId = currentUser?._id || currentUser?.id; 
    const isDoctor = userRole === 'doctor';
    const roomId = getChatRoomId(currentUserId, partner._id);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // 1. Fetch History
    useEffect(() => {
        if (!currentUserId || !partner?._id) return;
        const fetchHistory = async () => {
            try {
                const response = await api.get(`/chat/history/${currentUserId}/${partner._id}`);
                setMessages(response.data);
                scrollToBottom();
            } catch (error) {
                console.error("Failed to fetch chat history:", error);
            }
        };
        fetchHistory();
    }, [currentUserId, partner._id]);

    // 2. Listen for Incoming Messages (FIXED DUPLICATION)
    useEffect(() => {
        if (!socket || !currentUserId || !partner?._id) return;

        socket.emit('join_room', roomId); 

        const handleReceiveMessage = (message) => {
            // FIX: Only add messages from the OTHER person (partner)
            // Messages I send are already added via optimistic update in sendMessage()
            const isFromPartner = String(message.senderId) === String(partner._id);
            const isToMe = String(message.receiverId) === String(currentUserId);
            
            if (isFromPartner && isToMe) {
                // Prevent duplicate by checking if message already exists
                setMessages((prev) => {
                    const isDuplicate = prev.some(m => 
                        m._id === message._id || 
                        (m.timestamp === message.timestamp && m.senderId === message.senderId)
                    );
                    if (isDuplicate) return prev;
                    return [...prev, message];
                });

                // Detect Incoming Video Call
                if (message.attachmentType === 'video_call') {
                    setIncomingVideoCall({
                        meetingId: message.attachmentUrl,
                        senderName: partner.name
                    });
                }
            }
        };

        socket.on('receiveMessage', handleReceiveMessage);

        return () => {
            socket.off('receiveMessage', handleReceiveMessage);
        };
    }, [socket, currentUserId, partner._id, roomId]);

    // Auto-scroll on new messages
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // --- FILE UPLOAD ---
    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/chat/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const { filePath, fileType } = res.data;

            const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const messageData = {
                _id: tempId,
                senderId: currentUserId,
                receiverId: partner._id,
                senderRole: userRole,
                message: '',
                attachmentUrl: filePath,
                attachmentType: fileType,
                timestamp: new Date().toISOString(),
                roomId: roomId, 
            };
            
            // Optimistic Update - add locally first
            setMessages((prev) => [...prev, messageData]);
            
            // Broadcast to partner via socket
            socket.emit('sendMessage', messageData);
            
            // Save to DB via HTTP
            const savedMessage = await api.post('/chat/send', messageData);
            setMessages((prev) => prev.map(m => 
                m._id === tempId ? { ...m, _id: savedMessage.data._id } : m
            ));
        } catch (err) {
            alert("Failed to upload file.");
        } finally {
            setIsUploading(false);
            e.target.value = null;
        }
    };

    // --- VIDEO CALL ---
    const startVideoCall = () => {
        const meetingId = `HealthPath-${Date.now()}`;
        const tempId = `temp-video-${Date.now()}`;
        const messageData = {
            _id: tempId,
            senderId: currentUserId,
            receiverId: partner._id,
            senderRole: userRole,
            message: 'I have started a video call.',
            attachmentUrl: meetingId,
            attachmentType: 'video_call',
            timestamp: new Date().toISOString(),
            roomId: roomId, 
        };
        
        // Add locally, emit to socket, save to DB
        setMessages((prev) => [...prev, messageData]);
        socket.emit('sendMessage', messageData);
        api.post('/chat/send', messageData)
            .then(res => {
                setMessages((prev) => prev.map(m => 
                    m._id === tempId ? { ...m, _id: res.data._id } : m
                ));
            })
            .catch(err => console.error(err));
        
        setVideoRoomId(meetingId);
        setShowVideoModal(true);
    };

    const acceptVideoCall = () => {
        if (incomingVideoCall) {
            setVideoRoomId(incomingVideoCall.meetingId);
            setShowVideoModal(true);
            setIncomingVideoCall(null);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (input.trim() === '' || !socket || !isConnected) return;

        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const messageData = {
            _id: tempId, // Temporary ID for tracking
            senderId: currentUserId,
            receiverId: partner._id,
            senderRole: userRole,
            message: input.trim(),
            attachmentUrl: null,
            attachmentType: 'none',
            timestamp: new Date().toISOString(),
            roomId: roomId, 
        };

        // 1. Add to local UI immediately (optimistic update)
        setMessages((prev) => [...prev, messageData]);
        setInput('');
        
        // 2. Emit to socket for real-time delivery to partner
        socket.emit('sendMessage', messageData);
        
        // 3. Save to DB via HTTP (single source of truth)
        try {
            const savedMessage = await api.post('/chat/send', messageData);
            // Update the temp message with real _id from DB
            setMessages((prev) => prev.map(m => 
                m._id === tempId ? { ...m, _id: savedMessage.data._id } : m
            ));
        } catch (err) {
            console.error('Failed to save message:', err);
            // Mark message as failed (optional: add error state to message)
        }
    };

    const handleEndChat = async () => {
        if (!window.confirm("Are you sure you want to end this consultation?")) return;
        try {
            if (isDoctor) {
                await api.put('/doctor/status', { status: 'free' });
            }
            if (socket) {
                socket.emit('endConsultation', { partnerId: partner._id });
            }
            onEndChat();
        } catch (err) {
            onEndChat();
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderAttachment = (url, type) => {
        if (type === 'video_call') {
            return (
                <div className="bg-sky-50 border border-sky-200 p-3 rounded-xl mb-2 flex flex-col items-center text-center">
                    <div className="bg-sky-100 p-2 rounded-full mb-2">
                        <Video className="w-6 h-6 text-sky-600" />
                    </div>
                    <p className="text-sm font-bold text-sky-800 mb-2">Video Consultation Invite</p>
                    <button onClick={() => { setVideoRoomId(url); setShowVideoModal(true); }} className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-sky-700 transition w-full">Join Call</button>
                </div>
            );
        }
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const baseURL = isLocalhost ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;
        const fullUrl = url.startsWith('http') ? url : `${baseURL}${url}`;
        
        if (type === 'image') {
            return (
                <div className="mb-2 rounded-lg overflow-hidden border border-gray-200">
                    <a href={fullUrl} target="_blank" rel="noopener noreferrer"><img src={fullUrl} alt="attachment" className="max-w-full max-h-60 object-cover cursor-pointer hover:opacity-90 transition" /></a>
                </div>
            );
        }
        if (type === 'pdf') {
            return (
                <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-gray-100 p-3 rounded-lg text-blue-600 hover:bg-gray-200 transition mb-2">
                    <FileText className="w-5 h-5" /><span className="text-sm underline font-semibold">View Medical Report (PDF)</span>
                </a>
            );
        }
        return null;
    };

    return (
        // KEY FIX: 'h-full' and 'min-h-0' are crucial for nested flex scrolling
        <div className="flex flex-col h-full min-h-0 bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden relative">
            
            {/* INCOMING CALL MODAL */}
            {incomingVideoCall && !showVideoModal && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white animate-in fade-in zoom-in duration-300">
                    <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center mb-6 animate-bounce shadow-[0_0_30px_rgba(34,197,94,0.6)]">
                        <PhoneIncoming className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold mb-2">{incomingVideoCall.senderName}</h2>
                    <p className="text-gray-300 mb-10 text-lg">is requesting a video call...</p>
                    <div className="flex gap-8">
                        <button onClick={() => setIncomingVideoCall(null)} className="flex flex-col items-center gap-2 group"><div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center transition transform group-hover:scale-110 shadow-lg shadow-red-500/30"><PhoneOff className="w-8 h-8" /></div><span className="text-sm font-medium text-gray-300">Decline</span></button>
                        <button onClick={acceptVideoCall} className="flex flex-col items-center gap-2 group"><div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center transition transform group-hover:scale-110 animate-pulse shadow-lg shadow-emerald-500/30"><Video className="w-8 h-8" /></div><span className="text-sm font-medium text-gray-300">Accept</span></button>
                    </div>
                </div>
            )}

            {/* VIDEO ROOM MODAL */}
            {showVideoModal && videoRoomId && (
                <div className="absolute inset-0 z-50 bg-black flex flex-col">
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white shrink-0">
                        <span className="font-bold flex items-center gap-2 text-sm md:text-base"><span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span> Live Consultation</span>
                        <button onClick={() => setShowVideoModal(false)} className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-lg">End Call</button>
                    </div>
                    <iframe allow="camera; microphone; fullscreen; display-capture; autoplay" src={`https://meet.jit.si/${videoRoomId}?config.prejoinPageEnabled=false&userInfo.displayName=${encodeURIComponent(currentUser.name)}`} className="flex-1 w-full h-full border-none" title="Video Call"></iframe>
                </div>
            )}

            {/* HEADER */}
            <div className="px-6 py-4 bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-600 flex justify-between items-center shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                <div className="flex items-center space-x-3 relative z-10">
                    <div className="relative">
                        <img src={partner.image || "https://cdn-icons-png.flaticon.com/512/377/377429.png"} alt={partner.name} className="w-12 h-12 rounded-xl border-2 border-white/30 object-cover shadow-lg" />
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${isConnected ? 'bg-emerald-400' : 'bg-gray-400'}`}></span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white leading-tight">{partner.name}</h3>
                        <span className="text-xs text-sky-200 font-medium flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-gray-400'}`}></span>
                            {isConnected ? 'Online' : 'Connecting...'}
                        </span>
                    </div>
                </div>
                <div className="flex gap-2 relative z-10">
                    <button onClick={startVideoCall} className="p-2.5 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition shadow-lg" title="Start Video Call"><Video className="w-5 h-5" /></button>
                    <button onClick={handleEndChat} className="p-2.5 bg-red-500/20 backdrop-blur-sm text-white rounded-xl hover:bg-red-500/40 transition" title="End Chat"><X className="w-5 h-5" /></button>
                </div>
            </div>

            {/* MESSAGES AREA - FIXED SCROLLING */}
            {/* min-h-0 is the magic CSS property that stops flex children from overflowing parent */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white min-h-0 custom-scrollbar">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                            <MessageSquare className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-medium">No messages yet. Start the conversation!</p>
                    </div>
                )}
                {messages.map((msg, index) => {
                    const isMe = String(msg.senderId) === String(currentUserId);
                    return (
                        <div key={msg._id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 fade-in duration-300`}>
                            <div className={`max-w-[75%] p-4 rounded-2xl shadow-sm relative text-sm ${isMe ? 'bg-gradient-to-br from-sky-600 to-cyan-600 text-white rounded-br-sm' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm shadow-md'}`}>
                                {msg.attachmentUrl && renderAttachment(msg.attachmentUrl, msg.attachmentType)}
                                {msg.message && <p className="leading-relaxed">{msg.message}</p>}
                                <div className={`flex items-center justify-end gap-1.5 mt-2 ${isMe ? 'text-sky-200' : 'text-gray-400'}`}>
                                    <span className="text-[10px] font-medium">{formatTime(msg.timestamp)}</span>
                                    {isMe && <CheckCheck className="w-3.5 h-3.5" />}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* INPUT AREA */}
            <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-100 flex items-center gap-3 shrink-0">
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept="image/*,application/pdf" />
                
                <button type="button" onClick={() => fileInputRef.current.click()} disabled={isUploading || !isConnected} className="p-3 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 transition-all" title="Attach File">
                    {isUploading ? <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div> : <Paperclip className="w-5 h-5" />}
                </button>
                
                <input 
                    type="text" 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    placeholder={isUploading ? "Uploading..." : "Type your message..."} 
                    className="flex-1 px-4 py-3 bg-gray-100 border-2 border-transparent focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 rounded-xl transition-all outline-none text-sm font-medium placeholder-gray-400"
                    disabled={!isConnected || isUploading} 
                />
                
                <button type="submit" disabled={!isConnected || (input.trim() === '' && !isUploading)} className="bg-gradient-to-r from-sky-600 to-cyan-600 text-white p-3 rounded-xl hover:shadow-lg hover:shadow-sky-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95">
                    <Send className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
};

export default ChatWindow;

